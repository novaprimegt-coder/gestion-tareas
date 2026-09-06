function getFilteredSearch(){
 const q=$('#searchInput').value.trim().toLocaleLowerCase('es');
 let items=SERIES.filter(series=>runtime.activeGenre==='Todos'||series.genre===runtime.activeGenre);
 if(q)items=items.filter(series=>`${series.name} ${series.genre} ${series.desc} ${series.tags.join(' ')}`.toLocaleLowerCase('es').includes(q));
 const sorters={popular:(a,b)=>b.rating-a.rating||b.newness-a.newness,new:(a,b)=>b.newness-a.newness||b.rating-a.rating,episodes:(a,b)=>b.episodes-a.episodes,az:(a,b)=>a.name.localeCompare(b.name,'es')};
 return [...items].sort(sorters[runtime.currentSort]||sorters.popular);
}
function renderDiscover(){
 renderChips('#discoverChips',runtime.activeGenre);const items=getFilteredSearch();renderCards('#searchResults',items);$('#resultCount').textContent=`${items.length} título${items.length===1?'':'s'}`;$('#searchEmpty').classList.toggle('hidden',items.length>0);$('#clearSearch').classList.toggle('hidden',!$('#searchInput').value);
}
function renderLibrary(){const items=SERIES.filter(series=>state.library.includes(series.id));renderCards('#libraryCards',items);$('#libraryCount').textContent=`${items.length} guardada${items.length===1?'':'s'}`;$('#libraryEmpty').classList.toggle('hidden',items.length>0)}
function renderProfile(){
 $('#topCoins').textContent=state.coins;$('#headerCoins').textContent=state.coins;$('#headerPlan').textContent=state.vip?'VIP':'Gratis';$('#profileCoins').textContent=state.coins;$('#profileUnlocked').textContent=totalUnlocked();$('#profileCompleted').textContent=completedCount();$('#vipBadge').textContent=state.vip?'PLAN VIP ACTIVO':'PLAN GRATIS';$('#vipStatusText').textContent=state.vip?'Activo':'Inactivo';$('#toggleVip').textContent=state.vip?'Desactivar VIP':'Activar VIP';
 $$('[data-setting]').forEach(button=>{const on=!!state.settings[button.dataset.setting];button.classList.toggle('on',on);button.setAttribute('aria-checked',String(on))});
 renderNotificationBadge();updateStorageIndicator();
}
function renderNotificationBadge(){const unread=NOTICES.filter(n=>!state.notificationsRead.includes(n.id)).length;$('#notificationCount').textContent=unread;$('#notificationCount').classList.toggle('hidden',unread===0)}
function renderNotifications(){const read=new Set(state.notificationsRead);$('#noticeList').innerHTML=NOTICES.map(n=>`<article class="notice ${read.has(n.id)?'':'unread'}"><b>${esc(n.title)}</b><p>${esc(n.text)}</p></article>`).join('');state.notificationsRead=NOTICES.map(n=>n.id);saveState();renderNotificationBadge()}
function resetAdDay(){const today=localDateKey();if(state.reward.adDate!==today){state.reward.adDate=today;state.reward.adsToday=0;return true}return false}
function renderRewards(){
 const changed=resetAdDay();if(changed)saveState();
 const today=localDateKey();const claimed=state.reward.lastClaim===today;$('#claimDaily').disabled=claimed;$('#claimDaily').innerHTML=claimed?`${icon('check-circle')}<span>Recompensa de hoy recibida</span>`:`${icon('gift')}<span>Reclamar recompensa diaria</span>`;
 const streak=Math.max(0,state.reward.streak);const diff=state.reward.lastClaim?dayDiff(state.reward.lastClaim,today):null;const continuous=!claimed&&diff===1;const completedInCycle=claimed?streak:(continuous&&streak<7?streak:0);const nextIndex=claimed?-1:(continuous?(streak>=7?0:streak):0);$('#streakDays').innerHTML=DAILY_REWARDS.map((reward,i)=>`<div class="day ${i<completedInCycle?'done':''} ${i===nextIndex?'today':''}"><span>D${i+1}</span><b>+${reward}</b></div>`).join('');
 const libraryReady=state.library.length>=1,watchReady=completedCount()>=3,claimedTasks=new Set(state.reward.claimedTasks);
 const tasks=[
  {id:'ad',icon:'play',title:'Ver anuncio',sub:'Obtén pases para usar en episodios disponibles',action:state.reward.adsToday<5?'Ver':'No disponible',ready:state.reward.adsToday<5,claimed:false},
  {id:'library',icon:'bookmark',title:'Guarda una serie',sub:'Añade 1 serie a tu biblioteca · +10 monedas',action:claimedTasks.has('library')?'Recibido':libraryReady?'Cobrar':'Pendiente',ready:libraryReady&&!claimedTasks.has('library'),claimed:claimedTasks.has('library')},
  {id:'watch3',icon:'check-circle',title:'Completa 3 episodios',sub:`Progreso ${Math.min(completedCount(),3)}/3 · +25 monedas`,action:claimedTasks.has('watch3')?'Recibido':watchReady?'Cobrar':'Pendiente',ready:watchReady&&!claimedTasks.has('watch3'),claimed:claimedTasks.has('watch3')}
 ];
 $('#taskList').innerHTML=tasks.map(task=>`<div class="task"><div class="task-icon">${icon(task.icon)}</div><div><b>${esc(task.title)}</b><span>${esc(task.sub)}</span></div><button type="button" class="btn ${task.ready?'primary':'secondary'}" data-task="${task.id}" ${!task.ready||task.claimed?'disabled':''}>${esc(task.action)}</button></div>`).join('');
}
function renderAll(){renderHome();renderDiscover();renderLibrary();renderProfile();renderRewards()}
function switchView(name){
 if(!VALID_VIEWS.has(name))return false;
 runtime.activeView=name;
 $$('.view').forEach(view=>view.classList.toggle('active',view.id===`view-${name}`));
 $$('.nav-btn').forEach(button=>{const active=button.dataset.view===name;button.classList.toggle('active',active);button.toggleAttribute('aria-current',active);if(active)button.setAttribute('aria-current','page')});
 if(name==='discover')setTimeout(()=>$('#searchInput').focus(),70);if(name==='library')renderLibrary();if(name==='rewards')renderRewards();if(name==='profile')renderProfile();
 window.scrollTo({top:0,behavior:reducedMotion()?'auto':'smooth'});return true;
}

