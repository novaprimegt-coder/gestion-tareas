function closePlayer(){
 if(!$('#player').classList.contains('open'))return false;saveCurrentProgress(true);const video=$('#video');runtime.videoLoadToken++;video.pause();video.onloadedmetadata=null;video.removeAttribute('src');video.load();showVideoLoading(false);showVideoError(false);$('#player').classList.remove('open');$('#player').setAttribute('aria-hidden','true');syncBodyLock();renderAll();return true;
}
function togglePlayback(){const video=$('#video');if(!$('#player').classList.contains('open')||$('#videoError').classList.contains('show'))return;if(video.paused){video.play().catch(()=>toast('Toca reproducir nuevamente'))}else video.pause()}
function toggleMute(){const video=$('#video');video.muted=!video.muted;updateMuteUi()}
function updateTimeline(){const video=$('#video');const ratio=video.duration?clamp(video.currentTime/video.duration,0,1):0;const range=$('#timelineRange');range.value=String(Math.round(ratio*1000));range.style.setProperty('--seek',`${ratio*100}%`);$('#timeLabel').textContent=`${formatTime(video.currentTime)} / ${formatTime(video.duration)}`}
function seekFromRange(){const video=$('#video');if(!Number.isFinite(video.duration)||video.duration<=0)return;const ratio=Number($('#timelineRange').value)/1000;try{video.currentTime=clamp(video.duration*ratio,0,video.duration)}catch{}updateTimeline()}
function updateNextButton(){const series=runtime.activeSeries;const end=runtime.activeEpisode>=series.episodes;$('#nextButton').disabled=end;$('#nextButton').innerHTML=end?`<span>Final de serie</span>${icon('check-circle')}`:`<span>Siguiente</span>${icon('chevron-right')}`}
function renderEpisodes(){
 const series=runtime.activeSeries;if(!series)return;const html=[];
 for(let ep=1;ep<=series.episodes;ep++){const unlocked=isUnlocked(series.id,ep),done=isCompleted(series.id,ep);const status=done?icon('check'):!unlocked?icon('lock'):'';html.push(`<button type="button" class="ep ${ep===runtime.activeEpisode?'current':''} ${unlocked?'unlocked':'locked'} ${done?'done':''}" data-play-series="${esc(series.id)}" data-ep="${ep}" aria-label="Episodio ${ep}${unlocked?'':' bloqueado'}${done?' completado':''}"><span class="ep-number">${ep}</span>${status?`<span class="ep-state" aria-hidden="true">${status}</span>`:''}</button>`)}
 $('#episodeGrid').innerHTML=html.join('');$('#episodeSheetTitle').textContent=series.name;$('#episodeAccessSummary').textContent=state.vip?'Plan VIP · episodios desbloqueados':'Plan Estándar';$('#episodeProgressSummary').textContent=`${state.completedEpisodes.filter(key=>key.startsWith(`${series.id}:`)).length}/${series.episodes} completados`;
}
function renderInteractive(){const box=$('#interactiveBox'),row=$('#choiceRow'),series=runtime.activeSeries;if(!series.interactive||runtime.activeEpisode!==2){box.classList.remove('show');row.innerHTML='';return}const key=`${series.id}:2`,selected=state.interactive[key]||'';const choices=['Confrontarlo','Seguir investigando'];row.innerHTML=choices.map(choice=>`<button type="button" class="choice ${selected===choice?'selected':''}" data-choice="${esc(choice)}">${esc(choice)}</button>`).join('');box.classList.add('show')}
function saveCurrentProgress(force=false){
 const video=$('#video'),series=runtime.activeSeries;if(!series||!$('#player').classList.contains('open')||!Number.isFinite(video.duration)||video.duration<=0)return false;const now=Date.now();if(!force&&now-runtime.lastProgressSave<1800)return false;runtime.lastProgressSave=now;const percent=clamp((video.currentTime/video.duration)*100,0,100);state.progress[series.id]={ep:runtime.activeEpisode,time:video.currentTime,duration:video.duration,percent,updatedAt:now};saveState();return true;
}
function markCompleted(){
 const series=runtime.activeSeries,key=`${series.id}:${runtime.activeEpisode}`;if(!state.completedEpisodes.includes(key))state.completedEpisodes.push(key);state.progress[series.id]={ep:runtime.activeEpisode,time:0,duration:$('#video').duration||0,percent:100,updatedAt:Date.now()};saveState();renderRewards();renderEpisodes();
}
function nextEpisode(){if(runtime.activeEpisode>=runtime.activeSeries.episodes){toast('Has terminado esta serie');return false}return playSeries(runtime.activeSeries.id,runtime.activeEpisode+1)}
function retryVideo(){loadCurrentVideo({resume:true})}

