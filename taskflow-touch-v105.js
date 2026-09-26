(function(){
  'use strict';

  // Mantiene desactivado el puente táctil antiguo con desplazamiento manual.
  window.__tfV101ScrollBridge=true;
  if(window.__tfV124NativeTouchScroll)return;
  window.__tfV124NativeTouchScroll=true;

  function installNativeTouchStyle(){
    if(document.getElementById('tfV124NativeTouchStyle'))return;
    var style=document.createElement('style');
    style.id='tfV124NativeTouchStyle';
    style.textContent=`
html,body,.wrap{
  touch-action:pan-y!important;
  overscroll-behavior-y:auto!important;
  scroll-behavior:auto!important;
}
html{
  overflow-x:hidden!important;
  overflow-y:auto!important;
  -webkit-overflow-scrolling:touch!important;
}
body{
  overflow-x:hidden!important;
  overflow-y:visible!important;
}
.wrap{
  height:auto!important;
  min-height:100%!important;
  overflow:visible!important;
}
.rank-scroll-area,
.v96-mentalist-scroll,
.v97-routine-scroll,
.policy-page.open,
.side-menu.open,
.window-container.open,
.tf-icon-catalog-body{
  touch-action:pan-y!important;
  -webkit-overflow-scrolling:touch!important;
}
`;
    document.head.appendChild(style);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',installNativeTouchStyle,{once:true});
  }else{
    installNativeTouchStyle();
  }
})();
