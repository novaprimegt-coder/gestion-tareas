function loadState(){
 const current=safeParse(Storage.get(STORAGE_KEY));
 if(current&&isPlainObject(current.data))return normalizeState(current.data);
 if(Storage.get(MIGRATION_KEY)!=='1'){
   const v3=safeParse(Storage.get(LEGACY_V3_KEY));
   if(v3&&isPlainObject(v3.data)){runtime.didMigrate=true;const migrated=migrateLegacy(v3.data,3);queueMicrotask(()=>toast('Tus datos anteriores se migraron a ZORYVO V4'));return migrated}
   const v2=safeParse(Storage.get(LEGACY_V2_KEY));
   if(v2&&isPlainObject(v2.data)){runtime.didMigrate=true;const migrated=migrateLegacy(v2.data,2);queueMicrotask(()=>toast('Tus datos de V2 se migraron a ZORYVO V4'));return migrated}
   const v1=safeParse(Storage.get(LEGACY_V1_KEY));
   if(v1&&isPlainObject(v1.data)){runtime.didMigrate=true;const migrated=migrateLegacy(v1.data,1);queueMicrotask(()=>toast('Tus datos de V1 se migraron a ZORYVO V4'));return migrated}
 }
 return cloneDefault();
}
let state=loadState();
function saveState(){
 state=normalizeState(state);
 const old=safeParse(Storage.get(STORAGE_KEY));
 const revision=Math.max(0,Number(old?.revision)||0)+1;
 const payload=JSON.stringify({version:APP_VERSION,revision,savedAt:new Date().toISOString(),data:state});
 const persisted=Storage.set(STORAGE_KEY,payload);
 updateStorageIndicator();
 return persisted;
}

/* ---------- helpers ---------- */
function esc(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
function icon(name,extra=''){const safe=String(name).replace(/[^a-z0-9-]/gi,'');const cls=extra?`ui-icon ${extra}`:'ui-icon';return `<svg class="${cls}" aria-hidden="true"><use href="#i-${safe}"></use></svg>`}
function clamp(n,min,max){return Math.min(max,Math.max(min,n))}
function localDateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function dayDiff(a,b){const [ay,am,ad]=a.split('-').map(Number),[by,bm,bd]=b.split('-').map(Number);return Math.round((Date.UTC(by,bm-1,bd)-Date.UTC(ay,am-1,ad))/86400000)}
function reducedMotion(){return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true}
function formatTime(seconds){if(!Number.isFinite(seconds)||seconds<0)return '0:00';const s=Math.floor(seconds);const m=Math.floor(s/60);return `${m}:${String(s%60).padStart(2,'0')}`}
function toast(message){const el=$('#toast');if(!el)return;el.textContent=String(message);el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2300)}
function completedCount(){return state.completedEpisodes.length}
function totalUnlocked(){return Object.values(state.unlocked).reduce((total,list)=>total+list.length,0)}
function progressPct(id){return Math.round(state.progress[id]?.percent||0)}
function isCompleted(id,ep){return state.completedEpisodes.includes(`${id}:${ep}`)}
function isUnlocked(id,ep){return state.vip||ep<=FREE_EPISODES||(state.unlocked[id]||[]).includes(ep)}
function unlockEpisode(id,ep){if(!validEp(id,ep))return false;state.unlocked[id]=state.unlocked[id]||[];if(!state.unlocked[id].includes(ep))state.unlocked[id].push(ep);state.unlocked[id].sort((a,b)=>a-b);return true}
function resumeEpisode(series){
 const p=state.progress[series.id];
 if(!p||!validEp(series.id,p.ep))return 1;
 if(p.percent>=98&&p.ep<series.episodes)return p.ep+1;
 return p.ep;
}
function nextPlayableEpisode(series){return resumeEpisode(series)}
function initials(name){return name.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()}

/* ---------- focus / layers ---------- */
function syncBodyLock(){const locked=!!document.querySelector('.sheet.open,.modal.open,.player.open,.ad-screen.open');document.body.classList.toggle('ui-locked',locked)}
function focusFirst(container){const target=container?.querySelector('button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])');target?.focus({preventScroll:true})}
function openLayer(id){
 const el=document.getElementById(id);if(!el)return false;
 runtime.focusBeforeLayer=document.activeElement instanceof HTMLElement?document.activeElement:null;
 el.classList.add('open');el.setAttribute('aria-hidden','false');syncBodyLock();
 requestAnimationFrame(()=>focusFirst(el));
 return true;
}
function closeLayer(id,{restoreFocus=true}={}){
 const el=document.getElementById(id);if(!el)return false;
 el.classList.remove('open');el.setAttribute('aria-hidden','true');syncBodyLock();
 if(restoreFocus&&runtime.focusBeforeLayer?.isConnected)runtime.focusBeforeLayer.focus({preventScroll:true});
 return true;
}
function topOpenLayer(){const open=[...document.querySelectorAll('.sheet.open,.modal.open')];return open.at(-1)||null}
function closeAllLayers(){[...document.querySelectorAll('.sheet.open,.modal.open')].forEach(el=>closeLayer(el.id,{restoreFocus:false}))}
function trapFocus(event,container){
 if(event.key!=='Tab'||!container)return;
 const focusables=[...container.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.offsetParent!==null);
 if(!focusables.length)return;
 const first=focusables[0],last=focusables.at(-1);
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
}