/* ---------- detail / library ---------- */
function openDetail(id){
 const series=getSeries(id);if(!series)return false;runtime.activeSeries=series;const p=state.progress[id];const lib=state.library.includes(id);const ep=resumeEpisode(series);
 const seriesStatus=lib?'Guardada':p?'En curso':'Nueva';
 const planStatus=state.vip?'VIP':'Estándar';
 $('#detailBody').innerHTML=`<div class="detail-cover" style="--c1:${esc(series.c1)};--c2:${esc(series.c2)};background:linear-gradient(135deg,var(--c1),var(--c2))"><h2>${esc(series.name)}</h2></div><div class="detail-copy"><div class="tag-row"><span class="tag">${esc(series.genre)}</span><span class="tag rating-tag">${icon('star')} ${series.rating.toFixed(1)}</span><span class="tag">${series.episodes} episodios</span><span class="tag">Vertical</span>${series.interactive?'<span class="tag">Interactiva</span>':''}</div><p>${esc(series.desc)}</p><div class="detail-facts"><div class="fact"><b>${series.episodes}</b>Episodios</div><div class="fact"><b>${seriesStatus}</b>Estado</div><div class="fact"><b>${planStatus}</b>Plan</div></div><div class="detail-actions"><button type="button" class="btn primary" data-play-series="${esc(series.id)}" data-ep="${ep}">${icon('play')}<span>${p?`Continuar episodio ${ep}`:'Comenzar'}</span></button><button type="button" class="btn secondary icon-only-action" data-toggle-library="${esc(series.id)}" aria-label="${lib?'Quitar de biblioteca':'Guardar en biblioteca'}">${icon(lib?'check':'bookmark')}</button></div></div>`;
 return openLayer('detailSheet');
}
function toggleLibrary(id){
 if(!validSeriesId(id))return false;
 if(state.library.includes(id)){state.library=state.library.filter(x=>x!==id);toast('Eliminada de tu biblioteca')}else{state.library.push(id);toast('Guardada en tu biblioteca')}
 saveState();renderAll();updatePlayerActions();if($('#detailSheet').classList.contains('open'))openDetail(id);return true;
}
function toggleLike(id){if(!validSeriesId(id))return false;state.likes=state.likes.includes(id)?state.likes.filter(x=>x!==id):[...state.likes,id];saveState();updatePlayerActions();toast(state.likes.includes(id)?'Te gusta esta serie':'Me gusta eliminado');return true}
function updatePlayerActions(){const series=runtime.activeSeries;if(!series)return;const liked=state.likes.includes(series.id),saved=state.library.includes(series.id);$('#likeButton').classList.toggle('active',liked);$('#likeButton').innerHTML=icon('heart');$('#playerLibrary').classList.toggle('saved',saved);$('#playerLibrary').innerHTML=icon(saved?'check':'bookmark');$('#playerLibrary').setAttribute('aria-label',saved?'Guardada en biblioteca':'Guardar en biblioteca')}

