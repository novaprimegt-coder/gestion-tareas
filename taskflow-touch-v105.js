(function(){
  'use strict';
  // Desactiva el puente V101 con inercia antes de que se inicialice.
  window.__tfV101ScrollBridge=true;
  if(window.__tfV105TouchScroll)return;
  window.__tfV105TouchScroll=true;

  var active=false,locked=false,startX=0,startY=0,lastY=0,owner=null;

  function canScroll(el){
    return !!el && el.scrollHeight>el.clientHeight+2;
  }
  function scrollOwner(target){
    if(!target)return document.scrollingElement||document.documentElement;
    var iconSheet=target.closest&&target.closest('.tf-icon-sheet');
    if(iconSheet){
      var iconBody=iconSheet.querySelector('.tf-icon-catalog-body');
      if(canScroll(iconBody))return iconBody;
    }
    var direct=target.closest&&target.closest('.rank-scroll-area,.v96-mentalist-scroll,.v97-routine-scroll,.policy-page.open,.side-menu.open,.window-container.open');
    if(direct&&canScroll(direct))return direct;
    return document.scrollingElement||document.documentElement;
  }
  function maxScroll(el){
    return Math.max(0,(el.scrollHeight||0)-(el.clientHeight||0));
  }
  function getScroll(el){
    if(el===document.scrollingElement||el===document.documentElement||el===document.body){
      return window.scrollY||document.documentElement.scrollTop||document.body.scrollTop||0;
    }
    return el.scrollTop||0;
  }
  function setScroll(el,value){
    var v=Math.max(0,Math.min(maxScroll(el),value));
    if(el===document.scrollingElement||el===document.documentElement||el===document.body)window.scrollTo(0,v);
    else el.scrollTop=v;
  }

  document.addEventListener('touchstart',function(e){
    if(!e.touches||e.touches.length!==1)return;
    active=true;
    locked=false;
    owner=scrollOwner(e.target);
    startX=e.touches[0].clientX;
    startY=lastY=e.touches[0].clientY;
  },{capture:true,passive:true});

  document.addEventListener('touchmove',function(e){
    if(!active||!owner||!e.touches||e.touches.length!==1)return;
    var x=e.touches[0].clientX;
    var y=e.touches[0].clientY;
    var dx=x-startX;
    var dy=y-startY;

    if(!locked){
      if(Math.abs(dy)<5&&Math.abs(dx)<5)return;
      if(Math.abs(dx)>Math.abs(dy)*1.15){
        active=false;
        owner=null;
        return;
      }
      locked=true;
    }

    // Movimiento 1:1: el contenido avanza exactamente lo que se mueve el dedo.
    var delta=lastY-y;
    lastY=y;
    setScroll(owner,getScroll(owner)+delta);
    if(e.cancelable)e.preventDefault();
  },{capture:true,passive:false});

  function finish(){
    active=false;
    locked=false;
    owner=null;
  }
  document.addEventListener('touchend',finish,{capture:true,passive:true});
  document.addEventListener('touchcancel',finish,{capture:true,passive:true});
})();
