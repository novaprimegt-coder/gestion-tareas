(function(){
'use strict';
if(window.__tfV116)return;window.__tfV116=true;

const MAIN='taskflow_db_v26';
const BACK='taskflow_db_v26_backup';
const REC='taskflow_db_v26_recovery';
const TOUCH='taskflow_cloud_local_touch_v1';
const CODE='MEJORAR';
let observer=null,queued=false;
const $=id=>document.getElementById(id);
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();

function installStyle(){
 if($('tfV116Style'))return;
 const s=document.createElement('style');s.id='tfV116Style';s.textContent=`
.search-container{
  position:relative!important;
  display:flex!important;
  align-items:center!important;
  gap:10px!important;
  width:auto!important;
  min-height:52px!important;
  height:52px!important;
  margin:10px 20px 14px!important;
  padding:0 15px!important;
  border-radius:17px!important;
  border:1px solid rgba(78,205,196,.20)!important;
  background:linear-gradient(135deg,rgba(14,24,41,.96),rgba(9,14,27,.98))!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 10px 28px rgba(0,0,0,.16)!important;
  transition:border-color .18s ease,box-shadow .18s ease,background .18s ease!important;
  overflow:hidden!important;
}
.search-container:focus-within{
  border-color:rgba(78,205,196,.52)!important;
  background:linear-gradient(135deg,rgba(15,30,47,.98),rgba(9,16,30,.99))!important;
  box-shadow:0 0 0 3px rgba(78,205,196,.075),0 12px 30px rgba(0,0,0,.22)!important;
}
.search-container>i.fa-search{
  position:static!important;
  transform:none!important;
  flex:0 0 auto!important;
  color:#4ed9ce!important;
  font-size:14px!important;
  opacity:.9!important;
  margin:0!important;
}
#searchInput{
  position:static!important;
  display:block!important;
  flex:1 1 auto!important;
  min-width:0!important;
  width:100%!important;
  height:50px!important;
  padding:0!important;
  margin:0!important;
  border:0!important;
  outline:0!important;
  background:transparent!important;
  box-shadow:none!important;
  color:#f2f7ff!important;
  caret-color:#54ded2!important;
  font-size:15px!important;
  font-weight:600!important;
  letter-spacing:0!important;
  pointer-events:auto!important;
  user-select:text!important;
  -webkit-user-select:text!important;
}
#searchInput::placeholder{color:#718099!important;opacity:1!important;font-weight:550!important}
#clearSearch{
  position:static!important;
  transform:none!important;
  flex:0 0 auto!important;
  margin-left:auto!important;
  width:30px!important;
  height:30px!important;
  border-radius:10px!important;
  align-items:center!important;
  justify-content:center!important;
  color:#8290a7!important;
  background:rgba(255,255,255,.035)!important;
}
#clearSearch:hover,#clearSearch:active{color:#fff!important;background:rgba(255,255,255,.07)!important}
@media(max-width:520px){.search-container{height:50px!important;min-height:50px!important;margin:8px 20px 13px!important;border-radius:16px!important}#searchInput{height:48px!important;font-size:14px!important}}
`;
 document.head.appendChild(s);
}

function restoreNativeSearch(){
 const input=$('searchInput');if(!input)return;
 const proxy=$('tfSearchProxyV115');
 if(proxy){
  const v=String(proxy.textContent||'').replace(/\n/g,'').trim();
  if(v&&norm(v)!==CODE&&!input.value)input.value=v;
  proxy.remove();
 }
 // Mantiene la marca para impedir que V115 vuelva a crear el proxy defectuoso.
 input.dataset.tf115Proxy='1';
 input.classList.remove('tf115-search-native');
 input.readOnly=false;
 input.tabIndex=0;
 input.removeAttribute('aria-hidden');
 input.removeAttribute('form');
 try{input.type='search'}catch(_){}
 input.setAttribute('name','taskflow_search_query');
 input.setAttribute('autocomplete','off');
 input.setAttribute('autocorrect','off');
 input.setAttribute('autocapitalize','none');
 input.setAttribute('spellcheck','false');
 input.setAttribute('inputmode','search');
 input.setAttribute('enterkeyhint','search');
 input.setAttribute('role','searchbox');
 input.setAttribute('aria-label','Buscar tareas y hábitos');
 input.setAttribute('data-form-type','other');
 input.setAttribute('data-lpignore','true');
 input.setAttribute('data-1p-ignore','true');
 input.setAttribute('data-bwignore','true');
 input.placeholder='Buscar tareas y hábitos...';
}

function interceptSecret(e){
 const input=$('searchInput');
 if(!input||e.target!==input||norm(input.value)!==CODE)return;
 e.preventDefault();e.stopImmediatePropagation();
 input.value='';
 const clear=$('clearSearch');if(clear)clear.style.display='none';
 try{if(typeof input.oninput==='function')input.oninput();}catch(_){}
 setTimeout(()=>{try{window.TaskFlowV115&&window.TaskFlowV115.openRoutineManager&&window.TaskFlowV115.openRoutineManager();}catch(_){}},0);
}

function gtClock(){
 const parts={};
 new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).forEach(p=>{if(p.type!=='literal')parts[p.type]=p.value});
 const y=Number(parts.year),m=Number(parts.month),d=Number(parts.day),hour=Number(parts.hour)||0;
 const todayIso=`${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
 const todayDMY=`${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${String(y).padStart(4,'0')}`;
 const logical=new Date(Date.UTC(y,m-1,d,12));if(hour<1)logical.setUTCDate(logical.getUTCDate()-1);
 const ly=logical.getUTCFullYear(),lm=String(logical.getUTCMonth()+1).padStart(2,'0'),ld=String(logical.getUTCDate()).padStart(2,'0');
 const cycleIso=`${ly}-${lm}-${ld}`;
 return{todayIso,todayDMY,cycleIso,cycleKey:`${cycleIso}-GT-01`};
}

function resetAccountActivityData(){
 const candidates=[MAIN,REC,BACK].map(key=>{try{const raw=localStorage.getItem(key);const data=raw?JSON.parse(raw):null;return data&&typeof data==='object'&&!Array.isArray(data)?{key,data,savedAt:Number(data.savedAt)||0}:null}catch(_){return null}}).filter(Boolean);
 if(!candidates.length)throw new Error('NO_STATE');
 candidates.sort((a,b)=>b.savedAt-a.savedAt);
 const data=candidates[0].data;
 if(!data.meta||typeof data.meta!=='object'||Array.isArray(data.meta))data.meta={};
 const meta=data.meta,gt=gtClock();

 // Reinicio explícito de días, rachas y actividad histórica de disciplina.
 meta.habitStreakCurrent=0;
 meta.habitStreakBest=0;
 meta.taskStreakCurrent=0;
 meta.taskStreakBest=0;
 meta.unifiedStreakCurrent=0;
 meta.unifiedStreakBest=0;
 meta.lastUnifiedSuccessDate=null;
 meta.dailyPenaltyTokens={};
 meta.v32PerfectDayLog={};
 meta.incomeMissionPenaltyTokens={};
 meta.punishmentActive=false;
 meta.punishmentReason='';
 meta.punishmentCompleted=false;
 meta.punishmentTarget=null;
 meta.lastPunishmentCycleKey=gt.cycleKey;

 // Ancla el reinicio al ciclo actual para impedir que el sistema reconstruya
 // inmediatamente como fallos los días anteriores que acabamos de reiniciar.
 meta.lastHabitCycleKey=gt.cycleKey;
 meta.lastTaskProcessingDate=gt.todayDMY;
 meta.v32ShopPerfectProcessed=gt.cycleIso;

 // Tareas, hábitos, categorías y cursos permanecen intactos.
 data.savedAt=Date.now();
 const raw=JSON.stringify(data);
 localStorage.setItem(REC,raw);
 localStorage.setItem(MAIN,raw);
 localStorage.setItem(BACK,raw);
 localStorage.setItem(TOUCH,String(data.savedAt));
 return true;
}

async function resetProgressV116(){
 const b=$('tf115ConfirmReset');if(b)b.disabled=true;
 try{
  resetAccountActivityData();
  const m=$('tfProfileMessage');if(m){m.textContent='Sistema reiniciado a 0 días. Se borró el historial de progreso y fallas; tus hábitos y tareas se conservaron.';m.className='tf-profile-message ok'}
  try{if(window.TaskFlowCloudSync&&typeof window.TaskFlowCloudSync.syncNow==='function')await window.TaskFlowCloudSync.syncNow();}catch(_){}
  setTimeout(()=>location.reload(),180);
 }catch(e){
  const m=$('tfProfileMessage');if(m){m.textContent='No se pudo completar el reinicio del sistema.';m.className='tf-profile-message bad'}
  if(b)b.disabled=false;
 }
}

function bindReset(){
 const confirm=$('tf115ConfirmReset');if(confirm&&confirm.dataset.tf116Reset!=='1'){
  confirm.dataset.tf116Reset='1';
  confirm.onclick=resetProgressV116;
 }
}

function apply(){installStyle();restoreNativeSearch();bindReset()}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})}
function start(){
 apply();
 document.addEventListener('input',interceptSecret,true);
 setTimeout(apply,250);setTimeout(apply,900);setTimeout(apply,1800);
 observer=new MutationObserver(ms=>{if(ms.some(m=>m.addedNodes&&m.addedNodes.length))queue()});
 observer.observe(document.body,{subtree:true,childList:true});
}
window.TaskFlowV116={refresh:apply,resetAccountActivity:resetProgressV116};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();