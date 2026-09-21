(function(){
'use strict';
if(window.__tfV119)return;window.__tfV119=true;

const CFG='taskflow_routines_v115';
const META='taskflow_routines_v115_meta';
const INIT='taskflow_routines_v119_defaulted';
const ROUTINES=[
 {id:'sung',name:'Sung Jin-Woo',detail:'Rutina de disciplina predeterminada'},
 {id:'juridico',name:'Dominio Jurídico',detail:'Rutina jurídica predeterminada'},
 {id:'socrates',name:'Sócrates',detail:'Rutina de pensamiento predeterminada'},
 {id:'maquiavelo',name:'Maquiavelo',detail:'Rutina de pensamiento predeterminada'},
 {id:'mentalista',name:'Mentalista',detail:'Rutina especial predeterminada'},
 {id:'budget503020',name:'50/30/20',detail:'Rutina financiera predeterminada'}
];
let queued=false,observer=null;
const $=id=>document.getElementById(id);

function getCfg(){
 let c={};
 try{const x=JSON.parse(localStorage.getItem(CFG)||'{}');if(x&&typeof x==='object'&&!Array.isArray(x))c=x}catch(_){}
 let changed=false;
 for(const r of ROUTINES){if(typeof c[r.id]!=='boolean'){c[r.id]=false;changed=true}}
 if(changed)writeCfg(c,false);
 return c;
}
function writeCfg(c,notify=true){
 try{localStorage.setItem(CFG,JSON.stringify(c));localStorage.setItem(META,String(Date.now()))}catch(_){}
 if(notify){
   try{window.TaskFlowV117&&window.TaskFlowV117.refresh&&window.TaskFlowV117.refresh()}catch(_){}
   queueApply();
 }
}
function initializeDefaultsOnce(){
 let first=true;
 try{first=localStorage.getItem(INIT)!=='1'}catch(_){}
 if(!first)return;
 const c=getCfg();
 for(const r of ROUTINES)c[r.id]=false;
 writeCfg(c,true);
 try{localStorage.setItem(INIT,'1')}catch(_){}
}

function installStyle(){
 if($('tfV119Style'))return;
 const s=document.createElement('style');s.id='tfV119Style';s.textContent=`
#tfManagerV117.tf119-modal{position:fixed!important;inset:0!important;z-index:2147483640!important;display:none;align-items:center!important;justify-content:center!important;padding:10px 10px 118px!important;background:rgba(2,6,16,.88)!important;backdrop-filter:blur(10px)!important;overscroll-behavior:none!important}
#tfManagerV117.tf119-modal.open{display:flex!important}
.tf119-sheet{width:min(540px,100%)!important;max-height:calc(100dvh - 138px)!important;display:flex!important;flex-direction:column!important;min-height:0!important;border-radius:24px!important;border:1px solid rgba(78,205,196,.28)!important;background:linear-gradient(160deg,#121d34 0%,#0a1120 58%,#070c17 100%)!important;box-shadow:0 30px 90px rgba(0,0,0,.62)!important;color:#fff!important;overflow:hidden!important}
.tf119-head{flex:0 0 auto!important;display:flex!important;justify-content:space-between!important;gap:14px!important;padding:17px 17px 14px!important;border-bottom:1px solid rgba(255,255,255,.065)!important;background:linear-gradient(180deg,rgba(20,31,54,.98),rgba(14,22,39,.94))!important}
.tf119-head small{display:block;color:#55e1d3;font-size:9px;font-weight:950;letter-spacing:.16em}.tf119-head h2{margin:6px 0 5px;font-size:27px;line-height:1.04}.tf119-head p{margin:0;color:#96a3b8;font-size:11px;line-height:1.45}
.tf119-x{width:44px;height:44px;flex:0 0 44px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.045);color:#fff;font-size:28px;display:grid;place-items:center}
.tf119-scroll{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain!important;touch-action:pan-y!important;padding:14px!important;scrollbar-width:thin;scrollbar-color:#27d8cd rgba(255,255,255,.04)}
.tf119-scroll::-webkit-scrollbar{width:5px}.tf119-scroll::-webkit-scrollbar-thumb{background:#27d8cd;border-radius:999px}.tf119-scroll::-webkit-scrollbar-track{background:rgba(255,255,255,.03)}
.tf119-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:11px}.tf119-actions button,.tf119-done{min-height:46px;border-radius:14px;border:1px solid rgba(78,205,196,.26);background:rgba(78,205,196,.09);color:#62e4d7;font-weight:900;font-size:12px}.tf119-actions button:last-child{color:#ff9ca7;border-color:rgba(255,100,115,.25);background:rgba(255,90,105,.065)}
.tf119-list{display:grid;gap:9px}.tf119-row{display:flex;align-items:center;justify-content:space-between;gap:13px;padding:14px 13px;border:1px solid rgba(255,255,255,.078);border-radius:16px;background:rgba(255,255,255,.03);cursor:pointer}.tf119-row strong{display:block;font-size:13px}.tf119-row small{display:block;margin-top:3px;color:#8391a8;font-size:8px;line-height:1.35}.tf119-row input{position:absolute;opacity:0;pointer-events:none}.tf119-switch{width:48px;height:27px;border-radius:99px;background:#273349;position:relative;flex:0 0 48px}.tf119-switch:after{content:"";position:absolute;width:21px;height:21px;left:3px;top:3px;border-radius:50%;background:#8998ad;transition:.18s}.tf119-row input:checked+.tf119-switch{background:rgba(50,221,201,.31);box-shadow:inset 0 0 0 1px rgba(82,232,217,.16)}.tf119-row input:checked+.tf119-switch:after{left:24px;background:#55e5d7;box-shadow:0 0 12px rgba(79,226,213,.32)}
.tf119-footer{flex:0 0 auto!important;padding:10px 14px 13px!important;border-top:1px solid rgba(255,255,255,.065)!important;background:linear-gradient(180deg,rgba(10,17,31,.98),rgba(7,12,23,.995))!important}.tf119-note{margin:0 0 9px!important;padding:10px 11px!important;border-radius:12px!important;border:1px solid rgba(139,99,255,.14)!important;background:rgba(139,99,255,.055)!important;font-size:9px!important;line-height:1.5!important;color:#a2aec0!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;max-height:none!important}.tf119-done{width:100%;margin:0!important}
#tf503020Hub.tf119-off{display:none!important}#tfPairV117.tf119-empty{display:none!important;margin:0!important;padding:0!important;height:0!important;min-height:0!important}#tfPairV117.tf119-single{grid-template-columns:1fr!important}
#v32MandatoryMissions.tf117-off,#v69DailyMindRoutines.tf117-off,#v94MentalistRoutine.tf117-off{display:none!important;margin:0!important;padding:0!important;height:0!important;min-height:0!important}
@media(max-width:430px){#tfManagerV117.tf119-modal{padding:8px 9px 112px!important}.tf119-sheet{max-height:calc(100dvh - 128px)!important;border-radius:21px!important}.tf119-head{padding:15px 14px 12px!important}.tf119-head h2{font-size:25px}.tf119-scroll{padding:12px!important}.tf119-actions{grid-template-columns:1fr}.tf119-row{padding:12px 11px!important}.tf119-footer{padding:9px 12px 11px!important}.tf119-note{font-size:8.5px!important}}
`;
 document.head.appendChild(s);
}

function closeManager(){
 const o=$('tfManagerV117');if(!o)return;
 o.classList.remove('open');o.setAttribute('aria-hidden','true');
 document.body.style.overflow='';
}
function buildManager(){
 const old=$('tfManagerV117');if(old)old.remove();
 const o=document.createElement('div');
 o.id='tfManagerV117';o.className='tf119-modal';o.setAttribute('aria-hidden','true');
 o.innerHTML=`<section class="tf119-sheet" role="dialog" aria-modal="true" aria-labelledby="tf119Title"><header class="tf119-head"><div><small>CONFIGURACIÓN DEL SISTEMA</small><h2 id="tf119Title">Rutinas predeterminadas</h2><p>Activa únicamente las rutinas que quieras utilizar.</p></div><button class="tf119-x" type="button" aria-label="Cerrar">×</button></header><div class="tf119-scroll" id="tf119Scroll"><div class="tf119-actions"><button id="tf119AllOn" type="button">Activar todas</button><button id="tf119AllOff" type="button">Desactivar todas</button></div><div class="tf119-list" id="tf119List"></div></div><footer class="tf119-footer"><div class="tf119-note">Los cambios únicamente controlan qué rutinas predeterminadas aparecen en TaskFlow. Tus hábitos y tareas personales no se eliminan ni se modifican.</div><button class="tf119-done" type="button">Guardar y cerrar</button></footer></section>`;
 document.body.appendChild(o);
 o.querySelector('.tf119-x').addEventListener('click',closeManager);
 o.querySelector('.tf119-done').addEventListener('click',closeManager);
 o.addEventListener('click',e=>{if(e.target===o)closeManager()});
 const scroll=$('tf119Scroll');if(scroll){scroll.addEventListener('touchmove',e=>e.stopPropagation(),{passive:true});scroll.addEventListener('wheel',e=>e.stopPropagation(),{passive:true})}
 $('tf119AllOn').addEventListener('click',()=>{const c=getCfg();for(const r of ROUTINES)c[r.id]=true;writeCfg(c,true);renderManager();});
 $('tf119AllOff').addEventListener('click',()=>{const c=getCfg();for(const r of ROUTINES)c[r.id]=false;writeCfg(c,true);renderManager();});
 renderManager();
}
function renderManager(){
 const list=$('tf119List');if(!list)return;
 const c=getCfg();list.innerHTML='';
 for(const r of ROUTINES){
  const row=document.createElement('label');row.className='tf119-row';
  row.innerHTML=`<span><strong>${r.name}</strong><small>${r.detail}</small></span><input type="checkbox" ${c[r.id]?'checked':''}><i class="tf119-switch" aria-hidden="true"></i>`;
  const input=row.querySelector('input');input.addEventListener('change',()=>{const next=getCfg();next[r.id]=!!input.checked;writeCfg(next,true);applyVisibility();});
  list.appendChild(row);
 }
}
function ensureManager(){
 const current=$('tfManagerV117');
 if(!current||!current.classList.contains('tf119-modal'))buildManager();
 else renderManager();
}

function applyVisibility(){
 const c=getCfg();
 const fifty=$('tf503020Hub');
 if(fifty)fifty.classList.toggle('tf119-off',!c.budget503020);
 const pair=$('tfPairV117');
 if(pair){
  const active=(c.budget503020?1:0)+(c.mentalista?1:0);
  pair.classList.toggle('tf119-empty',active===0);
  pair.classList.toggle('tf119-single',active===1);
 }
}
function queueApply(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;ensureManager();applyVisibility()})}
function start(){
 installStyle();initializeDefaultsOnce();ensureManager();applyVisibility();
 observer=new MutationObserver(ms=>{if(ms.some(m=>m.addedNodes&&m.addedNodes.length))queueApply()});
 observer.observe(document.body,{subtree:true,childList:true});
 setTimeout(queueApply,250);setTimeout(queueApply,900);setTimeout(queueApply,1800);
}
window.TaskFlowV119={refresh:queueApply,getRoutineConfig:getCfg};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();