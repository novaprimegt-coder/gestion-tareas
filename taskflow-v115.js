(function(){
'use strict';
if(window.__tfV115)return;window.__tfV115=true;

const CODE='MEJORAR';
const CFG='taskflow_routines_v115';
const META='taskflow_routines_v115_meta';
const MAIN='taskflow_db_v26',BACK='taskflow_db_v26_backup',REC='taskflow_db_v26_recovery',TOUCH='taskflow_cloud_local_touch_v1';
const PROJECT='taskflow-b0ece',API='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents';
const ROUTINES=[
 {id:'sung',name:'Sung Jin-Woo',term:'SUNG JIN-WOO'},
 {id:'juridico',name:'Dominio Jurídico',term:'DOMINIO JURIDICO'},
 {id:'socrates',name:'Sócrates',term:'SOCRATES'},
 {id:'maquiavelo',name:'Maquiavelo',term:'MAQUIAVELO'},
 {id:'mentalista',name:'Mentalista',term:'MENTALISTA'}
];
const GROUPS=[
 {ids:['sung','juridico'],texts:['RUTINAS DEL SISTEMA','DISCIPLINA Y DOMINIO']},
 {ids:['socrates','maquiavelo'],texts:['RUTINAS DE PENSAMIENTO','SOCRATES Y MAQUIAVELO']},
 {ids:['mentalista'],texts:['RUTINA ESPECIAL','MENTALISTA FORENSE']}
];
let refreshTimer=0,cloudUid='',cloudTimer=0,cloudBusy=false,observer=null;
const $=id=>document.getElementById(id);
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
function get(k){try{return localStorage.getItem(k)}catch(_){return null}}
function set(k,v){try{localStorage.setItem(k,String(v));return true}catch(_){return false}}
function json(k,f={}){try{const x=JSON.parse(get(k)||'null');return x&&typeof x==='object'?x:f}catch(_){return f}}
function cfg(){const s=json(CFG,{});let changed=false;ROUTINES.forEach(r=>{if(typeof s[r.id]!=='boolean'){s[r.id]=false;changed=true}});if(changed)set(CFG,JSON.stringify(s));return s}
function saveCfg(s){set(CFG,JSON.stringify(s));set(META,String(Date.now()));applyAll();renderManager();queueCloud()}

function installStyle(){
 if($('tfV115Style'))return;
 const s=document.createElement('style');s.id='tfV115Style';s.textContent=`
.tf115-hidden{display:none!important}
.tf115-modal{position:fixed;inset:0;z-index:2147483600;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.82);backdrop-filter:blur(8px)}
.tf115-modal.open{display:flex}.tf115-box{width:min(500px,100%);max-height:82dvh;overflow:auto;border-radius:22px;border:1px solid rgba(78,205,196,.24);background:linear-gradient(160deg,#121b30,#090e1b);box-shadow:0 30px 90px rgba(0,0,0,.55);padding:18px;color:#fff}.tf115-head{display:flex;justify-content:space-between;gap:14px}.tf115-head small{color:#55e1d3;font-size:9px;font-weight:900;letter-spacing:.14em}.tf115-head h2{margin:5px 0;font-size:23px}.tf115-head p{margin:0;color:#93a1b7;font-size:12px;line-height:1.45}.tf115-x{width:40px;height:40px;flex:0 0 40px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#fff;font-size:25px}.tf115-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:15px 0 10px}.tf115-actions button,.tf115-done,.tf115-confirm{min-height:42px;border-radius:12px;border:1px solid rgba(78,205,196,.25);background:rgba(78,205,196,.09);color:#63eadc;font-weight:850}.tf115-actions button:last-child{color:#ff9da7;border-color:rgba(255,100,115,.22);background:rgba(255,90,105,.07)}.tf115-list{display:grid;gap:8px}.tf115-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.03)}.tf115-row strong{display:block;font-size:13px}.tf115-row small{display:block;margin-top:3px;color:#8491a7;font-size:9px}.tf115-row input{position:absolute;opacity:0}.tf115-sw{width:46px;height:26px;border-radius:99px;background:#263145;position:relative;flex:0 0 46px}.tf115-sw:after{content:"";position:absolute;width:20px;height:20px;left:3px;top:3px;border-radius:50%;background:#8b96a8;transition:.2s}.tf115-row input:checked+.tf115-sw{background:rgba(54,220,201,.36)}.tf115-row input:checked+.tf115-sw:after{left:23px;background:#51e3d4}.tf115-done,.tf115-confirm{width:100%;margin-top:12px}.tf115-warning{margin:13px 0;padding:12px;border-radius:13px;border:1px solid rgba(255,166,72,.20);background:rgba(255,140,52,.06);color:#b8c3d4;font-size:12px;line-height:1.5}.tf115-warning strong{color:#fff}.tf115-confirm{color:#ffc184;border-color:rgba(255,166,72,.28);background:rgba(255,140,52,.10)}
#tfSystemResetV115{margin-top:8px!important;border-color:rgba(255,166,72,.28)!important;background:rgba(255,140,52,.08)!important;color:#ffb66f!important}
#tfPairV115{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;width:100%!important;align-items:stretch!important}#tfPairV115.tf-one{grid-template-columns:1fr!important}#tfPairV115>*{width:100%!important;max-width:none!important;min-width:0!important;grid-column:auto!important;margin:0!important}
.tf115-search-proxy{position:absolute!important;inset:0!important;z-index:5!important;display:flex!important;align-items:center!important;min-width:0!important;outline:none!important;background:transparent!important;border:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;cursor:text!important}
.tf115-search-proxy:empty:before{content:attr(data-placeholder);color:inherit;opacity:.72;pointer-events:none}.tf115-search-native{pointer-events:none!important;caret-color:transparent!important;user-select:none!important;color:transparent!important}.tf115-search-native::placeholder{color:transparent!important;opacity:0!important}
@media(max-width:430px){.tf115-actions{grid-template-columns:1fr}#tfPairV115{gap:8px!important}}
`;
 document.head.appendChild(s);
}

function ownText(el){let t='';for(const n of el.childNodes){if(n.nodeType===Node.TEXT_NODE)t+=' '+n.nodeValue}return norm(t)}
function routineCount(text){const n=norm(text);return ROUTINES.reduce((c,r)=>c+(n.includes(r.term)?1:0),0)}
function cardScore(el,term){
 const txt=norm(el.textContent);if(!txt.includes(term))return -999;
 if(el.closest('.tf115-modal,#tfProfileOverlay'))return -999;
 if(/^(BODY|HTML|MAIN|SECTION)$/.test(el.tagName)&&txt.length>700)return -999;
 let score=0;const cls=String(el.className||'').toLowerCase();
 if(/routine|card|tile|rank|mental|jurid|socr|maqui|system/.test(cls))score+=9;
 if(el.matches('button,[role="button"],article'))score+=7;
 const rc=el.getBoundingClientRect();if(rc.width>120&&rc.height>70&&rc.height<360)score+=6;
 if(routineCount(txt)===1)score+=5;else if(routineCount(txt)>1)score-=10;
 if(txt.length<250)score+=5;else if(txt.length>650)score-=8;
 const cs=getComputedStyle(el);const br=parseFloat(cs.borderRadius)||0;if(br>=8)score+=3;
 if(cs.backgroundColor&&cs.backgroundColor!=='rgba(0, 0, 0, 0)'&&cs.backgroundColor!=='transparent')score+=2;
 return score;
}
function findRoutineCard(term){
 const t=norm(term);let best=null,bestScore=-999;
 const nodes=document.querySelectorAll('button,[role="button"],article,div,li');
 for(const el of nodes){const sc=cardScore(el,t);if(sc>bestScore){best=el;bestScore=sc}}
 return bestScore>=8?best:null;
}
function toggle(el,on){if(!el)return;if(on){el.classList.remove('tf115-hidden');el.removeAttribute('aria-hidden')}else{el.classList.add('tf115-hidden');el.setAttribute('aria-hidden','true')}}

function textNodesFor(term){
 const t=norm(term),out=[];
 for(const el of document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,div')){
  if(el.closest('.tf115-modal,#tfProfileOverlay'))continue;
  const own=ownText(el),all=norm(el.textContent);
  if(own===t||(el.children.length===0&&all===t))out.push(el);
 }
 return out;
}
function groupHeaderElements(group){
 const setEls=new Set();
 for(const term of group.texts)for(const el of textNodesFor(term))setEls.add(el);
 const arr=[...setEls];
 for(const el of [...arr]){
  let p=el.parentElement,depth=0;
  while(p&&depth++<3&&p!==document.body){
   const txt=norm(p.textContent);
   const hasRoutine=ROUTINES.some(r=>findRoutineCard(r.term)===p)||routineCount(txt)>0;
   if(hasRoutine)break;
   const rect=p.getBoundingClientRect();
   if(txt.length<180&&rect.height>0&&rect.height<160)setEls.add(p);
   p=p.parentElement;
  }
 }
 return [...setEls];
}
function stripForense(){
 const root=document.body;if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const list=[];let n;
 while((n=walker.nextNode())){
  const parent=n.parentElement;if(!parent||parent.closest('.tf115-modal,#tfProfileOverlay'))continue;
  if(/mentalista\s+forense/i.test(n.nodeValue||'')){if(parent)parent.dataset.tf115SpecialTitle='1';list.push(n)}
 }
 for(const x of list)x.nodeValue=String(x.nodeValue||'').replace(/Mentalista\s+Forense/gi,'Mentalista').replace(/\s+Forense/gi,'');
 const f=findRoutineCard('FORENSE'),m=findRoutineCard('MENTALISTA');if(f&&f!==m)toggle(f,false);
}
function applyRoutineVisibility(){
 stripForense();const s=cfg();
 const cards={};
 for(const r of ROUTINES){cards[r.id]=findRoutineCard(r.term);toggle(cards[r.id],s[r.id]===true)}
 for(const g of GROUPS){const on=g.ids.some(id=>s[id]===true);for(const el of groupHeaderElements(g))toggle(el,on)}
 for(const el of document.querySelectorAll('[data-tf115-special-title="1"]'))toggle(el,s.mentalista===true);
 if(s.mentalista===true){for(const el of groupHeaderElements(GROUPS[2]))toggle(el,false)}
 pair503020(cards.mentalista,s.mentalista===true);
}
function find503020(){
 const t='50/30/20';let best=null,score=-999;
 for(const el of document.querySelectorAll('button,[role="button"],article,div')){
  if(el.closest('.tf115-modal,#tfProfileOverlay'))continue;
  const txt=norm(el.textContent);if(!txt.includes(t))continue;
  let s=0;const cls=String(el.className||'').toLowerCase();if(/quick|card|tile|action/.test(cls))s+=8;if(el.matches('button,[role="button"],article'))s+=5;const r=el.getBoundingClientRect();if(r.width>180&&r.height>60&&r.height<220)s+=5;if(txt.length<220)s+=4;if(s>score){score=s;best=el}
 }
 return best;
}
function pair503020(mental,on){
 const a=find503020();if(!a)return;let wrap=$('tfPairV115');
 if(on&&mental&&a!==mental){
  if(!wrap){wrap=document.createElement('div');wrap.id='tfPairV115';a.parentElement&&a.parentElement.insertBefore(wrap,a)}
  wrap.classList.remove('tf-one');if(a.parentElement!==wrap)wrap.appendChild(a);if(mental.parentElement!==wrap)wrap.appendChild(mental);toggle(mental,true);
 }else if(wrap){wrap.classList.add('tf-one');if(a.parentElement!==wrap)wrap.appendChild(a)}
}

function manager(){
 if($('tfManagerV115'))return;
 const o=document.createElement('div');o.id='tfManagerV115';o.className='tf115-modal';o.setAttribute('aria-hidden','true');
 o.innerHTML='<section class="tf115-box" role="dialog" aria-modal="true"><div class="tf115-head"><div><small>CONFIGURACIÓN DEL SISTEMA</small><h2>Rutinas predeterminadas</h2><p>Todas están desactivadas hasta que tú decidas activarlas.</p></div><button class="tf115-x" type="button" data-close-manager aria-label="Cerrar">×</button></div><div class="tf115-actions"><button id="tf115AllOn" type="button">Activar todas</button><button id="tf115AllOff" type="button">Desactivar todas</button></div><div class="tf115-list" id="tf115List"></div><button class="tf115-done" type="button" data-close-manager>Guardar y cerrar</button></section>';
 document.body.appendChild(o);
 $('tf115AllOn').onclick=()=>{const s=cfg();ROUTINES.forEach(r=>s[r.id]=true);saveCfg(s)};
 $('tf115AllOff').onclick=()=>{const s=cfg();ROUTINES.forEach(r=>s[r.id]=false);saveCfg(s)};
 o.addEventListener('click',e=>{if(e.target===o||e.target.closest('[data-close-manager]'))closeManager()});renderManager();
}
function renderManager(){const l=$('tf115List');if(!l)return;const s=cfg();l.innerHTML='';for(const r of ROUTINES){const row=document.createElement('label');row.className='tf115-row';row.innerHTML='<span><strong>'+r.name+'</strong><small>Rutina predeterminada del sistema</small></span><input type="checkbox" '+(s[r.id]?'checked':'')+'><i class="tf115-sw" aria-hidden="true"></i>';row.querySelector('input').onchange=e=>{const n=cfg();n[r.id]=!!e.target.checked;saveCfg(n)};l.appendChild(row)}}
function openManager(){manager();renderManager();const o=$('tfManagerV115');o.classList.add('open');o.setAttribute('aria-hidden','false')}
function closeManager(){const o=$('tfManagerV115');if(o){o.classList.remove('open');o.setAttribute('aria-hidden','true')}}

function nativeSearch(){return [...document.querySelectorAll('input')].find(el=>norm(el.getAttribute('placeholder')).includes('BUSCAR')||String(el.type||'').toLowerCase()==='search')||null}
function installSearchProxy(){
 const input=nativeSearch();if(!input||input.dataset.tf115Proxy==='1')return;
 const parent=input.parentElement;if(!parent)return;const cs=getComputedStyle(input);input.dataset.tf115Proxy='1';input.classList.add('tf115-search-native');input.tabIndex=-1;input.readOnly=true;input.setAttribute('autocomplete','off');input.setAttribute('aria-hidden','true');
 const pcs=getComputedStyle(parent);if(pcs.position==='static')parent.style.position='relative';
 const proxy=document.createElement('div');proxy.id='tfSearchProxyV115';proxy.className='tf115-search-proxy';proxy.contentEditable='true';proxy.setAttribute('role','searchbox');proxy.setAttribute('aria-label','Buscar');proxy.setAttribute('data-placeholder',input.getAttribute('placeholder')||'Buscar...');proxy.setAttribute('spellcheck','false');
 proxy.style.padding=cs.padding;proxy.style.font=cs.font;proxy.style.color=cs.color;proxy.style.letterSpacing=cs.letterSpacing;proxy.style.textAlign=cs.textAlign;
 proxy.addEventListener('pointerdown',e=>e.stopPropagation());proxy.addEventListener('click',e=>e.stopPropagation());
 proxy.addEventListener('input',()=>{
  const value=String(proxy.textContent||'').replace(/\n/g,'');
  if(norm(value)===CODE){proxy.textContent='';input.value='';try{input.dispatchEvent(new Event('input',{bubbles:true}))}catch(_){}openManager();return}
  input.value=value;try{input.dispatchEvent(new Event('input',{bubbles:true}))}catch(_){}
 });
 proxy.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const v=String(proxy.textContent||'');if(norm(v)===CODE){proxy.textContent='';input.value='';openManager()}}});
 parent.appendChild(proxy);
}

