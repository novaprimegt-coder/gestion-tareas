(function(){
'use strict';
if(window.__tfV122HabitVisual)return;window.__tfV122HabitVisual=true;

const STYLE_ID='tfV122HabitVisualStyle';
const CARD_CLASS='tf122-habit-stat-card';
const TARGETS=new Set(['HÁBITOS ACTIVOS','HABITOS ACTIVOS','HÁBITOS COMPLETADOS','HABITOS COMPLETADOS']);

function installStyle(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');
 s.id=STYLE_ID;
 s.textContent=`
.${CARD_CLASS}{
 background:linear-gradient(155deg,rgba(16,25,42,.98) 0%,rgba(9,16,29,.99) 58%,rgba(7,13,24,1) 100%)!important;
 border-color:rgba(255,138,43,.27)!important;
 box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 12px 28px rgba(0,0,0,.18)!important;
}
`;
 document.head.appendChild(s);
}

function normalizedText(el){
 return String(el&&el.textContent||'').replace(/\s+/g,' ').trim().toUpperCase();
}

function isCandidate(el){
 if(!el||el===document.body||el===document.documentElement)return false;
 const r=el.getBoundingClientRect();
 if(r.width<120||r.height<85||r.height>260)return false;
 const cs=getComputedStyle(el);
 const radius=parseFloat(cs.borderTopLeftRadius)||0;
 return radius>=12;
}

function findCard(label){
 let el=label.parentElement;
 for(let i=0;i<6&&el;i++,el=el.parentElement){
  if(isCandidate(el))return el;
 }
 return null;
}

function apply(){
 installStyle();
 const all=document.querySelectorAll('body *');
 for(const el of all){
  if(el.children.length>0)continue;
  if(!TARGETS.has(normalizedText(el)))continue;
  const card=findCard(el);
  if(card)card.classList.add(CARD_CLASS);
 }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
const mo=new MutationObserver(()=>requestAnimationFrame(apply));
if(document.documentElement)mo.observe(document.documentElement,{subtree:true,childList:true});
setTimeout(apply,300);setTimeout(apply,1200);setTimeout(apply,2500);
})();
