'use strict';

/* =========================================================
   ZORYVO — APPLICATION CORE
   ========================================================= */
const APP_VERSION='4.0.3';
const STORAGE_KEY='zoryvo_state_v4';
const LEGACY_V3_KEY='jmshort_state_v3';
const LEGACY_V2_KEY='jmshort_state_v2';
const LEGACY_V1_KEY='jmshort_state_v1';
const MIGRATION_KEY='zoryvo_v4_migration_done';
const EPISODE_PRICE=30;
const FREE_EPISODES=3;
const DAILY_REWARDS=[20,25,30,35,40,50,80];
const VALID_VIEWS=new Set(['home','discover','rewards','library','profile']);
const TASK_IDS=new Set(['library','watch3']);
const INTERACTIVE_CHOICES=new Set(['Confrontarlo','Seguir investigando']);
const VIDEO_SOURCES=[
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
];
const SERIES=[
 {id:'heredera',name:'La Heredera Oculta',genre:'Drama',episodes:36,hot:'TOP 1',desc:'Regresa con una identidad secreta para recuperar lo que le pertenece y descubrir quién destruyó a su familia.',ep:'El regreso que nadie esperaba',tags:['herencia','secretos','familia'],rating:4.9,newness:8,c1:'#122a46',c2:'#5b214a',interactive:true},
 {id:'contrato',name:'Contrato con el CEO',genre:'Romance',episodes:42,hot:'NUEVO',desc:'Un acuerdo imposible convierte una mentira conveniente en algo demasiado real.',ep:'Una firma cambia todo',tags:['ceo','contrato','amor'],rating:4.8,newness:10,c1:'#102a40',c2:'#763758'},
 {id:'venganza',name:'Revancha Perfecta',genre:'Venganza',episodes:30,hot:'TOP 3',desc:'Traicionada por quienes más confiaba, vuelve con un plan preciso para ajustar cuentas.',ep:'La noche de la traición',tags:['revancha','traición','regreso'],rating:4.7,newness:7,c1:'#3b151b',c2:'#7a2b31'},
 {id:'luna',name:'Bajo la Misma Luna',genre:'Romance',episodes:28,hot:'HD',desc:'Dos desconocidos quedan unidos por un secreto familiar que nadie debía revelar.',ep:'El encuentro',tags:['destino','familia','secreto'],rating:4.6,newness:5,c1:'#183226',c2:'#30224f'},
 {id:'imperio',name:'Dueño del Imperio',genre:'CEO',episodes:50,hot:'HOT',desc:'El hombre más poderoso de la ciudad oculta su identidad mientras busca a la única persona que no puede comprar.',ep:'Nadie sabe quién es',tags:['ceo','poder','identidad'],rating:4.9,newness:9,c1:'#102940',c2:'#5d335f'},
 {id:'promesa',name:'La Última Promesa',genre:'Drama',episodes:32,hot:'NUEVO',desc:'Una promesa de juventud reaparece cuando sus vidas ya son completamente distintas.',ep:'Diez años después',tags:['promesa','reencuentro','drama'],rating:4.5,newness:10,c1:'#36191f',c2:'#6c3236'},
 {id:'destino',name:'Destino Prohibido',genre:'Romance',episodes:40,hot:'TOP 5',desc:'Todo estaba en contra de ellos, excepto lo que sentían.',ep:'No debíamos conocernos',tags:['prohibido','amor','destino'],rating:4.8,newness:6,c1:'#13243a',c2:'#4e2248'},
 {id:'reina',name:'La Reina Regresa',genre:'Venganza',episodes:45,hot:'ESTRENO',desc:'Todos la dieron por vencida. Fue su mayor error.',ep:'El regreso de la reina',tags:['regreso','poder','venganza'],rating:4.9,newness:10,c1:'#1c3329',c2:'#44224b'},
 {id:'guardaespaldas',name:'Mi Guardaespaldas Secreto',genre:'Romance',episodes:34,hot:'NUEVO',desc:'Ella cree que es un empleado común. En realidad, fue enviado para protegerla de una amenaza invisible.',ep:'La primera señal',tags:['protección','secreto','romance'],rating:4.6,newness:9,c1:'#183148',c2:'#513041'},
 {id:'millonario',name:'El Millonario Anónimo',genre:'CEO',episodes:46,hot:'TOP 10',desc:'Después de perderlo todo en apariencia, descubre quién realmente permaneció a su lado.',ep:'Un hombre sin nombre',tags:['millonario','identidad','lealtad'],rating:4.7,newness:8,c1:'#162a35',c2:'#4e3a21'}
];
const NOTICES=[
 {id:'n1',title:'ZORYVO V4.0.3 está listo',text:'La nueva base mejora reproducción, persistencia, accesibilidad y control de estados.'},
 {id:'n2',title:'Desbloqueos más claros',text:'Los anuncios de recompensa desbloquean directamente el episodio seleccionado.'},
 {id:'n3',title:'Diagnóstico integrado',text:'Desde Perfil puedes comprobar almacenamiento, catálogo, video y capacidades del navegador.'}
];
const DEFAULT_STATE={
 coins:120,
 freePasses:0,
 library:[],
 unlocked:{heredera:[1,2,3]},
 progress:{},
 history:[],
 completedEpisodes:[],
 likes:[],
 vip:false,
 reward:{lastClaim:null,streak:0,adDate:null,adsToday:0,claimedTasks:[]},
 settings:{autoplay:true,muted:false,dataSaver:false},
 interactive:{},
 notificationsRead:[]
};