/* ---------- unlock / monetization demo ---------- */
function confirmUnlock(method){
 if(!runtime.pendingUnlock)return false;const {id,ep}=runtime.pendingUnlock;
 if(!validEp(id,ep)){runtime.pendingUnlock=null;closeLayer('unlockModal');return false}
 if(method==='pass'){if(state.freePasses<1){toast('No tienes pases disponibles');return false}state.freePasses--}
 else if(method==='coins'){if(state.coins<EPISODE_PRICE){toast('No tienes suficientes monedas');return false}state.coins-=EPISODE_PRICE}
 else return false;
 unlockEpisode(id,ep);runtime.pendingUnlock=null;saveState();closeLayer('unlockModal',{restoreFocus:false});renderAll();playSeries(id,ep);toast(method==='pass'?'Episodio desbloqueado con pase':'Episodio desbloqueado con monedas');return true;
}
function claimDaily(){
 const today=localDateKey();if(state.reward.lastClaim===today){toast('La recompensa de hoy ya fue recibida');return false}
 let streak=1;if(state.reward.lastClaim){const diff=dayDiff(state.reward.lastClaim,today);if(diff===1)streak=state.reward.streak>=7?1:state.reward.streak+1;else if(diff<=0){toast('La recompensa de hoy ya fue recibida');return false}}
 state.reward.streak=streak;state.reward.lastClaim=today;const reward=DAILY_REWARDS[streak-1]||DAILY_REWARDS[0];state.coins+=reward;saveState();renderAll();toast(`+${reward} monedas · día ${streak} de la racha`);return true;
}
function claimTask(id){
 if(id==='ad'){startAd('reward');return}
 const claimed=new Set(state.reward.claimedTasks);if(claimed.has(id))return;
 if(id==='library'&&state.library.length>=1){state.coins+=10;state.reward.claimedTasks.push(id);toast('+10 monedas')}
 else if(id==='watch3'&&completedCount()>=3){state.coins+=25;state.reward.claimedTasks.push(id);toast('+25 monedas')}
 else{toast('Aún no completas esta misión');return}
 saveState();renderAll();
}
function startAd(context='reward'){
 resetAdDay();if(state.reward.adsToday>=5){toast('Vuelve más tarde para obtener nuevas recompensas');renderRewards();return false}
 if(context==='unlock'&&!runtime.pendingUnlock){toast('No hay un episodio pendiente');return false}
 if($('#player').classList.contains('open')){$('#video').pause();saveCurrentProgress(true)}closeAllLayers();runtime.adContext=context;$('#adScreen').classList.add('open');$('#adScreen').setAttribute('aria-hidden','false');syncBodyLock();
 $('#adPurpose').textContent=context==='unlock'?'Al finalizar, el episodio seleccionado se desbloqueará directamente.':'Al finalizar, recibirás 2 pases gratuitos.';
 const endAt=Date.now()+5000;clearInterval(runtime.adTimer);
 const tick=()=>{const left=Math.max(0,Math.ceil((endAt-Date.now())/1000));$('#adCount').textContent=left>0?`Finaliza en ${left} s`:'Completado';if(left<=0){clearInterval(runtime.adTimer);completeAd()}};
 tick();runtime.adTimer=setInterval(tick,250);return true;
}
function completeAd(){
 state.reward.adsToday=Math.min(5,state.reward.adsToday+1);const context=runtime.adContext;runtime.adContext=null;$('#adScreen').classList.remove('open');$('#adScreen').setAttribute('aria-hidden','true');
 if(context==='unlock'&&runtime.pendingUnlock){const {id,ep}=runtime.pendingUnlock;if(validEp(id,ep)){unlockEpisode(id,ep);runtime.pendingUnlock=null;saveState();syncBodyLock();renderAll();playSeries(id,ep);toast('Episodio desbloqueado por anuncio');return}}
 state.freePasses+=2;saveState();syncBodyLock();renderAll();toast('+2 pases gratuitos obtenidos');
}
function renderCoinPackages(){const packs=[{coins:120,label:'Paquete inicial'},{coins:300,label:'Paquete medio'},{coins:650,label:'Paquete grande'},{coins:1400,label:'Paquete máximo'}];$('#coinPackages').innerHTML=packs.map(pack=>`<button type="button" class="package ${runtime.selectedPackage===pack.coins?'selected':''}" data-package="${pack.coins}" aria-pressed="${runtime.selectedPackage===pack.coins?'true':'false'}"><b>${icon('coins')}${pack.coins} monedas</b><span>${esc(pack.label)} · LOCAL</span></button>`).join('')}
function simulatePurchase(){state.coins+=runtime.selectedPackage;saveState();closeLayer('coinModal');renderAll();toast(`Recarga local: +${runtime.selectedPackage} monedas`)}
function toggleVip(){state.vip=!state.vip;saveState();renderAll();renderEpisodes();toast(state.vip?'VIP activado':'VIP desactivado')}