function resetModal(){if($('tfResetModalV115'))return;const o=document.createElement('div');o.id='tfResetModalV115';o.className='tf115-modal';o.setAttribute('aria-hidden','true');o.innerHTML='<section class="tf115-box" role="dialog" aria-modal="true"><div class="tf115-head"><div><small>REINICIO DE SISTEMA</small><h2>Volver a 0 días</h2><p>Reinicia únicamente los días de progreso y fallas del sistema.</p></div><button class="tf115-x" type="button" data-close-reset>×</button></div><div class="tf115-warning"><strong>Tus hábitos y tareas NO se borrarán ni se reiniciarán.</strong><br>Para eliminar o editar hábitos y tareas debes hacerlo manualmente.</div><button class="tf115-confirm" id="tf115ConfirmReset" type="button">Confirmar reinicio a 0 días</button></section>';document.body.appendChild(o);o.addEventListener('click',e=>{if(e.target===o||e.target.closest('[data-close-reset]'))closeReset()});$('tf115ConfirmReset').onclick=resetProgress}
function mountReset(){if($('tfSystemResetV115'))return;const box=$('tfProfileUserBox');if(!box)return;const old=$('tfSystemResetV113');if(old)old.remove();const b=document.createElement('button');b.id='tfSystemResetV115';b.type='button';b.className='tf-profile-action';b.textContent='Reinicio de sistema';b.onclick=openReset;const sign=$('tfProfileSignOut');sign&&sign.parentElement===box?box.insertBefore(b,sign):box.appendChild(b)}
function openReset(){resetModal();const o=$('tfResetModalV115');o.classList.add('open');o.setAttribute('aria-hidden','false')}
function closeReset(){const o=$('tfResetModalV115');if(o){o.classList.remove('open');o.setAttribute('aria-hidden','true')}}
function protectedBranch(k){const n=norm(k).replace(/[^A-Z0-9]/g,'');return /^(TASKS?|TAREAS?|HABITS?|HABITOS?|AVITOS?)$/.test(n)}
function counterKey(k){const n=norm(k).replace(/[^A-Z0-9]/g,'');if(!n||/(DATE|FECHA|TIMESTAMP|SAVEDAT|UPDATEDAT|CREATEDAT|LASTRESET|NEXTRESET)/.test(n))return false;return /(STREAK|RACHA|CONSECUTIVE|CONSECUTIVOS|DAYS|DIAS)/.test(n)||/(FAIL|FAILURE|FALLA|MISSED).*(COUNT|COUNTER|TOTAL)$/.test(n)||/^(FAILS|FAILURES|FALLAS|DAYCOUNT|DIAS)$/.test(n)}
function walk(v,k){if(protectedBranch(k))return[v,0];let c=0;if(typeof v==='number'&&Number.isFinite(v)&&counterKey(k))return[0,v!==0?1:0];if(typeof v==='string'&&/^\d+(\.\d+)?$/.test(v)&&counterKey(k))return['0',v!=='0'?1:0];if(Array.isArray(v))return[v.map((x,i)=>{if(x&&typeof x==='object'){const r=walk(x,String(i));c+=r[1];return r[0]}return x}),c];if(v&&typeof v==='object'){const o={};for(const x of Object.keys(v)){const r=walk(v[x],x);o[x]=r[0];c+=r[1]}return[o,c]}return[v,0]}
function processKey(k){const raw=get(k);if(!raw)return 0;let d;try{d=JSON.parse(raw)}catch(_){return 0}if(!d||typeof d!=='object')return 0;const r=walk(d,k);if(r[1])set(k,JSON.stringify(r[0]));return r[1]}
async function resetProgress(){const b=$('tf115ConfirmReset');if(b)b.disabled=true;let changed=0;try{const keys=[];for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));for(const k of keys){if(!k||!k.startsWith('taskflow_')||k===CFG||k===META||k.includes('firebase')||k.includes('profile_photo')||k.includes('503020')||k.includes('share_')||k.includes('cloud_sync_meta')||k.includes('cloud_bound'))continue;changed+=processKey(k)}const main=get(MAIN);if(main){set(BACK,main);set(REC,main)}set(TOUCH,String(Date.now()));if(window.TaskFlowCloudSync&&typeof window.TaskFlowCloudSync.syncNow==='function'){try{await window.TaskFlowCloudSync.syncNow()}catch(_){}}closeReset();const m=$('tfProfileMessage');if(m){m.textContent=changed?'Sistema reiniciado a 0 días. Tus hábitos y tareas se conservaron.':'Los contadores ya estaban en 0. Tus hábitos y tareas no fueron modificados.';m.className='tf-profile-message ok'}setTimeout(()=>location.reload(),700)}finally{if(b)b.disabled=false}}

