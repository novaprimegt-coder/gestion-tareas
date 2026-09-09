(function(){
'use strict';
if(window.__tfFirestoreSyncV109)return;window.__tfFirestoreSyncV109=true;

const PROJECT_ID='taskflow-b0ece';
const DB='(default)';
const API='https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(PROJECT_ID)+'/databases/'+encodeURIComponent(DB)+'/documents';
const SOURCE_KEYS=['taskflow_db_v26','taskflow_503020_v1','taskflow_share_reward_claimed_v1','taskflow_share_count_v1'];
const MAIN_KEY='taskflow_db_v26';
const MAIN_BACKUP='taskflow_db_v26_backup';
const MAIN_RECOVERY='taskflow_db_v26_recovery';
const FIN_KEY='taskflow_503020_v1';
const FIN_BACKUP='taskflow_503020_v1_backup';
const BOUND_KEY='taskflow_cloud_bound_uid_v1';
const TOUCH_KEY='taskflow_cloud_local_touch_v1';
const META_PREFIX='taskflow_cloud_sync_meta_v1_';
const CHUNK_SIZE=120000;
const SAVE_DELAY=1400;

let currentUid=null;
let applying=false;
let dirty=false;
let saveTimer=0;
let syncing=null;
let initialized=false;
let remoteUnsubscribe=null;
let firestoreDb=null;
let nativeSetItem=Storage.prototype.setItem;
let nativeRemoveItem=Storage.prototype.removeItem;

function log(){try{console.info.apply(console,['TaskFlow Sync V109:'].concat([].slice.call(arguments)))}catch(_){}}
function warn(){try{console.warn.apply(console,['TaskFlow Sync V109:'].concat([].slice.call(arguments)))}catch(_){}}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function safeGet(k){try{return localStorage.getItem(k)}catch(_){return null}}
function nativeSet(k,v){try{nativeSetItem.call(localStorage,k,String(v));return true}catch(_){return false}}
function nativeRemove(k){try{nativeRemoveItem.call(localStorage,k);return true}catch(_){return false}}
function metaKey(uid){return META_PREFIX+uid}
function readJson(k){try{return JSON.parse(safeGet(k)||'null')}catch(_){return null}}
function writeJsonNative(k,v){return nativeSet(k,JSON.stringify(v))}
function now(){return Date.now()}
function loadScript(src){return new Promise((resolve,reject)=>{if([...document.scripts].some(s=>s.src===src))return resolve();const el=document.createElement('script');el.src=src;el.async=false;el.onload=resolve;el.onerror=()=>reject(new Error('SDK_LOAD_FAILED'));document.head.appendChild(el)})}

function fnv1a(str){let h=0x811c9dc5;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193)}return ('00000000'+(h>>>0).toString(16)).slice(-8)}
function capture(){const values={};let joined='';SOURCE_KEYS.forEach(k=>{const v=safeGet(k)||'';values[k]=v;joined+=k+'\u0000'+v+'\u0001'});return{values,hash:fnv1a(joined),updatedAt:localUpdatedAt()}}
function localUpdatedAt(){let t=Number(safeGet(TOUCH_KEY))||0;for(const k of [MAIN_KEY,FIN_KEY]){const x=readJson(k);if(x&&typeof x==='object'){t=Math.max(t,Number(x.savedAt)||0,Number(x.data&&x.data.savedAt)||0)}}return t||now()}
function readMeta(uid){const x=readJson(metaKey(uid));return x&&typeof x==='object'?x:null}
function writeMeta(uid,data){writeJsonNative(metaKey(uid),data)}
function setBound(uid){nativeSet(BOUND_KEY,uid||'')}
function getBound(){return safeGet(BOUND_KEY)||''}

