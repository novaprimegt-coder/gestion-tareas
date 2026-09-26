(function(){
'use strict';
if(window.__tfV125RoutineLayout)return;
window.__tfV125RoutineLayout=true;

function installStyle(){
  if(document.getElementById('tfV125RoutineLayoutStyle'))return;
  var style=document.createElement('style');
  style.id='tfV125RoutineLayoutStyle';
  style.textContent=`
/* V125: solo corrige espacios finales de rutinas y el scroll de 50/30/20 */
.tf125-routine-modal{
  overflow-y:auto!important;
  overflow-x:hidden!important;
  -webkit-overflow-scrolling:touch!important;
  touch-action:pan-y!important;
}
.tf125-routine-shell{
  height:auto!important;
  min-height:0!important;
  max-height:calc(100dvh - 18px)!important;
  margin-bottom:0!important;
}
.tf125-routine-content{
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  margin-bottom:0!important;
  padding-bottom:0!important;
}
.tf125-routine-scroll{
  flex:0 1 auto!important;
  height:auto!important;
  min-height:0!important;
  max-height:calc(100dvh - 190px)!important;
  margin-bottom:0!important;
  padding-bottom:14px!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  -webkit-overflow-scrolling:touch!important;
  overscroll-behavior-y:contain!important;
  touch-action:pan-y!important;
  align-content:start!important;
}
.tf125-routine-scroll>:last-child{
  margin-bottom:0!important;
}

body.tf503020-open{
  overflow:hidden!important;
  overscroll-behavior:none!important;
}
#tf503020Overlay.tf503020-overlay.open{
  display:block!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  -webkit-overflow-scrolling:touch!important;
  overscroll-behavior-y:contain!important;
  touch-action:pan-y!important;
  scroll-behavior:auto!important;
  padding-bottom:max(150px,calc(118px + env(safe-area-inset-bottom)))!important;
  scroll-padding-bottom:max(150px,calc(118px + env(safe-area-inset-bottom)))!important;
}
#tf503020Overlay .tf503020-shell{
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  overflow:visible!important;
  margin-bottom:0!important;
}
#tf503020Overlay .tf503020-content{
  height:auto!important;
  min-height:0!important;
  overflow:visible!important;
  padding-bottom:14px!important;
}

@media(max-width:680px){
  .tf125-routine-shell{max-height:calc(100dvh - 10px)!important}
  .tf125-routine-scroll{max-height:calc(100dvh - 170px)!important;padding-bottom:10px!important}
  #tf503020Overlay.tf503020-overlay.open{
    padding-bottom:max(158px,calc(124px + env(safe-area-inset-bottom)))!important;
    scroll-padding-bottom:max(158px,calc(124px + env(safe-area-inset-bottom)))!important;
  }
}
`;
  document.head.appendChild(style);
}

function tagRoutineLayouts(){
  document.querySelectorAll('.v96-mentalist-scroll,.v97-routine-scroll').forEach(function(scroll){
    scroll.classList.add('tf125-routine-scroll');
    var modal=scroll.closest('.window-container,.mentalist-modal,.routine-modal');
    if(modal){
      modal.classList.add('tf125-routine-modal');
      var node=scroll;
      while(node.parentElement&&node.parentElement!==modal)node=node.parentElement;
      if(node&&node!==modal)node.classList.add('tf125-routine-shell');
    }
    var content=scroll.closest('.window-content');
    if(content)content.classList.add('tf125-routine-content');
  });
}

function apply(){
  installStyle();
  tagRoutineLayouts();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
else apply();

document.addEventListener('click',function(){
  setTimeout(tagRoutineLayouts,0);
  setTimeout(tagRoutineLayouts,90);
  setTimeout(tagRoutineLayouts,220);
},{capture:true,passive:true});

window.addEventListener('resize',tagRoutineLayouts,{passive:true});
})();
