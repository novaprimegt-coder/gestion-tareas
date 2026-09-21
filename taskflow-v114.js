(function(){
'use strict';
if(window.__tfV114)return;window.__tfV114=true;

const CODE='MEJORAR';
const CFG='taskflow_forced_routines_v113';
const ROUTINES=[
 {id:'sung',name:'Sung Jin-Woo',needle:'SUNG JIN-WOO'},
 {id:'juridico',name:'Dominio Jurídico',needle:'DOMINIO JURIDICO'},
 {id:'socrates',name:'Sócrates',needle:'SOCRATES'},
 {id:'maquiavelo',name:'Maquiavelo',needle:'MAQUIAVELO'},
 {id:'mentalista',name:'Mentalista',needle:'MENTALISTA'}
];
const GROUPS=[
 {ids:['sung','juridico'],labels:[['RUTINAS DEL SISTEMA','system-label'],['DISCIPLINA Y DOMINIO','system-title']]},
 {ids:['socrates','maquiavelo'],labels:[['RUTINAS DE PENSAMIENTO','thought-label'],['SOCRATES Y MAQUIAVELO','thought-title']]},
 {ids:['mentalista'],labels:[['RUTINA ESPECIAL','special-label'],['MENTALISTA FORENSE','special-title']]}
];
let timer=0;
const $=id=>document.getElementById(id);
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
function get(k){try{return localStorage.getItem(k)}catch(_){return null}}
function set(k,v){try{localStorage.setItem(k,String(v));return true}catch(_){return false}}
function cfg(){let s={};try{s=JSON.parse(get(CFG)||'{}')||{}}catch(_){}let changed=false;ROUTINES.forEach(r=>{if(typeof s[r.id]!=='boolean'){s[r.id]=false;changed=true}});if(changed)set(CFG,JSON.stringify(s));return s}
function save(s){set(CFG,JSON.stringify(s));try{localStorage.setItem('taskflow_routines_v113_meta',String(Date.now()))}catch(_){}apply();renderManager();if(window.TaskFlowCloudSync&&typeof window.TaskFlowCloudSync.syncNow==='function'){setTimeout(()=>{try{window.TaskFlowCloudSync.syncNow()}catch(_){}},80)}}

function style(){if($('tfV114Style'))return;const s=document.createElement('style');s.id='tfV114Style';s.textContent=`
.tf114-hidden{display:none!important}
.tf114-modal{position:fixed;inset:0;z-index:2147483500;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.82);backdrop-filter:blur(8px)}
.tf114-modal.open{display:flex}.tf114-box{width:min(500px,100%);max-height:82dvh;overflow:auto;border-radius:22px;border:1px solid rgba(78,205,196,.24);background:linear-gradient(160deg,#121b30,#090e1b);box-shadow:0 30px 90px rgba(0,0,0,.55);padding:18px;color:#fff}.tf114-head{display:flex;justify-content:space-between;gap:14px}.tf114-head small{color:#55e1d3;font-size:9px;font-weight:900;letter-spacing:.14em}.tf114-head h2{margin:5px 0;font-size:23px}.tf114-head p{margin:0;color:#93a1b7;font-size:12px;line-height:1.45}.tf114-x{width:40px;height:40px;flex:0 0 40px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#fff;font-size:25px}.tf114-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:15px 0 10px}.tf114-actions button,.tf114-done{min-height:42px;border-radius:12px;border:1px solid rgba(78,205,196,.25);background:rgba(78,205,196,.09);color:#63eadc;font-weight:850}.tf114-actions button:last-child{color:#ff9da7;border-color:rgba(255,100,115,.22);background:rgba(255,90,105,.07)}.tf114-list{display:grid;gap:8px}.tf114-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.03)}.tf114-row strong{display:block;font-size:13px}.tf114-row small{display:block;margin-top:3px;color:#8491a7;font-size:9px}.tf114-row input{position:absolute;opacity:0}.tf114-sw{width:46px;height:26px;border-radius:99px;background:#263145;position:relative;flex:0 0 46px}.tf114-sw:after{content:"";position:absolute;width:20px;height:20px;left:3px;top:3px;border-radius:50%;background:#8b96a8;transition:.2s}.tf114-row input:checked+.tf114-sw{background:rgba(54,220,201,.36)}.tf114-row input:checked+.tf114-sw:after{left:23px;background:#51e3d4}.tf114-done{width:100%;margin-top:12px}@media(max-width:430px){.tf114-actions{grid-template-columns:1fr}}
`;document.head.appendChild(s)}

function routineCard(term){
 const t=norm(term);
 const q='button,[role="button"],article,.quick-action-btn,[class*="routine"],[class*="card"],[class*="tile"]';
 const els=[...document.querySelectorAll(q)].filter(el=>!el.closest('.tf113-modal,.tf114-modal,#tfProfileOverlay')&&norm(el.textContent).includes(t)&&norm(el.textContent).length<650);
 els.sort((a,b)=>norm(a.textContent).length-norm(b.textContent).length);
 return els[0]||null;
}
function toggleEl(el,on){if(!el)return;if(on){el.classList.remove('tf114-hidden');el.removeAttribute('aria-hidden')}else{el.classList.add('tf114-hidden');el.setAttribute('aria-hidden','true')}}
function markLabel(term,key){
 const t=norm(term);
 const els=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,div')].filter(el=>!el.closest('.tf113-modal,.tf114-modal,#tfProfileOverlay')&&norm(el.textContent)===t&&el.children.length<=2);
 els.sort((a,b)=>a.children.length-b.children.length);
 const el=els[0];if(!el)return null;el.dataset.tf114GroupTitle=key;return el;
}
function stripForense(){
 const els=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,div')].filter(el=>!el.closest('.tf113-modal,.tf114-modal,#tfProfileOverlay')&&norm(el.textContent)==='MENTALISTA FORENSE'&&el.children.length<=2);
 els.forEach(el=>{if(!el.dataset.tf114MentalistaTitle)el.dataset.tf114MentalistaTitle='1';if(el.children.length===0)el.textContent='Mentalista';else{const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){if(/forense/i.test(n.nodeValue||''))n.nodeValue=String(n.nodeValue||'').replace(/\s*forense\s*/gi,' ').replace(/\s{2,}/g,' ').trim()}}});
 const f=routineCard('FORENSE'),m=routineCard('MENTALISTA');if(f&&f!==m)toggleEl(f,false);
}
function groupTitles(s){
 GROUPS.forEach(g=>{
  const on=g.ids.some(id=>s[id]===true);
  g.labels.forEach(([term,key])=>{let el=document.querySelector('[data-tf114-group-title="'+key+'"]');if(!el)el=markLabel(term,key);toggleEl(el,on)});
 });
 const special=document.querySelector('[data-tf114-mentalista-title="1"]');if(special)toggleEl(special,s.mentalista===true);
}
function apply(){
 stripForense();const s=cfg();
 ROUTINES.forEach(r=>toggleEl(routineCard(r.needle),s[r.id]===true));
 groupTitles(s);
}

function manager(){
 if($('tfManagerV114'))return;
 const o=document.createElement('div');o.id='tfManagerV114';o.className='tf114-modal';o.setAttribute('aria-hidden','true');
 o.innerHTML='<section class="tf114-box" role="dialog" aria-modal="true" aria-labelledby="tf114Title"><div class="tf114-head"><div><small>CONFIGURACIÓN DEL SISTEMA</small><h2 id="tf114Title">Rutinas predeterminadas</h2><p>Todas permanecen ocultas hasta que las actives manualmente.</p></div><button class="tf114-x" type="button" data-tf114-close aria-label="Cerrar">×</button></div><div class="tf114-actions"><button id="tf114AllOn" type="button">Activar todas</button><button id="tf114AllOff" type="button">Desactivar todas</button></div><div class="tf114-list" id="tf114List"></div><button class="tf114-done" type="button" data-tf114-close>Guardar y cerrar</button></section>';
 document.body.appendChild(o);
 $('tf114AllOn').addEventListener('click',()=>{const s=cfg();ROUTINES.forEach(r=>s[r.id]=true);save(s)});
 $('tf114AllOff').addEventListener('click',()=>{const s=cfg();ROUTINES.forEach(r=>s[r.id]=false);save(s)});
 o.addEventListener('click',e=>{if(e.target===o||e.target.closest('[data-tf114-close]'))closeManager()});
 renderManager();
}
function renderManager(){const l=$('tf114List');if(!l)return;const s=cfg();l.innerHTML='';ROUTINES.forEach(r=>{const row=document.createElement('label');row.className='tf114-row';row.innerHTML='<span><strong>'+r.name+'</strong><small>Rutina predeterminada del sistema</small></span><input type="checkbox" '+(s[r.id]?'checked':'')+'><i class="tf114-sw" aria-hidden="true"></i>';row.querySelector('input').addEventListener('change',e=>{const n=cfg();n[r.id]=!!e.target.checked;save(n)});l.appendChild(row)})}
function openManager(){manager();renderManager();const o=$('tfManagerV114');o.classList.add('open');o.setAttribute('aria-hidden','false')}
function closeManager(){const o=$('tfManagerV114');if(o){o.classList.remove('open');o.setAttribute('aria-hidden','true')}}

function isSearch(el){return el&&el.tagName==='INPUT'&&(String(el.type||'').toLowerCase()==='search'||norm(el.getAttribute('placeholder')).includes('BUSCAR'))}
function isolateSearch(){
 if(!$('tfSearchIsolationV114')){const f=document.createElement('form');f.id='tfSearchIsolationV114';f.setAttribute('autocomplete','off');f.setAttribute('aria-hidden','true');f.style.display='none';f.addEventListener('submit',e=>e.preventDefault());document.body.appendChild(f)}
 document.querySelectorAll('input').forEach(el=>{if(!isSearch(el))return;try{el.type='search'}catch(_){}el.setAttribute('name','taskflow_search');el.setAttribute('autocomplete','off');el.setAttribute('autocorrect','off');el.setAttribute('autocapitalize','none');el.setAttribute('spellcheck','false');el.setAttribute('inputmode','search');el.setAttribute('enterkeyhint','search');el.setAttribute('role','searchbox');el.setAttribute('form','tfSearchIsolationV114');el.setAttribute('data-form-type','other');el.setAttribute('data-lpignore','true');el.setAttribute('data-1p-ignore','true');el.setAttribute('data-bwignore','true')});
}
function intercept(e){const el=e.target;if(!isSearch(el)||norm(el.value)!==CODE)return;e.preventDefault();e.stopImmediatePropagation();el.value='';try{el.dispatchEvent(new Event('input',{bubbles:true}))}catch(_){}setTimeout(openManager,0)}

function refresh(){timer=0;isolateSearch();apply()}
function schedule(){if(!timer)timer=setTimeout(refresh,80)}
function start(){style();cfg();manager();isolateSearch();apply();document.addEventListener('input',intercept,true);document.addEventListener('change',intercept,true);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeManager()},true);setTimeout(refresh,250);setTimeout(refresh,900);setTimeout(refresh,1800);new MutationObserver(ms=>{if(ms.some(m=>m.addedNodes&&m.addedNodes.length))schedule()}).observe(document.body,{subtree:true,childList:true})}
window.TaskFlowV114={refresh,openRoutineManager:openManager};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();