const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const runtime={
 activeSeries:SERIES[0],
 activeEpisode:1,
 pendingUnlock:null,
 selectedPackage:120,
 activeGenre:'Todos',
 currentSort:'popular',
 activeView:'home',
 lastProgressSave:0,
 videoLoadToken:0,
 adTimer:null,
 adContext:null,
 focusBeforeLayer:null,
 storageMode:'persistent',
 storageError:null,
 didMigrate:false
};

/* ---------- safe storage ---------- */
const memoryStore=new Map();
const Storage={
 probe(){
   try{
     const key='__zoryvo_probe__';
     window.localStorage.setItem(key,'1');
     window.localStorage.removeItem(key);
     runtime.storageMode='persistent';
     runtime.storageError=null;
     return true;
   }catch(err){
     runtime.storageMode='memory';
     runtime.storageError=err;
     return false;
   }
 },
 get(key){
   if(runtime.storageMode==='persistent'){
     try{return window.localStorage.getItem(key)}catch(err){runtime.storageMode='memory';runtime.storageError=err}
   }
   return memoryStore.has(key)?memoryStore.get(key):null;
 },
 set(key,value){
   if(runtime.storageMode==='persistent'){
     try{window.localStorage.setItem(key,value);return true}catch(err){runtime.storageMode='memory';runtime.storageError=err}
   }
   memoryStore.set(key,value);
   return false;
 },
 remove(key){
   if(runtime.storageMode==='persistent'){
     try{window.localStorage.removeItem(key);return true}catch(err){runtime.storageMode='memory';runtime.storageError=err}
   }
   memoryStore.delete(key);
   return false;
 }
};
Storage.probe();