function encDocId(k){return 'k_'+Array.from(new TextEncoder().encode(k)).map(b=>b.toString(16).padStart(2,'0')).join('')}
function chunks(str){const a=[];for(let i=0;i<str.length;i+=CHUNK_SIZE)a.push(str.slice(i,i+CHUNK_SIZE));return a.length?a:['']}
function fv(v){if(v===null)return{nullValue:null};if(typeof v==='boolean')return{booleanValue:v};if(typeof v==='number')return Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v};return{stringValue:String(v)}}
function fields(obj){const out={};Object.keys(obj).forEach(k=>out[k]=fv(obj[k]));return out}
function fromField(v){if(!v)return null;if('stringValue'in v)return v.stringValue;if('integerValue'in v)return Number(v.integerValue);if('doubleValue'in v)return Number(v.doubleValue);if('booleanValue'in v)return !!v.booleanValue;if('nullValue'in v)return null;return null}
function decodeFields(doc){const o={};const f=doc&&doc.fields||{};Object.keys(f).forEach(k=>o[k]=fromField(f[k]));return o}

async function token(force){if(!window.TaskFlowFirebase||typeof window.TaskFlowFirebase.getIdToken!=='function')return null;return window.TaskFlowFirebase.getIdToken(!!force)}
async function request(url,opt,retry=true){const idt=await token(false);if(!idt)throw new Error('AUTH_REQUIRED');const options=Object.assign({},opt||{});options.headers=Object.assign({'Authorization':'Bearer '+idt,'Content-Type':'application/json'},options.headers||{});let r=await fetch(url,options);if(r.status===401&&retry){const fresh=await token(true);if(fresh){options.headers.Authorization='Bearer '+fresh;r=await fetch(url,options)}}if(r.status===404)return null;const body=await r.json().catch(()=>({}));if(!r.ok){const msg=body&&body.error&&body.error.message||('HTTP '+r.status);throw new Error(msg)}return body}
async function getDoc(path){return request(API+'/'+path,{method:'GET'})}
async function putDoc(path,obj){const name='projects/'+PROJECT_ID+'/databases/'+DB+'/documents/'+path;return request(API+'/'+path,{method:'PATCH',body:JSON.stringify({name,fields:fields(obj)})})}

function manifestPath(uid){return 'users/'+encodeURIComponent(uid)+'/sync/manifest'}
function slotBase(uid,slot){return 'users/'+encodeURIComponent(uid)+'/syncSlots/'+slot}
async function readManifest(uid){const d=await getDoc(manifestPath(uid));if(!d)return null;const x=decodeFields(d);if(!x.activeSlot||!x.revision)return null;return{activeSlot:String(x.activeSlot),revision:Number(x.revision)||0,hash:String(x.hash||''),clientUpdatedAt:Number(x.clientUpdatedAt)||0,schemaVersion:Number(x.schemaVersion)||1}}

async function uploadSnapshot(uid,snapshot,remote){const oldSlot=remote&&remote.activeSlot==='a'?'a':remote&&remote.activeSlot==='b'?'b':null;const slot=oldSlot==='a'?'b':'a';const rev=Math.max(Number(remote&&remote.revision)||0,Number(readMeta(uid)&&readMeta(uid).lastRemoteRevision)||0)+1;const base=slotBase(uid,slot);for(const key of SOURCE_KEYS){const raw=snapshot.values[key]||'';const parts=chunks(raw);const kid=encDocId(key);for(let i=0;i<parts.length;i++){await putDoc(base+'/keys/'+kid+'/chunks/c'+String(i).padStart(5,'0'),{revision:rev,index:i,payload:parts[i]})}await putDoc(base+'/keys/'+kid,{revision:rev,key:key,chunkCount:parts.length,length:raw.length,hash:fnv1a(raw)})}
await putDoc(manifestPath(uid),{activeSlot:slot,revision:rev,hash:snapshot.hash,clientUpdatedAt:snapshot.updatedAt||now(),schemaVersion:1,appVersion:'109'});
const m={lastRemoteRevision:rev,lastSyncedHash:snapshot.hash,lastSyncedAt:now(),lastRemoteClientUpdatedAt:snapshot.updatedAt||now()};writeMeta(uid,m);setBound(uid);dirty=false;log('subida completada',rev);return m}