function queueCloud(){if(cloudTimer)clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>{cloudTimer=0;pushCloud().catch(()=>{})},700)}
async function token(force){return window.TaskFlowFirebase&&window.TaskFlowFirebase.getIdToken?window.TaskFlowFirebase.getIdToken(!!force):null}
async function req(uid,opt){let t=await token(false);if(!t)throw new Error('AUTH');const url=API+'/users/'+encodeURIComponent(uid)+'/settings/routinesV115';const o=Object.assign({},opt||{});o.headers=Object.assign({'Authorization':'Bearer '+t,'Content-Type':'application/json'},o.headers||{});let r=await fetch(url,o);if(r.status===401){t=await token(true);if(t){o.headers.Authorization='Bearer '+t;r=await fetch(url,o)}}if(r.status===404)return null;const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error('HTTP '+r.status);return d}
async function pushCloud(){if(cloudBusy||!cloudUid)return;cloudBusy=true;try{let at=Number(get(META))||0;if(!at){at=Date.now();set(META,String(at))}await req(cloudUid,{method:'PATCH',body:JSON.stringify({fields:{config:{stringValue:get(CFG)||JSON.stringify(cfg())},updatedAt:{integerValue:String(at)}}})})}finally{cloudBusy=false}}
async function reconcile(uid){const local=Number(get(META))||0,d=await req(uid,{method:'GET'});if(!d){if(!local)set(META,String(Date.now()));await pushCloud();return}const f=d.fields||{},remote=Number(f.updatedAt&&f.updatedAt.integerValue||0),data=String(f.config&&f.config.stringValue||'');if(remote>local&&data){set(CFG,data);set(META,String(remote));applyAll();renderManager()}else if(local>remote)await pushCloud()}
function cloudWatch(){const u=window.TaskFlowFirebase&&window.TaskFlowFirebase.getUser?window.TaskFlowFirebase.getUser():null,uid=u&&u.uid||'';if(uid===cloudUid)return;cloudUid=uid;if(uid)reconcile(uid).catch(()=>{})}

function applyAll(){stripForense();applyRoutineVisibility();mountReset();installSearchProxy();cloudWatch()}
function schedule(){if(!refreshTimer)refreshTimer=setTimeout(()=>{refreshTimer=0;applyAll()},90)}
function start(){installStyle();cfg();manager();resetModal();applyAll();setTimeout(applyAll,250);setTimeout(applyAll,900);setTimeout(applyAll,1800);observer=new MutationObserver(ms=>{if(ms.some(m=>m.addedNodes&&m.addedNodes.length))schedule()});observer.observe(document.body,{subtree:true,childList:true});setInterval(cloudWatch,1800);document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeManager();closeReset()}},true)}
window.TaskFlowV115={refresh:applyAll,openRoutineManager:openManager,openSystemReset:openReset};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();