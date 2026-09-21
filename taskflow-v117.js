(function(){
'use strict';
if(window.__tfV117)return;window.__tfV117=true;

const CODE='MEJORAR';
const CFG='taskflow_routines_v115';
const CFG_META='taskflow_routines_v115_meta';
const MAIN='taskflow_db_v26',BACK='taskflow_db_v26_backup',REC='taskflow_db_v26_recovery',TOUCH='taskflow_cloud_local_touch_v1';
const PROJECT='taskflow-b0ece',API='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents';
const ROUTINES=[
 {id:'sung',name:'Sung Jin-Woo'},
 {id:'juridico',name:'Dominio Jurídico'},
 {id:'socrates',name:'Sócrates'},
 {id:'maquiavelo',name:'Maquiavelo'},
 {id:'mentalista',name:'Mentalista'}
];
let observer=null,scheduled=false,cloudUid='',cloudBusy=false,cloudTimer=0,previousOverflow='';
const $=id=>document.getElementById(id);
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
function get(k){try{return localStorage.getItem(k)}catch(_){return null}}
function set(k,v){try{localStorage.setItem(k,String(v));return true}catch(_){return false}}
function json(k,f={}){try{const x=JSON.parse(get(k)||'null');return x&&typeof x==='object'&&!Array.isArray(x)?x:f}catch(_){return f}}
function cfg(){const s=json(CFG,{});let changed=false;for(const r of ROUTINES){if(typeof s[r.id]!=='boolean'){s[r.id]=false;changed=true}}if(changed){set(CFG,JSON.stringify(s));set(CFG_META,String(Date.now()))}return s}
function saveCfg(s){set(CFG,JSON.stringify(s));set(CFG_META,String(Date.now()));applyVisibility();renderManager();queueCloud()}

function installStyle(){
 if($('tfV117Style'))return;
 const st=document.createElement('style');st.id='tfV117Style';st.textContent=`
.tf117-off{display:none!important}
.tf117-one{grid-template-columns:1fr!important}
.tf117-modal{position:fixed;inset:0;z-index:2147483600;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(2,6,16,.84);backdrop-filter:blur(9px);overscroll-behavior:none;touch-action:auto}
.tf117-modal.open{display:flex}
.tf117-sheet{width:min(520px,100%);height:min(760px,calc(100dvh - 28px));max-height:calc(100dvh - 28px);display:flex;flex-direction:column;min-height:0;border-radius:24px;border:1px solid rgba(78,205,196,.28);background:linear-gradient(160deg,#121d34 0%,#0a1120 58%,#070c17 100%);box-shadow:0 30px 90px rgba(0,0,0,.62);color:#fff;overflow:hidden}
.tf117-head{flex:0 0 auto;display:flex;justify-content:space-between;gap:14px;padding:18px 18px 14px;border-bottom:1px solid rgba(255,255,255,.055);background:linear-gradient(180deg,rgba(20,31,54,.96),rgba(14,22,39,.92))}
.tf117-head small{color:#55e1d3;font-size:9px;font-weight:950;letter-spacing:.15em}.tf117-head h2{margin:5px 0 4px;font-size:24px;line-height:1.08}.tf117-head p{margin:0;color:#8f9db3;font-size:11px;line-height:1.45}
.tf117-x{width:42px;height:42px;flex:0 0 42px;border-radius:13px;border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.045);color:#fff;font-size:27px;line-height:1;display:grid;place-items:center}
.tf117-scroll{flex:1 1 auto;min-height:0;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain!important;touch-action:pan-y!important;scrollbar-width:thin;scrollbar-color:#27d8cd rgba(255,255,255,.045);padding:14px 16px 28px}
.tf117-scroll::-webkit-scrollbar{width:5px}.tf117-scroll::-webkit-scrollbar-track{background:rgba(255,255,255,.035)}.tf117-scroll::-webkit-scrollbar-thumb{background:#27d8cd;border-radius:999px}
.tf117-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:11px}.tf117-actions button,.tf117-done,.tf117-confirm{min-height:45px;border-radius:13px;border:1px solid rgba(78,205,196,.25);background:rgba(78,205,196,.09);color:#62e4d7;font-weight:900;font-size:12px}.tf117-actions button:last-child{color:#ff9ca7;border-color:rgba(255,100,115,.24);background:rgba(255,90,105,.065)}
.tf117-list{display:grid;gap:9px}.tf117-row{display:flex;align-items:center;justify-content:space-between;gap:13px;padding:14px 13px;border:1px solid rgba(255,255,255,.075);border-radius:15px;background:rgba(255,255,255,.028)}.tf117-row strong{display:block;font-size:13px}.tf117-row small{display:block;margin-top:3px;color:#7e8da5;font-size:8px}.tf117-row input{position:absolute;opacity:0;pointer-events:none}.tf117-sw{width:48px;height:27px;border-radius:99px;background:#263247;position:relative;flex:0 0 48px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.025)}.tf117-sw:after{content:"";position:absolute;width:21px;height:21px;left:3px;top:3px;border-radius:50%;background:#8998ad;transition:.18s}.tf117-row input:checked+.tf117-sw{background:rgba(50,221,201,.31);box-shadow:inset 0 0 0 1px rgba(82,232,217,.16)}.tf117-row input:checked+.tf117-sw:after{left:24px;background:#55e5d7;box-shadow:0 0 12px rgba(79,226,213,.32)}
.tf117-done{width:100%;margin-top:12px}.tf117-note{margin-top:11px;padding:10px 11px;border-radius:12px;background:rgba(139,99,255,.055);border:1px solid rgba(139,99,255,.12);font-size:9px;line-height:1.45;color:#8f9db3}
#tfPairV117{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;width:100%;align-items:stretch;grid-column:1/-1;min-width:0}
#tfPairV117.tf117-single{grid-template-columns:1fr}
#tfPairV117>#tf503020Hub,#tfPairV117>#tfMentalistPairV117{width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;grid-column:auto!important;min-height:96px!important;height:auto!important;box-sizing:border-box!important}
#tfPairV117>#tf503020Hub{border-radius:19px!important;padding:13px 14px!important;align-items:center!important;background:linear-gradient(145deg,rgba(7,44,43,.82),rgba(12,20,30,.96))!important;border:1px solid rgba(50,221,201,.23)!important;box-shadow:0 14px 30px rgba(0,0,0,.13)!important}
.tf117-mental-card{position:relative;display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:9px;padding:12px;border-radius:19px;border:1px solid rgba(151,118,255,.28);background:radial-gradient(circle at 15% 15%,rgba(105,71,210,.18),transparent 34%),linear-gradient(145deg,rgba(18,18,47,.98),rgba(7,13,27,.99));color:#eef2ff;text-align:left;overflow:hidden;box-shadow:0 14px 30px rgba(0,0,0,.16);cursor:pointer}
.tf117-mental-card::after{content:"";position:absolute;right:-40px;bottom:-62px;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(80,227,218,.11),transparent 68%);pointer-events:none}
.tf117-mental-card .v94-mentalist-icon{width:44px!important;height:44px!important;border-radius:14px!important;position:relative;z-index:1}.tf117-mental-card .v94-mentalist-icon svg{width:23px!important;height:23px!important}
.tf117-mental-card .v94-mentalist-copy{min-width:0;position:relative;z-index:1}.tf117-mental-card .v94-mentalist-copy .kicker{font-size:6.5px!important;letter-spacing:.14em!important;margin:0 0 2px!important}.tf117-mental-card .v94-mentalist-copy strong{font-size:13px!important;line-height:1.1!important}.tf117-mental-card .v94-mentalist-copy small{font-size:7px!important;line-height:1.2!important;margin-top:3px!important;white-space:normal!important}.tf117-mental-card .v94-mentalist-bar{height:3px!important;margin-top:6px!important}.tf117-mental-card .v94-mentalist-progress{min-width:43px!important;padding:6px 7px!important;font-size:9px!important;position:relative;z-index:1}
#v94MentalistRoutine{display:none!important}
#v32MandatoryMissions .v83-core-grid.tf117-one,#v69DailyMindRoutines .v69-mind-grid.tf117-one{grid-template-columns:1fr!important}
.search-container{position:relative!important;display:flex!important;align-items:center!important;gap:10px!important;width:auto!important;min-height:52px!important;height:52px!important;margin:10px 20px 14px!important;padding:0 15px!important;border-radius:17px!important;border:1px solid rgba(78,205,196,.20)!important;background:linear-gradient(135deg,rgba(14,24,41,.96),rgba(9,14,27,.98))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 10px 28px rgba(0,0,0,.16)!important;transition:border-color .18s ease,box-shadow .18s ease,background .18s ease!important;overflow:hidden!important}
.search-container:focus-within{border-color:rgba(78,205,196,.52)!important;background:linear-gradient(135deg,rgba(15,30,47,.98),rgba(9,16,30,.99))!important;box-shadow:0 0 0 3px rgba(78,205,196,.075),0 12px 30px rgba(0,0,0,.22)!important}
.search-container>i.fa-search{position:static!important;transform:none!important;flex:0 0 auto!important;color:#4ed9ce!important;font-size:14px!important;opacity:.9!important;margin:0!important}
#searchInput{position:static!important;display:block!important;flex:1 1 auto!important;min-width:0!important;width:100%!important;height:50px!important;padding:0!important;margin:0!important;border:0!important;outline:0!important;background:transparent!important;box-shadow:none!important;color:#f2f7ff!important;caret-color:#54ded2!important;font-size:15px!important;font-weight:600!important;letter-spacing:0!important;pointer-events:auto!important;user-select:text!important;-webkit-user-select:text!important}
#searchInput::placeholder{color:#718099!important;opacity:1!important;font-weight:550!important}
#clearSearch{position:static!important;transform:none!important;flex:0 0 auto!important;margin-left:auto!important;width:30px!important;height:30px!important;border-radius:10px!important;align-items:center!important;justify-content:center!important;color:#8290a7!important;background:rgba(255,255,255,.035)!important}
.tf117-reset-warning{margin:13px 0;padding:12px;border-radius:13px;border:1px solid rgba(255,166,72,.20);background:rgba(255,140,52,.06);color:#b8c3d4;font-size:11px;line-height:1.5}.tf117-reset-warning strong{color:#fff}.tf117-confirm{width:100%;color:#ffc184;border-color:rgba(255,166,72,.28);background:rgba(255,140,52,.10)}
#tfSystemResetV117{margin-top:8px!important;border-color:rgba(255,166,72,.28)!important;background:rgba(255,140,52,.08)!important;color:#ffb66f!important}
@media(max-width:430px){.tf117-actions{grid-template-columns:1fr}.tf117-head{padding:16px 15px 13px}.tf117-scroll{padding:12px 13px 125px}#tfPairV117{gap:8px}.tf117-mental-card{grid-template-columns:40px minmax(0,1fr) auto;padding:10px 9px;gap:7px}.tf117-mental-card .v94-mentalist-icon{width:40px!important;height:40px!important}.tf117-mental-card .v94-mentalist-copy strong{font-size:11.5px!important}.tf117-mental-card .v94-mentalist-copy small{font-size:6.5px!important}#tfPairV117>#tf503020Hub,#tfPairV117>#tfMentalistPairV117{min-height:92px!important}}
`;
 document.head.appendChild(st);
}

function closeOldArtifacts(){
 for(const id of ['tfManagerV115','tfResetModalV115','tfSearchProxyV115'])$(id)?.remove();
 const oldWrap=$('tfPairV115');if(oldWrap){const hub=$('v27MainHub'),fifty=$('tf503020Hub');if(hub&&fifty)hub.appendChild(fifty);oldWrap.remove()}
 const input=$('searchInput');if(input){input.classList.remove('tf115-search-native');input.readOnly=false;input.tabIndex=0;input.removeAttribute('aria-hidden');input.dataset.tf115Proxy='1'}
}
function installSearch(){
 const input=$('searchInput');if(!input)return;
 input.readOnly=false;input.tabIndex=0;input.classList.remove('tf115-search-native');input.removeAttribute('aria-hidden');try{input.type='search'}catch(_){}
 input.setAttribute('autocomplete','off');input.setAttribute('autocorrect','off');input.setAttribute('autocapitalize','none');input.setAttribute('spellcheck','false');input.setAttribute('inputmode','search');input.setAttribute('enterkeyhint','search');input.setAttribute('role','searchbox');input.setAttribute('aria-label','Buscar tareas y hábitos');input.setAttribute('data-form-type','other');input.setAttribute('data-lpignore','true');input.setAttribute('data-1p-ignore','true');input.setAttribute('data-bwignore','true');input.placeholder='Buscar tareas y hábitos...';
 if(input.dataset.tf117Bound==='1')return;input.dataset.tf117Bound='1';
 input.addEventListener('input',e=>{if(norm(input.value)!==CODE)return;e.preventDefault();e.stopImmediatePropagation();input.value='';const clear=$('clearSearch');if(clear)clear.style.display='none';openManager()},true);
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&norm(input.value)===CODE){e.preventDefault();e.stopImmediatePropagation();input.value='';openManager()}},true);
}
function manager(){
 if($('tfManagerV117'))return;
 const o=document.createElement('div');o.id='tfManagerV117';o.className='tf117-modal';o.setAttribute('aria-hidden','true');
 o.innerHTML=`<section class="tf117-sheet" role="dialog" aria-modal="true" aria-labelledby="tf117ManagerTitle"><header class="tf117-head"><div><small>CONFIGURACIÓN DEL SISTEMA</small><h2 id="tf117ManagerTitle">Rutinas predeterminadas</h2><p>Activa únicamente las rutinas que quieras utilizar.</p></div><button class="tf117-x" type="button" data-tf117-close aria-label="Cerrar">×</button></header><div class="tf117-scroll" id="tf117Scroll"><div class="tf117-actions"><button id="tf117AllOn" type="button">Activar todas</button><button id="tf117AllOff" type="button">Desactivar todas</button></div><div class="tf117-list" id="tf117List"></div><div class="tf117-note">Los cambios solo controlan qué rutinas predeterminadas aparecen en el sistema. Tus hábitos y tareas personales no se modifican.</div><button class="tf117-done" type="button" data-tf117-close>Guardar y cerrar</button></div></section>`;
 document.body.appendChild(o);
 $('tf117AllOn').onclick=()=>{const s=cfg();for(const r of ROUTINES)s[r.id]=true;saveCfg(s)};
 $('tf117AllOff').onclick=()=>{const s=cfg();for(const r of ROUTINES)s[r.id]=false;saveCfg(s)};
 o.addEventListener('click',e=>{if(e.target===o||e.target.closest('[data-tf117-close]'))closeManager()});
 const sc=$('tf117Scroll');if(sc){sc.addEventListener('touchstart',e=>e.stopPropagation(),{passive:true});sc.addEventListener('touchmove',e=>e.stopPropagation(),{passive:true});sc.addEventListener('wheel',e=>e.stopPropagation(),{passive:true})}
 renderManager();
}
function renderManager(){const l=$('tf117List');if(!l)return;const s=cfg();l.innerHTML='';for(const r of ROUTINES){const row=document.createElement('label');row.className='tf117-row';row.innerHTML=`<span><strong>${r.name}</strong><small>Rutina predeterminada del sistema</small></span><input type="checkbox" ${s[r.id]?'checked':''}><i class="tf117-sw" aria-hidden="true"></i>`;row.querySelector('input').onchange=e=>{const n=cfg();n[r.id]=!!e.target.checked;saveCfg(n)};l.appendChild(row)}}
function openManager(){manager();renderManager();const o=$('tfManagerV117');if(!o)return;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';o.classList.add('open');o.setAttribute('aria-hidden','false');const sc=$('tf117Scroll');if(sc)sc.scrollTop=0}
function closeManager(){const o=$('tfManagerV117');if(o){o.classList.remove('open');o.setAttribute('aria-hidden','true')}document.body.style.overflow=previousOverflow||''}
function setOff(el,off){if(!el)return;el.classList.toggle('tf117-off',!!off);el.setAttribute('aria-hidden',off?'true':'false')}
function renameVisibleMentalist(root=document){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];let n;while((n=walker.nextNode())){if(/Mentalista\s+Forense/i.test(n.nodeValue||''))nodes.push(n)}for(const x of nodes)x.nodeValue=String(x.nodeValue||'').replace(/Mentalista\s+Forense/gi,'Mentalista')}
function applyCoreRoutines(s){const box=$('v32MandatoryMissions');if(!box)return;const sung=box.querySelector('.v83-core-card.sung'),legal=box.querySelector('.v83-core-card.legal'),grid=box.querySelector('.v83-core-grid'),head=box.querySelector('.v83-core-head');setOff(sung,!s.sung);setOff(legal,!s.juridico);setOff(box,!s.sung&&!s.juridico);if(grid)grid.classList.toggle('tf117-one',!!(s.sung!==s.juridico));const title=head&&head.querySelector('h3');if(title)title.textContent=s.sung&&s.juridico?'Disciplina y dominio':s.sung?'Disciplina':'Dominio jurídico'}
function applyMindRoutines(s){const box=$('v69DailyMindRoutines');if(!box)return;const soc=box.querySelector('.v69-routine-launch.socrates'),maq=box.querySelector('.v69-routine-launch.machiavelli'),grid=box.querySelector('.v69-mind-grid'),head=box.querySelector('.v69-mind-head');setOff(soc,!s.socrates);setOff(maq,!s.maquiavelo);setOff(box,!s.socrates&&!s.maquiavelo);if(grid)grid.classList.toggle('tf117-one',!!(s.socrates!==s.maquiavelo));const title=head&&head.querySelector('h3');if(title)title.textContent=s.socrates&&s.maquiavelo?'Sócrates y Maquiavelo':s.socrates?'Sócrates':'Maquiavelo'}
function mentalistSource(){return document.querySelector('#v94MentalistRoutine .v94-mentalist-launch')}
function sanitizeMentalHtml(html){return String(html||'').replace(/Mentalista\s+Forense/gi,'Mentalista').replace(/\s+Forense/gi,'')}
function ensurePair(s){
 const hub=$('v27MainHub'),fifty=$('tf503020Hub');if(!hub||!fifty)return;
 let pair=$('tfPairV117');if(!pair){pair=document.createElement('div');pair.id='tfPairV117';fifty.parentElement.insertBefore(pair,fifty)}if(pair.parentElement!==hub)hub.appendChild(pair);if(fifty.parentElement!==pair)pair.appendChild(fifty);
 let mental=$('tfMentalistPairV117');if(!mental){mental=document.createElement('button');mental.type='button';mental.id='tfMentalistPairV117';mental.className='tf117-mental-card';mental.onclick=()=>{const src=mentalistSource();if(src)src.click()};pair.appendChild(mental)}
 const src=mentalistSource();if(src){const html=sanitizeMentalHtml(src.innerHTML);if(mental.innerHTML!==html)mental.innerHTML=html}setOff(mental,!s.mentalista);pair.classList.toggle('tf117-single',!s.mentalista);
}
function applyVisibility(){const s=cfg();applyCoreRoutines(s);applyMindRoutines(s);ensurePair(s);const original=$('v94MentalistRoutine');if(original){original.classList.add('tf117-off');original.setAttribute('aria-hidden','true')}renameVisibleMentalist(document)}
function resetModal(){if($('tfResetModalV117'))return;const o=document.createElement('div');o.id='tfResetModalV117';o.className='tf117-modal';o.setAttribute('aria-hidden','true');o.innerHTML=`<section class="tf117-sheet" style="height:auto;max-height:calc(100dvh - 28px)" role="dialog" aria-modal="true"><header class="tf117-head"><div><small>REINICIO DE SISTEMA</small><h2>Volver a 0 días</h2><p>Reinicia progreso, rachas e historial de fallas.</p></div><button class="tf117-x" type="button" data-tf117-reset-close>×</button></header><div class="tf117-scroll"><div class="tf117-reset-warning"><strong>Tus hábitos y tareas NO se borrarán ni se reiniciarán.</strong><br>Solo se elimina el historial de progreso y fallas del sistema.</div><button class="tf117-confirm" id="tf117ConfirmReset" type="button">Confirmar reinicio a 0 días</button></div></section>`;document.body.appendChild(o);o.addEventListener('click',e=>{if(e.target===o||e.target.closest('[data-tf117-reset-close]'))closeReset()});$('tf117ConfirmReset').onclick=resetProgress}
function mountReset(){if($('tfSystemResetV117'))return;const box=$('tfProfileUserBox');if(!box)return;for(const id of ['tfSystemResetV113','tfSystemResetV115'])$(id)?.remove();const b=document.createElement('button');b.id='tfSystemResetV117';b.type='button';b.className='tf-profile-action';b.textContent='Reinicio de sistema';b.onclick=openReset;const sign=$('tfProfileSignOut');sign&&sign.parentElement===box?box.insertBefore(b,sign):box.appendChild(b)}
function openReset(){resetModal();const o=$('tfResetModalV117');if(!o)return;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';o.classList.add('open');o.setAttribute('aria-hidden','false')}
function closeReset(){const o=$('tfResetModalV117');if(o){o.classList.remove('open');o.setAttribute('aria-hidden','true')}document.body.style.overflow=previousOverflow||''}
function gtClock(){const p={};new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).forEach(x=>{if(x.type!=='literal')p[x.type]=x.value});const y=+p.year,m=+p.month,d=+p.day,h=+p.hour||0,todayDMY=`${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;const logical=new Date(Date.UTC(y,m-1,d,12));if(h<1)logical.setUTCDate(logical.getUTCDate()-1);const ly=logical.getUTCFullYear(),lm=String(logical.getUTCMonth()+1).padStart(2,'0'),ld=String(logical.getUTCDate()).padStart(2,'0'),iso=`${ly}-${lm}-${ld}`;return{todayDMY,iso,cycleKey:`${iso}-GT-01`}}
function resetData(){const arr=[MAIN,REC,BACK].map(key=>{try{const raw=get(key),data=raw?JSON.parse(raw):null;return data&&typeof data==='object'&&!Array.isArray(data)?{data,savedAt:Number(data.savedAt)||0}:null}catch(_){return null}}).filter(Boolean);if(!arr.length)throw new Error('NO_STATE');arr.sort((a,b)=>b.savedAt-a.savedAt);const data=arr[0].data;if(!data.meta||typeof data.meta!=='object'||Array.isArray(data.meta))data.meta={};const m=data.meta,g=gtClock();m.habitStreakCurrent=0;m.habitStreakBest=0;m.taskStreakCurrent=0;m.taskStreakBest=0;m.unifiedStreakCurrent=0;m.unifiedStreakBest=0;m.lastUnifiedSuccessDate=null;m.dailyPenaltyTokens={};m.v32PerfectDayLog={};m.incomeMissionPenaltyTokens={};m.punishmentActive=false;m.punishmentReason='';m.punishmentCompleted=false;m.punishmentTarget=null;m.lastPunishmentCycleKey=g.cycleKey;m.lastHabitCycleKey=g.cycleKey;m.lastTaskProcessingDate=g.todayDMY;m.v32ShopPerfectProcessed=g.iso;data.savedAt=Date.now();const raw=JSON.stringify(data);set(REC,raw);set(MAIN,raw);set(BACK,raw);set(TOUCH,String(data.savedAt))}
async function resetProgress(){const b=$('tf117ConfirmReset');if(b)b.disabled=true;try{resetData();try{if(window.TaskFlowCloudSync&&typeof window.TaskFlowCloudSync.syncNow==='function')await window.TaskFlowCloudSync.syncNow()}catch(_){}closeReset();setTimeout(()=>location.reload(),180)}catch(_){if(b)b.disabled=false}}
async function token(force){return window.TaskFlowFirebase&&window.TaskFlowFirebase.getIdToken?window.TaskFlowFirebase.getIdToken(!!force):null}
async function req(uid,opt){let t=await token(false);if(!t)throw new Error('AUTH');const url=API+'/users/'+encodeURIComponent(uid)+'/settings/routinesV115',o=Object.assign({},opt||{});o.headers=Object.assign({'Authorization':'Bearer '+t,'Content-Type':'application/json'},o.headers||{});let r=await fetch(url,o);if(r.status===401){t=await token(true);if(t){o.headers.Authorization='Bearer '+t;r=await fetch(url,o)}}if(r.status===404)return null;const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error('HTTP '+r.status);return d}
function queueCloud(){if(cloudTimer)clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>{cloudTimer=0;pushCloud().catch(()=>{})},600)}
async function pushCloud(){if(cloudBusy||!cloudUid)return;cloudBusy=true;try{let at=Number(get(CFG_META))||Date.now();set(CFG_META,String(at));await req(cloudUid,{method:'PATCH',body:JSON.stringify({fields:{config:{stringValue:get(CFG)||JSON.stringify(cfg())},updatedAt:{integerValue:String(at)}}})})}finally{cloudBusy=false}}
function remoteFields(d){const f=d&&d.fields||{};return{config:f.config&&f.config.stringValue||'',updatedAt:Number(f.updatedAt&&f.updatedAt.integerValue)||0}}
async function reconcile(uid){const remote=remoteFields(await req(uid,{method:'GET'})),localAt=Number(get(CFG_META))||0;if(remote.updatedAt>localAt&&remote.config){try{const rc=JSON.parse(remote.config);const next=cfg();for(const r of ROUTINES)if(typeof rc[r.id]==='boolean')next[r.id]=rc[r.id];set(CFG,JSON.stringify(next));set(CFG_META,String(remote.updatedAt));applyVisibility();renderManager();return}catch(_){}}if(localAt>remote.updatedAt||!remote.config)await pushCloud()}
function cloudWatch(){const u=window.TaskFlowFirebase&&window.TaskFlowFirebase.getUser?window.TaskFlowFirebase.getUser():null,uid=u&&u.uid||'';if(uid===cloudUid)return;cloudUid=uid;if(uid)reconcile(uid).catch(()=>{})}
function clearStaleNotice(){const box=$('tfRecoveryBanner');if(box)box.classList.remove('show')}
function applyAll(){installStyle();closeOldArtifacts();installSearch();manager();resetModal();mountReset();applyVisibility();cloudWatch();clearStaleNotice()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;applyAll()})}
function start(){cfg();applyAll();setTimeout(applyAll,250);setTimeout(applyAll,850);setTimeout(applyAll,1700);observer=new MutationObserver(ms=>{if(ms.some(m=>m.addedNodes&&m.addedNodes.length))schedule()});observer.observe(document.body,{subtree:true,childList:true});setInterval(cloudWatch,2000);document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeManager();closeReset()}},true)}
window.TaskFlowV117={refresh:applyAll,openRoutineManager:openManager,openSystemReset:openReset};
window.TaskFlowV115=window.TaskFlowV117;window.TaskFlowV116=window.TaskFlowV117;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();