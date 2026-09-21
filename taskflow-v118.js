(function(){
'use strict';
if(window.__tfV118)return;window.__tfV118=true;

const CFG='taskflow_routines_v115';
const META='taskflow_routines_v115_meta';
const INIT='taskflow_routines_v118_defaulted';
const KEYS=['sung','juridico','socrates','maquiavelo','mentalista','budget503020'];
let patchQueued=false,observer=null;
const $=id=>document.getElementById(id);

function readCfg(){
  let c={};
  try{const raw=localStorage.getItem(CFG);const parsed=raw?JSON.parse(raw):{};if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))c=parsed}catch(_){}
  let changed=false;
  for(const k of KEYS){if(typeof c[k]!=='boolean'){c[k]=false;changed=true}}
  if(changed)store(c,false);
  return c;
}
function store(c,refresh=true){
  try{localStorage.setItem(CFG,JSON.stringify(c));localStorage.setItem(META,String(Date.now()))}catch(_){}
  if(refresh&&window.TaskFlowV117&&typeof window.TaskFlowV117.refresh==='function'){
    try{window.TaskFlowV117.refresh()}catch(_){}
  }
  apply503020();queuePatch();
}
function initializeDefaults(){
  let first=false;
  try{first=localStorage.getItem(INIT)!=='1'}catch(_){first=true}
  if(first){
    const c=readCfg();
    for(const k of KEYS)c[k]=false;
    store(c,true);
    try{localStorage.setItem(INIT,'1')}catch(_){}
    setTimeout(queueCloudThroughV117,350);
  }else{
    const c=readCfg();
    if(typeof c.budget503020!=='boolean'){c.budget503020=false;store(c,true)}
  }
}
function queueCloudThroughV117(){
  const input=document.querySelector('#tf117List .tf117-row:not([data-tf118-budget]) input[type="checkbox"]');
  if(!input)return;
  try{input.dispatchEvent(new Event('change',{bubbles:true}))}catch(_){}
}

function installStyle(){
  if($('tfV118Style'))return;
  const s=document.createElement('style');s.id='tfV118Style';s.textContent=`
#tfPairV117.tf118-empty{display:none!important}
#tfPairV117.tf118-single{grid-template-columns:1fr!important}
#tfManagerV117 .tf117-note{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.55!important;font-size:10px!important;color:#9aa7bb!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important}
.tf118-footer{flex:0 0 auto;padding:11px 16px 14px;border-top:1px solid rgba(255,255,255,.065);background:linear-gradient(180deg,rgba(10,17,31,.96),rgba(7,12,23,.99));display:grid;gap:10px}
.tf118-footer .tf117-done{margin:0!important;min-height:44px!important}
#tfManagerV117 .tf117-scroll{padding-bottom:18px!important}
.tf118-budget-row{border-color:rgba(49,219,201,.13)!important;background:linear-gradient(145deg,rgba(11,40,40,.24),rgba(255,255,255,.02))!important}
.tf118-budget-row small{color:#79a79f!important}
@media(max-width:600px){
  #tfManagerV117.tf117-modal{box-sizing:border-box!important;align-items:stretch!important;justify-content:center!important;padding:8px 10px 118px!important}
  #tfManagerV117 .tf117-sheet{height:100%!important;max-height:100%!important;margin:0 auto!important;border-radius:22px!important}
  #tfManagerV117 .tf117-head{padding:15px 14px 12px!important}
  #tfManagerV117 .tf117-scroll{padding:12px 12px 14px!important}
  #tfManagerV117 .tf117-row{padding:12px 11px!important}
  .tf118-footer{padding:9px 12px 11px!important}
}
`;
  document.head.appendChild(s);
}