/* ---------- history / share / diagnostics ---------- */
function renderHistory(){
 const seen=new Set();const items=state.history.filter(item=>{const key=`${item.id}:${item.ep}`;if(seen.has(key))return false;seen.add(key);return true}).slice(0,25);$('#historyEmpty').classList.toggle('hidden',items.length>0);
 $('#historyList').innerHTML=items.map(item=>{const series=getSeries(item.id);if(!series)return '';const p=state.progress[item.id];return `<button type="button" class="continue-item" data-play-series="${esc(item.id)}" data-ep="${item.ep}"><div class="continue-thumb" style="--c1:${esc(series.c1)};--c2:${esc(series.c2)}"><span>${icon('play')}</span></div><div class="continue-info"><b>${esc(series.name)}</b><span>Episodio ${item.ep}${p&&p.ep===item.ep?` · ${Math.round(p.percent)}%`:''}</span></div><span class="continue-arrow">${icon('chevron-right')}</span></button>`}).join('');
}
async function copyText(text){
 try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true}}catch{}
 try{const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.cssText='position:fixed;opacity:0;pointer-events:none';document.body.appendChild(area);area.select();const ok=document.execCommand?.('copy')===true;area.remove();return ok}catch{return false}
}
async function shareCurrent(){
 const series=runtime.activeSeries,text=`Estoy viendo ${series.name}, episodio ${runtime.activeEpisode}, en ZORYVO.`;
 try{if(navigator.share){await navigator.share({title:series.name,text});return}}catch(err){if(err?.name==='AbortError')return}
 const copied=await copyText(text);toast(copied?'Texto copiado para compartir':'No se pudo compartir en este navegador');
}
function runDiagnostics(){
 const checks=[];const add=(name,status,detail)=>checks.push({name,status,detail});
 const ids=$$('[id]').map(el=>el.id),unique=new Set(ids);add('Estructura DOM',ids.length===unique.size?'pass':'fail',ids.length===unique.size?`${ids.length} IDs únicos`:'Hay IDs duplicados');
 add('Catálogo',SERIES.length>0&&SERIES.every(s=>validSeriesId(s.id)&&Number.isInteger(s.episodes)&&s.episodes>=FREE_EPISODES)?'pass':'fail',`${SERIES.length} series validadas`);
 const normalized=normalizeState(state);add('Integridad del estado',JSON.stringify(normalized)===JSON.stringify(state)?'pass':'warn','Estado normalizable y protegido contra IDs inválidos');
 add('Almacenamiento',runtime.storageMode==='persistent'?'pass':'warn',runtime.storageMode==='persistent'?'Persistencia local disponible':'Usando memoria temporal; el navegador bloqueó localStorage');
 const video=document.createElement('video');add('Video HTML5',typeof video.canPlayType==='function'?'pass':'fail',typeof video.canPlayType==='function'?'Elemento video compatible':'No disponible');
 add('Pantalla completa',document.fullscreenEnabled===true?'pass':'warn',document.fullscreenEnabled===true?'API disponible':'Puede no estar disponible en este contexto');
 add('Compartir',typeof navigator.share==='function'?'pass':'warn',typeof navigator.share==='function'?'Web Share disponible':'Se utilizará copia al portapapeles como alternativa');
 add('Accesibilidad básica',$$('button:not([type])').length===0?'pass':'warn',$$('button:not([type])').length===0?'Botones con tipo explícito':'Hay botones sin tipo explícito');
 add('Iconografía SVG',(()=>{const uses=$$('svg.ui-icon use');return uses.length>0&&uses.every(use=>{const href=use.getAttribute('href')||'';return href.startsWith('#i-')&&document.querySelector(href)})})()?'pass':'fail',`${$$('svg.ui-icon use').length} iconos semánticos vinculados al sistema interno`);
 const score=Math.round(checks.filter(c=>c.status==='pass').length/checks.length*100);const fails=checks.filter(c=>c.status==='fail').length;
 $('#diagnosticsBody').innerHTML=`<div class="diag-summary"><div class="diag-score">${score}%</div><div><b>${fails?'Se detectaron fallas':'Base operativa sin fallas críticas detectadas'}</b><span>${checks.length} comprobaciones en este navegador · V${APP_VERSION}</span></div></div><div class="diag-list">${checks.map(c=>`<div class="diag-item ${c.status}"><div class="diag-icon">${icon(c.status==='pass'?'check':c.status==='warn'?'alert':'x')}</div><div><b>${esc(c.name)}</b><span>${esc(c.detail)}</span></div><div class="diag-status">${c.status==='pass'?'OK':c.status==='warn'?'AVISO':'FALLO'}</div></div>`).join('')}</div>`;
 return {score,checks};
}
