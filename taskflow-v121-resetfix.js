(function(){
'use strict';
if(window.__tfV121ResetFix)return;window.__tfV121ResetFix=true;

const MAIN='taskflow_db_v26';
const BACK='taskflow_db_v26_backup';
const REC='taskflow_db_v26_recovery';
const TOUCH='taskflow_cloud_local_touch_v1';
const APPLIED_PREFIX='taskflow_global_reset_applied_v121_';
const PROJECT='taskflow-b0ece';
const API='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents';
let busy=false,pollTimer=0,checking=false;
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function user(){
 try{
  const u=window.TaskFlowFirebase&&window.TaskFlowFirebase.getUser?window.TaskFlowFirebase.getUser():null;
  if(u&&u.uid)return u;
  const fu=window.firebase&&window.firebase.auth?window.firebase.auth().currentUser:null;
  return fu&&fu.uid?fu:null;
 }catch(_){return null}
}

async function token(force){
 if(!window.TaskFlowFirebase||typeof window.TaskFlowFirebase.getIdToken!=='function')return null;
 return window.TaskFlowFirebase.getIdToken(!!force);
}

async function resetDoc(uid,method,body){
 let t=await token(false);if(!t)throw new Error('AUTH_REQUIRED');
 const url=API+'/users/'+encodeURIComponent(uid)+'/control/resetState';
 const opt={method:method||'GET',headers:{'Authorization':'Bearer '+t,'Content-Type':'application/json'}};
 if(body)opt.body=JSON.stringify(body);
 let r=await fetch(url,opt);
 if(r.status===401){t=await token(true);if(t){opt.headers.Authorization='Bearer '+t;r=await fetch(url,opt)}}
 if(r.status===404)return null;
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(d&&d.error&&d.error.message||('HTTP '+r.status));
 return d;
}

function readResetAt(doc){
 const f=doc&&doc.fields||{};
 return Number(f.resetAt&&f.resetAt.integerValue)||0;
}

async function writeMarker(uid,stamp){
 const name='projects/'+PROJECT+'/databases/(default)/documents/users/'+uid+'/control/resetState';
 return resetDoc(uid,'PATCH',{name,fields:{resetAt:{integerValue:String(stamp)},version:{integerValue:'121'}}});
}

function gtClock(){
 const p={};
 new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).forEach(x=>{if(x.type!=='literal')p[x.type]=x.value});
 const y=+p.year,m=+p.month,d=+p.day,h=+p.hour||0;
 const todayDMY=`${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
 const logical=new Date(Date.UTC(y,m-1,d,12));
 if(h<1)logical.setUTCDate(logical.getUTCDate()-1);
 const ly=logical.getUTCFullYear(),lm=String(logical.getUTCMonth()+1).padStart(2,'0'),ld=String(logical.getUTCDate()).padStart(2,'0');
 const iso=`${ly}-${lm}-${ld}`;
 return{todayDMY,iso,cycleKey:iso+'-GT-01'};
}

function resetLocal(){
 const arr=[MAIN,REC,BACK].map(key=>{
  try{const raw=localStorage.getItem(key),data=raw?JSON.parse(raw):null;return data&&typeof data==='object'&&!Array.isArray(data)?{data,savedAt:Number(data.savedAt)||0}:null}catch(_){return null}
 }).filter(Boolean);
 if(!arr.length)throw new Error('NO_STATE');
 arr.sort((a,b)=>b.savedAt-a.savedAt);
 const data=arr[0].data;
 if(!data.meta||typeof data.meta!=='object'||Array.isArray(data.meta))data.meta={};
 const m=data.meta,g=gtClock();
 m.habitStreakCurrent=0;
 m.habitStreakBest=0;
 m.taskStreakCurrent=0;
 m.taskStreakBest=0;
 m.unifiedStreakCurrent=0;
 m.unifiedStreakBest=0;
 m.lastUnifiedSuccessDate=null;
 m.dailyPenaltyTokens={};
 m.v32PerfectDayLog={};
 m.incomeMissionPenaltyTokens={};
 m.punishmentActive=false;
 m.punishmentReason='';
 m.punishmentCompleted=false;
 m.punishmentTarget=null;
 m.lastPunishmentCycleKey=g.cycleKey;
 m.lastHabitCycleKey=g.cycleKey;
 m.lastTaskProcessingDate=g.todayDMY;
 m.v32ShopPerfectProcessed=g.iso;
 data.savedAt=Date.now();
 const raw=JSON.stringify(data);
 localStorage.setItem(MAIN,raw);
 localStorage.setItem(BACK,raw);
 localStorage.setItem(REC,raw);
 localStorage.setItem(TOUCH,String(data.savedAt));
 return data.savedAt;
}

async function waitCloud(uid){
 try{if(window.TaskFlowCloudSync&&window.TaskFlowCloudSync.initialize)await window.TaskFlowCloudSync.initialize()}catch(_){}
 for(let i=0;i<50;i++){
  try{if(window.TaskFlowCloudSync&&window.TaskFlowCloudSync.getUid&&window.TaskFlowCloudSync.getUid()===uid)return true}catch(_){}
  await sleep(100);
 }
 return false;
}

async function syncAccount(uid){
 await waitCloud(uid);
 if(!window.TaskFlowCloudSync||typeof window.TaskFlowCloudSync.syncNow!=='function')throw new Error('SYNC_UNAVAILABLE');
 const ok=await window.TaskFlowCloudSync.syncNow();
 if(ok===false)throw new Error('SYNC_FAILED');
 return true;
}

function status(text,kind){
 const s=$('tf120ResetStatus');if(!s)return;
 s.textContent=text||'';
 s.className='tf120-status'+(kind?' '+kind:'');
}

async function performReset(e){
 if(e){e.preventDefault();e.stopImmediatePropagation();}
 if(busy)return;
 busy=true;
 const b=$('tf120ResetConfirm');if(b)b.disabled=true;
 try{
  const u=user();
  if(!u||!u.uid){
   status('Reiniciando este dispositivo…');
   resetLocal();
   status('Dispositivo reiniciado a 0 días.','ok');
   setTimeout(()=>location.reload(),650);
   return;
  }
  status('Reiniciando la cuenta en todos tus dispositivos…');
  resetLocal();
  await syncAccount(u.uid);
  const stamp=Date.now();
  await writeMarker(u.uid,stamp);
  localStorage.setItem(APPLIED_PREFIX+u.uid,String(stamp));
  status('Cuenta reiniciada. El cambio se aplicará automáticamente en los demás dispositivos.','ok');
  setTimeout(()=>location.reload(),750);
 }catch(err){
  console.warn('TaskFlow V121 reset:',err);
  status('No se pudo completar el reinicio global. Revisa tu conexión e inténtalo nuevamente.','bad');
  if(b)b.disabled=false;
  busy=false;
 }
}

function bindConfirm(){
 const b=$('tf120ResetConfirm');
 if(!b||b.dataset.tf121Bound==='1')return;
 b.dataset.tf121Bound='1';
 b.addEventListener('click',performReset,true);
}

async function applyRemote(uid,stamp){
 const key=APPLIED_PREFIX+uid;
 const last=Number(localStorage.getItem(key))||0;
 if(!stamp||stamp<=last)return false;
 localStorage.setItem(key,String(stamp));
 try{
  // Primero reconcilia la cuenta para conservar las tareas/hábitos más recientes.
  try{await syncAccount(uid)}catch(_){}
  // Después elimina únicamente progreso, rachas y fallas en este dispositivo.
  resetLocal();
  // Publica el mismo estado limpio para impedir que una copia antigua vuelva a imponerse.
  try{await syncAccount(uid)}catch(_){}
  setTimeout(()=>location.reload(),450);
  return true;
 }catch(err){
  // Si falla, permite reintentar el mismo evento en la siguiente comprobación.
  localStorage.removeItem(key);
  throw err;
 }
}

async function checkRemote(){
 if(checking||busy)return;
 const u=user();if(!u||!u.uid)return;
 checking=true;
 try{
  const d=await resetDoc(u.uid,'GET');
  const stamp=readResetAt(d);
  await applyRemote(u.uid,stamp);
 }catch(err){
  console.warn('TaskFlow V121 reset check:',err);
 }finally{checking=false}
}

function schedulePoll(){
 if(pollTimer)clearInterval(pollTimer);
 pollTimer=setInterval(checkRemote,4000);
}

function start(){
 bindConfirm();
 new MutationObserver(ms=>{if(ms.some(m=>m.addedNodes&&m.addedNodes.length))requestAnimationFrame(bindConfirm)}).observe(document.body,{subtree:true,childList:true});
 setTimeout(checkRemote,800);
 setTimeout(checkRemote,2400);
 schedulePoll();
 window.addEventListener('focus',checkRemote);
 window.addEventListener('online',checkRemote);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkRemote()});
}

window.TaskFlowV121={checkGlobalReset:checkRemote};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();