/* ---------- data integrity ---------- */
function safeParse(value){try{return JSON.parse(value)}catch{return null}}
function cloneDefault(){return JSON.parse(JSON.stringify(DEFAULT_STATE))}
function isPlainObject(value){return !!value&&typeof value==='object'&&!Array.isArray(value)}
function validSeriesId(id){return typeof id==='string'&&SERIES.some(series=>series.id===id)}
function getSeries(id){return SERIES.find(series=>series.id===id)||null}
function validEp(id,ep){const series=getSeries(id);return !!series&&Number.isInteger(ep)&&ep>=1&&ep<=series.episodes}
function validCompletedKey(key){if(typeof key!=='string')return false;const match=key.match(/^([-a-z0-9]+):(\d+)$/);return !!match&&validEp(match[1],Number(match[2]))}
function uniqValidIds(value){return Array.isArray(value)?[...new Set(value.filter(validSeriesId))]:[]}
function normalizeUnlocked(value){
 const out={};
 if(!isPlainObject(value))return out;
 for(const [id,eps] of Object.entries(value)){
   if(!validSeriesId(id)||!Array.isArray(eps))continue;
   out[id]=[...new Set(eps.map(Number).filter(ep=>validEp(id,ep)))].sort((a,b)=>a-b);
 }
 return out;
}
function normalizeProgress(value){
 const out={};
 if(!isPlainObject(value))return out;
 for(const [id,p] of Object.entries(value)){
   if(!validSeriesId(id)||!isPlainObject(p))continue;
   const series=getSeries(id);
   const ep=Math.max(1,Math.min(series.episodes,Math.floor(Number(p.ep)||1)));
   const duration=Math.max(0,Number(p.duration)||0);
   const time=Math.max(0,Math.min(duration||Infinity,Number(p.time)||0));
   const percent=Math.max(0,Math.min(100,Number(p.percent)||0));
   out[id]={ep,time,duration,percent,updatedAt:Math.max(0,Number(p.updatedAt)||Date.now())};
 }
 return out;
}
function normalizeInteractive(value){
 const out={};
 if(!isPlainObject(value))return out;
 for(const [key,choice] of Object.entries(value)){
   const match=key.match(/^([-a-z0-9]+):(\d+)$/);
   if(!match||!validEp(match[1],Number(match[2]))||!INTERACTIVE_CHOICES.has(choice))continue;
   out[key]=choice;
 }
 return out;
}
function normalizeState(raw){
 const d=cloneDefault();
 const value=isPlainObject(raw)?raw:{};
 d.coins=Math.max(0,Math.floor(Number.isFinite(Number(value.coins))?Number(value.coins):d.coins));
 d.freePasses=Math.max(0,Math.floor(Number.isFinite(Number(value.freePasses))?Number(value.freePasses):d.freePasses));
 d.library=uniqValidIds(value.library);
 d.unlocked=normalizeUnlocked(value.unlocked);
 d.progress=normalizeProgress(value.progress);
 d.history=Array.isArray(value.history)?value.history.filter(item=>isPlainObject(item)&&validEp(item.id,Number(item.ep))).slice(0,60).map(item=>({id:item.id,ep:Number(item.ep),at:Math.max(0,Number(item.at)||Date.now())})):[];
 d.completedEpisodes=Array.isArray(value.completedEpisodes)?[...new Set(value.completedEpisodes.filter(validCompletedKey))]:[];
 d.likes=uniqValidIds(value.likes);
 d.vip=!!value.vip;
 if(isPlainObject(value.reward)){
   d.reward.lastClaim=typeof value.reward.lastClaim==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value.reward.lastClaim)?value.reward.lastClaim:null;
   d.reward.streak=Math.max(0,Math.min(7,Math.floor(Number(value.reward.streak)||0)));
   d.reward.adDate=typeof value.reward.adDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value.reward.adDate)?value.reward.adDate:null;
   d.reward.adsToday=Math.max(0,Math.min(5,Math.floor(Number(value.reward.adsToday)||0)));
   d.reward.claimedTasks=Array.isArray(value.reward.claimedTasks)?[...new Set(value.reward.claimedTasks.filter(id=>TASK_IDS.has(id)))]:[];
 }
 if(isPlainObject(value.settings)){
   d.settings.autoplay=value.settings.autoplay!==false;
   d.settings.muted=!!value.settings.muted;
   d.settings.dataSaver=!!value.settings.dataSaver;
 }
 d.interactive=normalizeInteractive(value.interactive);
 d.notificationsRead=Array.isArray(value.notificationsRead)?[...new Set(value.notificationsRead.filter(id=>NOTICES.some(n=>n.id===id)))]:[];
 return d;
}
function migrateLegacy(raw,version){
 if(version===3||version===2)return normalizeState(raw);
 if(version===1){
   const history=raw?.lastPlayed&&validEp(raw.lastPlayed.id,Number(raw.lastPlayed.ep))?[raw.lastPlayed]:[];
   return normalizeState({...raw,freePasses:0,progress:{},history});
 }
 return cloneDefault();
}
