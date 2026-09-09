(function(){
'use strict';
if(window.__tfProfileV111)return;window.__tfProfileV111=true;

const PROJECT_ID='taskflow-b0ece';
const DB='(default)';
const API='https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(PROJECT_ID)+'/databases/'+encodeURIComponent(DB)+'/documents';
const CACHE_PREFIX='taskflow_profile_photo_v1_';
let activeUid='';
let authBound=false;
const $=id=>document.getElementById(id);

function installStyle(){
 if($('tfProfileV111Style'))return;
 const s=document.createElement('style');
 s.id='tfProfileV111Style';
 s.textContent=`
.tf-profile-button .tf-profile-thumb{display:none;width:100%;height:100%;object-fit:cover;border-radius:50%}
.tf-profile-button.has-photo{padding:0;overflow:hidden;background:#111827}
.tf-profile-button.has-photo svg,.tf-profile-button.has-photo .tf-profile-initial{display:none!important}
.tf-profile-button.has-photo .tf-profile-thumb{display:block}
.tf-profile-avatar{position:relative;overflow:hidden}
.tf-profile-avatar .tf-profile-photo{display:none;width:100%;height:100%;object-fit:cover}
.tf-profile-avatar.has-photo{background:#111827;border-color:rgba(78,205,196,.35)}
.tf-profile-avatar.has-photo svg,.tf-profile-avatar.has-photo strong{display:none!important}
.tf-profile-avatar.has-photo .tf-profile-photo{display:block}
.tf-profile-photo-tools{display:grid;grid-template-columns:1fr;gap:8px;padding:10px 11px;border-radius:12px;background:rgba(255,255,255,.035);border:1px solid var(--border-light)}
.tf-profile-photo-tools span{display:block;font-size:8px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em}
.tf-profile-photo-tools button{min-height:38px;border-radius:11px;border:1px solid rgba(78,205,196,.30);background:rgba(78,205,196,.10);color:var(--accent-primary);font-size:10px;font-weight:800;cursor:pointer}
.tf-profile-photo-tools button:disabled{opacity:.5;cursor:not-allowed}
`;
 document.head.appendChild(s);
}

function sanitizeText(text){
 let t=String(text||'');
 t=t.replace(/Firebase Authentication/gi,'Cuenta y sincronización');
 t=t.replace(/Inicializando Firebase\.{0,3}/gi,'Preparando tu cuenta...');
 t=t.replace(/Firebase conectado en modo compatible\.?/gi,'Cuenta lista. Puedes iniciar sesión o crear una cuenta.');
 t=t.replace(/Firebase conectado\. Puedes iniciar sesión o crear una cuenta\.?/gi,'Cuenta lista. Puedes iniciar sesión o crear una cuenta.');
 t=t.replace(/Sesión activa con Firebase Authentication\.?/gi,'Sesión activa. Tus datos están sincronizados.');
 t=t.replace(/Conectando con Firebase\.{0,3}/gi,'Iniciando sesión...');
 t=t.replace(/No se pudo conectar con Firebase\.?/gi,'No se pudo conectar con el servicio.');
 t=t.replace(/Firebase/gi,'el servicio');
 return t;
}

function sanitizeUi(){
 const sub=$('tfProfileSubtitle');if(sub&&sub.textContent!=='Cuenta y sincronización')sub.textContent='Cuenta y sincronización';
 const note=document.querySelector('.tf-profile-note');
 const noteText='Tu contraseña no se guarda en TaskFlow. Tu cuenta mantiene tus datos sincronizados de forma segura.';
 if(note&&note.textContent!==noteText)note.textContent=noteText;
 const state=$('tfProfileState');if(state){const n=sanitizeText(state.textContent);if(n!==state.textContent)state.textContent=n;}
 const msg=$('tfProfileMessage');if(msg){const n=sanitizeText(msg.textContent);if(n!==msg.textContent)msg.textContent=n;}
 document.querySelectorAll('.tf-profile-userrow').forEach(row=>{
  const label=row.querySelector('span');
  if(label&&/uid|firebase/i.test(label.textContent||'')){
   row.style.display='none';
   row.setAttribute('aria-hidden','true');
  }
 });
}

function scheduleSanitize(){
 setTimeout(sanitizeUi,0);
 setTimeout(sanitizeUi,80);
 setTimeout(sanitizeUi,300);
}

function cacheKey(uid){return CACHE_PREFIX+uid;}
function cachedPhoto(uid){try{return localStorage.getItem(cacheKey(uid))||''}catch(_){return''}}
function saveCachedPhoto(uid,data){try{if(data)localStorage.setItem(cacheKey(uid),data);else localStorage.removeItem(cacheKey(uid));}catch(_){}}

function ensurePhotoUi(){
 installStyle();
 const btn=$('tfProfileButton');
 if(btn&&!$('tfProfileThumb')){
  const img=document.createElement('img');img.id='tfProfileThumb';img.className='tf-profile-thumb';img.alt='';img.setAttribute('aria-hidden','true');btn.insertBefore(img,btn.firstChild);
 }
 const avatar=$('tfProfileAvatar');
 if(avatar&&!$('tfProfilePhoto')){
  const img=document.createElement('img');img.id='tfProfilePhoto';img.className='tf-profile-photo';img.alt='Foto de perfil';avatar.insertBefore(img,avatar.firstChild);
 }
 const box=$('tfProfileUserBox');
 if(box&&!$('tfProfilePhotoTools')){
  const tools=document.createElement('div');tools.id='tfProfilePhotoTools';tools.className='tf-profile-photo-tools';
  tools.innerHTML='<span>Foto de perfil</span><input id="tfProfilePhotoInput" type="file" accept="image/jpeg,image/png,image/webp" hidden><button id="tfProfilePhotoChange" type="button">Cambiar foto</button>';
  const signout=$('tfProfileSignOut');if(signout)box.insertBefore(tools,signout);else box.appendChild(tools);
  const change=$('tfProfilePhotoChange'),input=$('tfProfilePhotoInput');
  if(change&&input){change.addEventListener('click',()=>input.click());input.addEventListener('change',onPhotoSelected);}
 }
}

function setPhoto(data){
 const btn=$('tfProfileButton'),thumb=$('tfProfileThumb'),avatar=$('tfProfileAvatar'),photo=$('tfProfilePhoto');
 if(data){
  if(thumb)thumb.src=data;if(photo)photo.src=data;if(btn)btn.classList.add('has-photo');if(avatar)avatar.classList.add('has-photo');
 }else{
  if(thumb)thumb.removeAttribute('src');if(photo)photo.removeAttribute('src');if(btn)btn.classList.remove('has-photo');if(avatar)avatar.classList.remove('has-photo');
 }
}

async function idToken(force){
 if(window.TaskFlowFirebase&&typeof window.TaskFlowFirebase.getIdToken==='function')return window.TaskFlowFirebase.getIdToken(!!force);
 return null;
}

async function profileRequest(uid,opt){
 const tok=await idToken(false);if(!tok)throw new Error('AUTH_REQUIRED');
 const url=API+'/users/'+encodeURIComponent(uid)+'/profile/avatar';
 const options=Object.assign({},opt||{});
 options.headers=Object.assign({'Authorization':'Bearer '+tok,'Content-Type':'application/json'},options.headers||{});
 let r=await fetch(url,options);
 if(r.status===401){const fresh=await idToken(true);if(fresh){options.headers.Authorization='Bearer '+fresh;r=await fetch(url,options);}}
 if(r.status===404)return null;
 const body=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(body&&body.error&&body.error.message||('HTTP '+r.status));
 return body;
}

function readPhotoField(doc){return String(doc&&doc.fields&&doc.fields.photoData&&doc.fields.photoData.stringValue||'');}
async function loadPhoto(uid){
 const local=cachedPhoto(uid);if(local)setPhoto(local);
 try{
  const doc=await profileRequest(uid,{method:'GET'});
  const remote=readPhotoField(doc);
  if(remote){saveCachedPhoto(uid,remote);setPhoto(remote);}else if(!local)setPhoto('');
 }catch(e){console.warn('TaskFlow profile photo load:',e);}
}

async function savePhoto(uid,data){
 const name='projects/'+PROJECT_ID+'/databases/'+DB+'/documents/users/'+uid+'/profile/avatar';
 const body={name,fields:{photoData:{stringValue:data},updatedAt:{integerValue:String(Date.now())}}};
 await profileRequest(uid,{method:'PATCH',body:JSON.stringify(body)});
 saveCachedPhoto(uid,data);setPhoto(data);
}

function toSquareDataUrl(file){
 return new Promise((resolve,reject)=>{
  if(!file||!/^image\/(jpeg|png|webp)$/i.test(file.type||''))return reject(new Error('TYPE'));
  if(file.size>8*1024*1024)return reject(new Error('SIZE'));
  const reader=new FileReader();
  reader.onerror=()=>reject(new Error('READ'));
  reader.onload=()=>{
   const img=new Image();
   img.onerror=()=>reject(new Error('IMAGE'));
   img.onload=()=>{
    try{
     const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height,side=Math.min(w,h);
     if(!side)return reject(new Error('IMAGE'));
     const c=document.createElement('canvas');c.width=256;c.height=256;
     const ctx=c.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
     ctx.drawImage(img,(w-side)/2,(h-side)/2,side,side,0,0,256,256);
     const out=c.toDataURL('image/jpeg',0.84);
     if(!out||out.length>850000)return reject(new Error('SIZE'));
     resolve(out);
    }catch(e){reject(e);}
   };
   img.src=String(reader.result||'');
  };
  reader.readAsDataURL(file);
 });
}

function uiMsg(text,kind){
 const e=$('tfProfileMessage');if(!e)return;e.textContent=text||'';e.className='tf-profile-message'+(kind?' '+kind:'');
}

async function onPhotoSelected(ev){
 const input=ev&&ev.target,file=input&&input.files&&input.files[0];if(!file)return;
 const button=$('tfProfilePhotoChange');if(button)button.disabled=true;
 try{
  if(!activeUid)throw new Error('AUTH_REQUIRED');
  uiMsg('Preparando foto...');
  const data=await toSquareDataUrl(file);
  uiMsg('Guardando foto...');
  await savePhoto(activeUid,data);
  uiMsg('Foto de perfil actualizada.','ok');
 }catch(e){
  const code=String(e&&e.message||'');
  uiMsg(code==='TYPE'?'Selecciona una imagen JPG, PNG o WEBP.':code==='SIZE'?'La imagen es demasiado grande. Selecciona otra foto.':'No se pudo actualizar la foto. Inténtalo de nuevo.','bad');
  console.warn('TaskFlow profile photo save:',e);
 }finally{
  if(input)input.value='';if(button)button.disabled=false;
 }
}

function handleUser(user){
 activeUid=user&&user.uid||'';
 sanitizeUi();ensurePhotoUi();
 if(!activeUid){setPhoto('');return;}
 loadPhoto(activeUid);
}

function bindPublicActions(){
 ['tfProfileButton','tfProfileSignIn','tfProfileCreate','tfProfileReset','tfProfileSignOut'].forEach(id=>{
  const el=$(id);if(el&&!el.dataset.tfV111Bound){el.dataset.tfV111Bound='1';el.addEventListener('click',scheduleSanitize);}
 });
}

function bindAuth(){
 if(authBound)return;
 if(window.firebase&&window.firebase.auth){
  authBound=true;
  window.firebase.auth().onAuthStateChanged(handleUser);
  handleUser(window.firebase.auth().currentUser);
  return;
 }
 setTimeout(bindAuth,120);
}

function start(){
 ensurePhotoUi();sanitizeUi();bindPublicActions();bindAuth();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