async function downloadSnapshot(uid,manifest){const base=slotBase(uid,manifest.activeSlot);const values={};for(const key of SOURCE_KEYS){const kid=encDocId(key);const kd=await getDoc(base+'/keys/'+kid);if(!kd){values[key]='';continue}const km=decodeFields(kd),count=Math.max(0,Number(km.chunkCount)||0);const arr=[];for(let i=0;i<count;i++){const cd=await getDoc(base+'/keys/'+kid+'/chunks/c'+String(i).padStart(5,'0'));if(!cd)throw new Error('SYNC_CHUNK_MISSING');arr.push(String(decodeFields(cd).payload||''))}values[key]=arr.join('')}return{values,hash:manifest.hash||hashValues(values),updatedAt:manifest.clientUpdatedAt||now()}}
function hashValues(values){let joined='';SOURCE_KEYS.forEach(k=>joined+=k+'\u0000'+(values[k]||'')+'\u0001');return fnv1a(joined)}

function applySnapshot(uid,snapshot,manifest){applying=true;try{const v=snapshot.values||{};const main=v[MAIN_KEY]||'';const fin=v[FIN_KEY]||'';if(main){nativeSet(MAIN_KEY,main);nativeSet(MAIN_BACKUP,main);nativeSet(MAIN_RECOVERY,main)}else{nativeRemove(MAIN_KEY);nativeRemove(MAIN_BACKUP);nativeRemove(MAIN_RECOVERY)}if(fin){nativeSet(FIN_KEY,fin);nativeSet(FIN_BACKUP,fin)}else{nativeRemove(FIN_KEY);nativeRemove(FIN_BACKUP)}for(const k of ['taskflow_share_reward_claimed_v1','taskflow_share_count_v1']){if(v[k])nativeSet(k,v[k]);else nativeRemove(k)}nativeSet(TOUCH_KEY,String(snapshot.updatedAt||now()));setBound(uid);writeMeta(uid,{lastRemoteRevision:Number(manifest&&manifest.revision)||0,lastSyncedHash:snapshot.hash||hashValues(v),lastSyncedAt:now(),lastRemoteClientUpdatedAt:Number(manifest&&manifest.clientUpdatedAt)||snapshot.updatedAt||now()})}finally{applying=false;dirty=false}}

function clearLiveForNewAccount(uid){applying=true;try{[MAIN_KEY,MAIN_BACKUP,MAIN_RECOVERY,FIN_KEY,FIN_BACKUP,'taskflow_share_reward_claimed_v1','taskflow_share_count_v1'].forEach(nativeRemove);nativeSet(TOUCH_KEY,String(now()));setBound(uid);writeMeta(uid,{lastRemoteRevision:0,lastSyncedHash:'',lastSyncedAt:0,lastRemoteClientUpdatedAt:0})}finally{applying=false}}

async function reconcile(uid){if(!uid)return;const remote=await readManifest(uid);const local=capture();const bound=getBound();const meta=readMeta(uid);
if(!remote){if(bound&&bound!==uid){log('cuenta nueva en dispositivo previamente vinculado; estado local limpio');clearLiveForNewAccount(uid);location.reload();return}await uploadSnapshot(uid,local,null);return}
if(bound!==uid){const snap=await downloadSnapshot(uid,remote);applySnapshot(uid,snap,remote);log('restaurando cuenta en este dispositivo');location.reload();return}
if(!meta){if(remote.clientUpdatedAt>local.updatedAt){const snap=await downloadSnapshot(uid,remote);applySnapshot(uid,snap,remote);location.reload();return}await uploadSnapshot(uid,local,remote);return}
const localChanged=local.hash!==String(meta.lastSyncedHash||'');const remoteChanged=Number(remote.revision)>Number(meta.lastRemoteRevision||0)||remote.hash!==String(meta.lastSyncedHash||'');
if(!localChanged&&!remoteChanged){writeMeta(uid,Object.assign({},meta,{lastRemoteRevision:remote.revision,lastSyncedHash:remote.hash||local.hash,lastRemoteClientUpdatedAt:remote.clientUpdatedAt||0}));dirty=false;return}
if(!localChanged&&remoteChanged){const snap=await downloadSnapshot(uid,remote);applySnapshot(uid,snap,remote);location.reload();return}
if(localChanged&&!remoteChanged){await uploadSnapshot(uid,local,remote);return}
if((remote.clientUpdatedAt||0)>(local.updatedAt||0)){const snap=await downloadSnapshot(uid,remote);applySnapshot(uid,snap,remote);location.reload();return}
await uploadSnapshot(uid,local,remote)
}