/* ---------- storage status ---------- */
function updateStorageIndicator(){
 const dot=$('#storageDot');if(!dot)return;
 dot.classList.toggle('memory',runtime.storageMode!=='persistent');
 dot.title=runtime.storageMode==='persistent'?'Datos persistentes disponibles':'Modo memoria temporal';
}
function openStorageStatus(){
 const persistent=runtime.storageMode==='persistent';
 $('#storageModeText').textContent=persistent?'Persistente':'Memoria temporal';
 $('#storageDescription').textContent=persistent?'El navegador permite guardar progreso y preferencias en este dispositivo.':'El navegador bloqueó localStorage. ZORYVO seguirá funcionando durante esta sesión, pero los cambios pueden perderse al cerrar la página.';
 openLayer('storageModal');
}

/* ---------- cards / renders ---------- */
function card(series){
 const p=progressPct(series.id);
 const resume=resumeEpisode(series);
 const saved=state.library.includes(series.id);
 const status=saved?`${icon('bookmark')}<span>Guardada</span>`:p>0?`${icon('play')}<span>EP ${resume}</span>`:`${icon('play')}<span>Ver</span>`;
 return `<article class="series-card" data-series="${esc(series.id)}" tabindex="0" role="button" aria-label="Abrir ${esc(series.name)}"><div class="poster" style="--c1:${esc(series.c1)};--c2:${esc(series.c2)}"><div class="poster-top"><span class="tiny-badge">${esc(series.hot)}</span><span class="tiny-badge rating-badge">${icon('star')} ${series.rating.toFixed(1)}</span></div><div class="poster-monogram">${esc(initials(series.name))}</div>${p>0?`<div class="card-progress"><i style="width:${clamp(p,0,100)}%"></i></div>`:''}</div><div class="series-meta"><div class="series-name">${esc(series.name)}</div><div class="series-sub"><span>${esc(series.genre)} · ${series.episodes} EP</span><span class="card-status">${status}</span></div></div></article>`;
}
function renderCards(target,items){const el=$(target);if(el)el.innerHTML=items.map(card).join('')}
function genres(){return ['Todos',...new Set(SERIES.map(series=>series.genre))]}
function renderChips(target,active){const el=$(target);if(!el)return;el.innerHTML=genres().map(g=>`<button type="button" class="chip ${g===active?'active':''}" data-genre="${esc(g)}" aria-pressed="${g===active?'true':'false'}">${esc(g)}</button>`).join('')}
function getFeaturedSeries(){
 const progressing=Object.entries(state.progress)
  .map(([id,p])=>({series:getSeries(id),p}))
  .filter(item=>item.series&&item.p&&Number(item.p.updatedAt)>0&&!(item.p.percent>=98&&item.p.ep>=item.series.episodes))
  .sort((a,b)=>b.p.updatedAt-a.p.updatedAt);
 if(progressing.length)return progressing[0].series;
 const saved=SERIES.filter(series=>state.library.includes(series.id)).sort((a,b)=>b.rating-a.rating||b.newness-a.newness);
 if(saved.length)return saved[0];
 return [...SERIES].sort((a,b)=>b.rating-a.rating||b.newness-a.newness)[0]||SERIES[0];
}
function renderHero(){
 const series=getFeaturedSeries();
 runtime.activeSeries=runtime.activeSeries||series;
 $('#heroTitle').textContent=series.name;$('#heroDesc').textContent=series.desc;$('#heroGenre').textContent=series.genre;$('#heroEpisodes').textContent=`${series.episodes} episodios`;$('#heroRating').textContent=series.rating.toFixed(1);$('#heroCard').style.background=`linear-gradient(135deg,${series.c1},${series.c2})`;
 $('#heroKicker').textContent=(state.progress[series.id]?'CONTINÚA VIENDO · ':'ZORYVO ORIGINAL · ')+(series.interactive?'HISTORIA INTERACTIVA':'EPISODIOS CORTOS');
 const ep=resumeEpisode(series);$('#heroPlay').innerHTML=`${icon('play')}<span>${state.progress[series.id]?`Continuar EP ${ep}`:'Ver ahora'}</span>`;
}
function renderContinue(){
 const entries=Object.entries(state.progress).map(([id,p])=>({series:getSeries(id),p})).filter(x=>x.series&&x.p.percent>0&&!(x.p.percent>=98&&x.p.ep>=x.series.episodes)).sort((a,b)=>b.p.updatedAt-a.p.updatedAt).slice(0,5);
 $('#continueSection').classList.toggle('hidden',entries.length===0);
 $('#continueList').innerHTML=entries.map(({series,p})=>{const ep=resumeEpisode(series);const displayPercent=ep===p.ep?p.percent:0;return `<button type="button" class="continue-item" data-play-series="${esc(series.id)}" data-ep="${ep}"><div class="continue-thumb" style="--c1:${esc(series.c1)};--c2:${esc(series.c2)}"><span aria-hidden="true">${icon('play')}</span></div><div class="continue-info"><b>${esc(series.name)}</b><span>Episodio ${ep}${ep===p.ep?` · ${Math.round(p.percent)}% visto`:' · listo para continuar'}</span><div class="mini-progress"><i style="width:${clamp(displayPercent,0,100)}%"></i></div></div><span class="continue-arrow" aria-hidden="true">${icon('chevron-right')}</span></button>`}).join('');
}
function renderHome(){
 renderHero();renderChips('#homeChips',runtime.activeGenre);
 const filtered=runtime.activeGenre==='Todos'?SERIES:SERIES.filter(series=>series.genre===runtime.activeGenre);
 renderCards('#trendingCards',[...filtered].sort((a,b)=>b.rating-a.rating||b.newness-a.newness).slice(0,7));
 renderCards('#newCards',[...filtered].sort((a,b)=>b.newness-a.newness||b.rating-a.rating).slice(0,10));
 renderContinue();
}
