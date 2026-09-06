function resetDemo(){Storage.remove(STORAGE_KEY);Storage.set(MIGRATION_KEY,'1');state=cloneDefault();runtime.activeSeries=SERIES[0];runtime.activeEpisode=1;runtime.pendingUnlock=null;runtime.activeGenre='Todos';runtime.currentSort='popular';runtime.didMigrate=false;$('#searchInput').value='';$('#sortSelect').value='popular';closeLayer('resetModal');saveState();renderAll();toast('ZORYVO V4.0.3 restablecido')}

/* ---------- global events ---------- */
document.addEventListener('click',event=>{
 const nav=event.target.closest('[data-view]');if(nav){switchView(nav.dataset.view);return}
 const close=event.target.closest('[data-close]');if(close){closeLayer(close.dataset.close);return}
 const seriesCard=event.target.closest('[data-series]');if(seriesCard){openDetail(seriesCard.dataset.series);return}
 const play=event.target.closest('[data-play-series]');if(play){playSeries(play.dataset.playSeries,Number(play.dataset.ep)||1);return}
 const lib=event.target.closest('[data-toggle-library]');if(lib){toggleLibrary(lib.dataset.toggleLibrary);return}
 const chip=event.target.closest('[data-genre]');if(chip){runtime.activeGenre=genres().includes(chip.dataset.genre)?chip.dataset.genre:'Todos';renderHome();renderDiscover();return}
 const task=event.target.closest('[data-task]');if(task){claimTask(task.dataset.task);return}
 const pack=event.target.closest('[data-package]');if(pack){runtime.selectedPackage=Math.max(1,Number(pack.dataset.package)||120);renderCoinPackages();return}
 const setting=event.target.closest('[data-setting]');if(setting){const key=setting.dataset.setting;if(!(key in state.settings))return;state.settings[key]=!state.settings[key];saveState();renderProfile();toast(`${setting.parentElement?.querySelector('.setting-info b')?.textContent||'Ajuste'} ${state.settings[key]?'activado':'desactivado'}`);return}
 const choice=event.target.closest('[data-choice]');if(choice&&INTERACTIVE_CHOICES.has(choice.dataset.choice)){state.interactive[`${runtime.activeSeries.id}:${runtime.activeEpisode}`]=choice.dataset.choice;saveState();renderInteractive();toast(`Decisión guardada: ${choice.dataset.choice}`);return}
});
document.addEventListener('keydown',event=>{
 if((event.key==='Enter'||event.key===' ')&&event.target.matches?.('.series-card[data-series]')){event.preventDefault();openDetail(event.target.dataset.series);return}
 if(event.key==='Escape'){
   if($('#adScreen').classList.contains('open'))return;
   const layer=topOpenLayer();if(layer){closeLayer(layer.id);return}
   if($('#player').classList.contains('open')){closePlayer();return}
 }
 const layer=topOpenLayer();if(layer)trapFocus(event,layer);else if($('#player').classList.contains('open'))trapFocus(event,$('#playerStage'));
});

$('#topProfileButton').addEventListener('click',()=>switchView('profile'));
$('#searchInput').addEventListener('input',renderDiscover);
$('#clearSearch').addEventListener('click',()=>{$('#searchInput').value='';renderDiscover();$('#searchInput').focus()});
$('#sortSelect').addEventListener('change',event=>{runtime.currentSort=['popular','new','episodes','az'].includes(event.target.value)?event.target.value:'popular';renderDiscover()});
$('#notificationsButton').addEventListener('click',()=>{renderNotifications();openLayer('notificationSheet')});
$('#storageButton').addEventListener('click',openStorageStatus);
$('#coinButton').addEventListener('click',()=>{renderCoinPackages();openLayer('coinModal')});
$('#simulateCoinPurchase').addEventListener('click',simulatePurchase);
$('#heroPlay').addEventListener('click',()=>{const featured=getFeaturedSeries();playSeries(featured.id,nextPlayableEpisode(featured))});
$('#heroInfo').addEventListener('click',()=>openDetail(getFeaturedSeries().id));
$('#claimDaily').addEventListener('click',claimDaily);
$('#vipSetting').addEventListener('click',()=>openLayer('vipModal'));
$('#toggleVip').addEventListener('click',toggleVip);
$('#historySetting').addEventListener('click',()=>{renderHistory();openLayer('historySheet')});
$('#diagnosticsSetting').addEventListener('click',()=>{runDiagnostics();openLayer('diagnosticsSheet')});
$('#resetSetting').addEventListener('click',()=>openLayer('resetModal'));
$('#confirmReset').addEventListener('click',resetDemo);
$('#useFreePass').addEventListener('click',()=>confirmUnlock('pass'));
$('#unlockCoins').addEventListener('click',()=>confirmUnlock('coins'));
$('#unlockByAd').addEventListener('click',()=>startAd('unlock'));
$('#closePlayer').addEventListener('click',closePlayer);
$('#episodesButton').addEventListener('click',()=>{renderEpisodes();openLayer('episodeSheet')});
$('#nextButton').addEventListener('click',nextEpisode);
$('#likeButton').addEventListener('click',()=>toggleLike(runtime.activeSeries.id));
$('#playerLibrary').addEventListener('click',()=>toggleLibrary(runtime.activeSeries.id));
$('#shareButton').addEventListener('click',shareCurrent);
$('#centerPlay').addEventListener('click',togglePlayback);
$('#video').addEventListener('click',togglePlayback);
$('#muteButton').addEventListener('click',toggleMute);
$('#retryVideo').addEventListener('click',retryVideo);
$('#fullscreenButton').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await $('#playerStage').requestFullscreen?.();else await document.exitFullscreen?.()}catch{toast('Pantalla completa no disponible')}});
$('#timelineRange').addEventListener('input',seekFromRange);
$('#video').addEventListener('loadstart',()=>showVideoLoading(true));
$('#video').addEventListener('loadeddata',()=>showVideoLoading(false));
$('#video').addEventListener('playing',()=>{showVideoLoading(false);showVideoError(false);updatePlayUi()});
$('#video').addEventListener('waiting',()=>showVideoLoading(true));
$('#video').addEventListener('pause',()=>{updatePlayUi();saveCurrentProgress(true)});
$('#video').addEventListener('play',updatePlayUi);
$('#video').addEventListener('timeupdate',()=>{updateTimeline();saveCurrentProgress(false)});
$('#video').addEventListener('error',()=>{if($('#player').classList.contains('open')){showVideoError(true);updatePlayUi()}});
$('#video').addEventListener('ended',()=>{markCompleted();updatePlayUi();if(state.settings.autoplay&&runtime.activeEpisode<runtime.activeSeries.episodes)setTimeout(()=>nextEpisode(),420);else toast(runtime.activeEpisode<runtime.activeSeries.episodes?'Episodio completado':'Serie completada')});
window.addEventListener('beforeunload',()=>saveCurrentProgress(true));
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveCurrentProgress(true)});

/* ---------- boot ---------- */
resetAdDay();saveState();if(runtime.didMigrate){Storage.set(MIGRATION_KEY,'1');runtime.didMigrate=false}renderAll();updateStorageIndicator();
window.ZORYVODebug={version:APP_VERSION,runDiagnostics,getState:()=>JSON.parse(JSON.stringify(state)),normalizeState,playSeries,switchView};window.JMShortDebug=window.ZORYVODebug;