function queueUpload(){if(applying||!currentUid)return;dirty=true;nativeSet(TOUCH_KEY,String(now()));if(saveTimer)clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveTimer=0;syncNow('local-change').catch(e=>warn('error al sincronizar cambio local',e))},SAVE_DELAY)}
function installStorageHooks(){if(Storage.prototype.__tfCloudV109)return;Storage.prototype.__tfCloudV109=true;Storage.prototype.setItem=function(k,v){const r=nativeSetItem.call(this,k,v);try{if(this===localStorage&&SOURCE_KEYS.includes(String(k))&&!applying)queueUpload()}catch(_){}return r};Storage.prototype.removeItem=function(k){const r=nativeRemoveItem.call(this,k);try{if(this===localStorage&&SOURCE_KEYS.includes(String(k))&&!applying)queueUpload()}catch(_){}return r}}

async function syncNow(reason){if(!currentUid)return false;if(syncing)return syncing;syncing=(async()=>{try{await reconcile(currentUid);return true}catch(e){dirty=true;warn(reason||'sync',e);return false}finally{syncing=null}})();return syncing}

async function init(){if(initialized)return true;initialized=true;installStorageHooks();if(!window.TaskFlowFirebase||typeof window.TaskFlowFirebase.initialize!=='function'){warn('TaskFlowFirebase no disponible');return false}await window.TaskFlowFirebase.initialize();let attempts=0;while(!(window.firebase&&window.firebase.auth)&&attempts<30){await sleep(100);attempts++}if(!(window.firebase&&window.firebase.auth)){warn('Firebase Auth SDK no disponible; la sincronización cloud requiere el sitio publicado por HTTPS.');return false}try{await loadScript('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore-compat.js');if(window.firebase&&window.firebase.firestore)firestoreDb=window.firebase.firestore()}catch(e){warn('Firestore listener no disponible; se mantiene sincronización por eventos.',e)}window.firebase.auth().onAuthStateChanged(async user=>{const uid=user&&user.uid||null;if(uid===currentUid)return;if(remoteUnsubscribe){try{remoteUnsubscribe()}catch(_){}remoteUnsubscribe=null}currentUid=uid;if(saveTimer){clearTimeout(saveTimer);saveTimer=0}dirty=false;if(!uid){log('sin sesión; sincronización pausada');return}try{await syncNow('auth-state');if(firestoreDb){remoteUnsubscribe=firestoreDb.doc('users/'+uid+'/sync/manifest').onSnapshot(()=>{if(currentUid===uid&&!syncing)syncNow('remote-change')},e=>warn('listener remoto',e))}}catch(e){warn('inicio',e)}});window.addEventListener('online',()=>{if(currentUid)syncNow('online')});window.addEventListener('focus',()=>{if(currentUid)syncNow('focus')});document.addEventListener('visibilitychange',()=>{if(!currentUid)return;if(document.hidden){if(dirty)syncNow('background')}else syncNow('foreground')});window.addEventListener('beforeunload',()=>{if(currentUid&&dirty)syncNow('beforeunload')});return true}

window.TaskFlowCloudSync={initialize:init,syncNow:()=>syncNow('manual'),getUid:()=>currentUid,isDirty:()=>dirty,getBinding:()=>getBound()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init().catch(e=>warn('init',e)),{once:true});else init().catch(e=>warn('init',e));
})();
