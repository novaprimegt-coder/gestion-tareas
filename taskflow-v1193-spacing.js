(function(){
'use strict';
if(window.__tfV1193Spacing)return;window.__tfV1193Spacing=true;

function installStyle(){
  if(document.getElementById('tfV1193SpacingStyle'))return;
  const s=document.createElement('style');
  s.id='tfV1193SpacingStyle';
  s.textContent=`
    .wrap{
      min-height:0!important;
      height:auto!important;
      padding-bottom:0!important;
      margin-bottom:0!important;
    }
    .wrap>.v48-discipline-center,
    .dashboard.v48-discipline-center{
      margin-bottom:0!important;
    }
    .v48-discipline-center>.v48-analysis-panel,
    .v48-analysis-panel{
      margin-bottom:0!important;
      padding-bottom:0!important;
    }
    #v47SearchResultsCard[hidden]{
      display:none!important;
      margin:0!important;
      padding:0!important;
      min-height:0!important;
      height:0!important;
    }
  `;
  document.head.appendChild(s);
}

function apply(){
  installStyle();
  const wrap=document.querySelector('.wrap');
  if(wrap){
    wrap.style.setProperty('min-height','0','important');
    wrap.style.setProperty('height','auto','important');
    wrap.style.setProperty('padding-bottom','0','important');
    wrap.style.setProperty('margin-bottom','0','important');
  }
  const discipline=document.querySelector('.v48-discipline-center');
  if(discipline)discipline.style.setProperty('margin-bottom','0','important');
  const panel=document.querySelector('.v48-analysis-panel');
  if(panel){
    panel.style.setProperty('margin-bottom','0','important');
    panel.style.setProperty('padding-bottom','0','important');
  }
}

function start(){
  apply();
  setTimeout(apply,250);
  setTimeout(apply,900);
  setTimeout(apply,1800);
  const observer=new MutationObserver(()=>apply());
  observer.observe(document.body,{subtree:true,childList:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();