function setOff(el,off){
  if(!el)return;
  el.classList.toggle('tf117-off',!!off);
  el.setAttribute('aria-hidden',off?'true':'false');
}
function apply503020(){
  const c=readCfg();
  const fifty=$('tf503020Hub');
  const pair=$('tfPairV117');
  if(fifty)setOff(fifty,!c.budget503020);
  if(pair){
    const active=(c.budget503020?1:0)+(c.mentalista?1:0);
    pair.classList.toggle('tf118-empty',active===0);
    pair.classList.toggle('tf118-single',active===1);
  }
}

function ensureFooter(manager){
  const sheet=manager.querySelector('.tf117-sheet');
  const scroll=manager.querySelector('.tf117-scroll');
  if(!sheet||!scroll)return;
  let footer=sheet.querySelector('.tf118-footer');
  if(!footer){footer=document.createElement('footer');footer.className='tf118-footer';sheet.appendChild(footer)}
  const note=scroll.querySelector('.tf117-note')||sheet.querySelector('.tf117-note');
  const done=scroll.querySelector('.tf117-done')||sheet.querySelector('.tf117-done');
  if(note){note.textContent='Solo eliges qué rutinas predeterminadas aparecen en el sistema. Tus hábitos y tareas personales no se modifican.';if(note.parentElement!==footer)footer.appendChild(note)}
  if(done&&done.parentElement!==footer)footer.appendChild(done);
}
function addBudgetRow(manager){
  const list=manager.querySelector('#tf117List');if(!list)return;
  const c=readCfg();
  let row=list.querySelector('[data-tf118-budget="1"]');
  if(!row){
    row=document.createElement('label');
    row.className='tf117-row tf118-budget-row';
    row.dataset.tf118Budget='1';
    row.innerHTML='<span><strong>50/30/20</strong><small>Rutina financiera predeterminada del sistema</small></span><input type="checkbox"><i class="tf117-sw" aria-hidden="true"></i>';
    const input=row.querySelector('input');
    input.addEventListener('change',()=>{
      const n=readCfg();n.budget503020=!!input.checked;store(n,true);
      setTimeout(()=>{patchManager();queueCloudThroughV117()},0);
    });
    list.appendChild(row);
  }
  const input=row.querySelector('input');if(input)input.checked=!!c.budget503020;
}
function bindAllButtons(manager){
  const on=manager.querySelector('#tf117AllOn'),off=manager.querySelector('#tf117AllOff');
  if(on&&on.dataset.tf118Bound!=='1'){
    on.dataset.tf118Bound='1';
    on.addEventListener('click',()=>setTimeout(()=>{const c=readCfg();for(const k of KEYS)c[k]=true;store(c,true);setTimeout(()=>{patchManager();queueCloudThroughV117()},0)},0));
  }
  if(off&&off.dataset.tf118Bound!=='1'){
    off.dataset.tf118Bound='1';
    off.addEventListener('click',()=>setTimeout(()=>{const c=readCfg();for(const k of KEYS)c[k]=false;store(c,true);setTimeout(()=>{patchManager();queueCloudThroughV117()},0)},0));
  }
}
function patchManager(){
  patchQueued=false;
  const manager=$('tfManagerV117');if(!manager)return;
  ensureFooter(manager);addBudgetRow(manager);bindAllButtons(manager);apply503020();
}
function queuePatch(){
  if(patchQueued)return;patchQueued=true;
  requestAnimationFrame(patchManager);
}
function observe(){
  if(observer||!document.body)return;
  observer=new MutationObserver(ms=>{
    let relevant=false;
    for(const m of ms){
      if(m.type==='childList'&&m.addedNodes&&m.addedNodes.length){relevant=true;break}
    }
    if(relevant)queuePatch();
  });
  observer.observe(document.body,{subtree:true,childList:true});
}
function start(){
  installStyle();initializeDefaults();queuePatch();apply503020();observe();
  setTimeout(()=>{queuePatch();apply503020()},250);
  setTimeout(()=>{queuePatch();apply503020()},900);
  setTimeout(()=>{queuePatch();apply503020()},1800);
}
window.TaskFlowV118={refresh:()=>{queuePatch();apply503020()},getRoutineConfig:readCfg};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();