/* ---------- player ---------- */
function updatePlayUi(){
 const video=$('#video');const paused=video.paused||video.ended;const blocked=$('#videoError').classList.contains('show')||$('#videoLoading').classList.contains('show');$('#centerPlay').innerHTML=icon(paused?'play':'pause');$('#centerPlay').classList.toggle('show',paused&&!blocked);$('#centerPlay').setAttribute('aria-label',paused?'Reproducir':'Pausar');
}
function updateMuteUi(){const muted=$('#video').muted;$('#muteButton').innerHTML=icon(muted?'volume-x':'volume');$('#muteButton').setAttribute('aria-label',muted?'Activar sonido':'Silenciar')}
function showVideoLoading(show){$('#videoLoading').classList.toggle('show',!!show)}
function showVideoError(show){$('#videoError').classList.toggle('show',!!show);if(show)showVideoLoading(false)}
function loadCurrentVideo({resume=true}={}){
 const series=runtime.activeSeries,ep=runtime.activeEpisode,video=$('#video');if(!series||!validEp(series.id,ep))return;
 const token=++runtime.videoLoadToken;showVideoError(false);showVideoLoading(true);$('#centerPlay').classList.remove('show');
 video.pause();video.removeAttribute('src');video.load();
 video.preload=state.settings.dataSaver?'metadata':'auto';video.src=VIDEO_SOURCES[(ep-1)%VIDEO_SOURCES.length];video.muted=state.settings.muted;updateMuteUi();
 const saved=state.progress[series.id];
 video.onloadedmetadata=()=>{
   if(token!==runtime.videoLoadToken)return;
   showVideoLoading(false);
   if(resume&&saved&&saved.ep===ep&&saved.time>0&&saved.percent<98&&saved.time<video.duration-1){try{video.currentTime=Math.min(saved.time,Math.max(0,video.duration-1))}catch{}}
   updateTimeline();
   const promise=video.play();if(promise?.catch)promise.catch(()=>updatePlayUi());
 };
 video.load();
}
function playSeries(id,ep=1){
 const series=getSeries(id);ep=Math.floor(Number(ep)||1);if(!series||!validEp(id,ep))return false;
 if(!isUnlocked(id,ep)){
   if($('#player').classList.contains('open')){saveCurrentProgress(true);$('#video').pause();updatePlayUi()}
   runtime.pendingUnlock={id,ep};$('#freePassCount').textContent=`${state.freePasses} pase${state.freePasses===1?'':'s'}`;$('#unlockDescription').textContent=`Episodio ${ep} de ${series.name}. Elige cómo desbloquearlo.`;openLayer('unlockModal');return false;
 }
 closeAllLayers();runtime.activeSeries=series;runtime.activeEpisode=ep;runtime.lastProgressSave=0;
 state.history=[{id,ep,at:Date.now()},...state.history.filter(item=>!(item.id===id&&item.ep===ep))].slice(0,60);saveState();
 $('#playerSeries').textContent=series.name;$('#playerEpisodeTop').textContent=`Episodio ${ep} de ${series.episodes}`;$('#episodeLabel').textContent=`EPISODIO ${ep} · ${series.genre.toUpperCase()}`;$('#episodeTitle').textContent=ep===1?series.ep:`Episodio ${ep}`;$('#episodeDesc').textContent=series.desc;
 $('#player').classList.add('open');$('#player').setAttribute('aria-hidden','false');syncBodyLock();renderEpisodes();renderInteractive();updatePlayerActions();updateNextButton();loadCurrentVideo({resume:true});
 requestAnimationFrame(()=>$('#closePlayer').focus({preventScroll:true}));return true;
}
