(function(){
  'use strict';
  if(window.__tf503020V103)return;
  window.__tf503020V103=true;

  var STORAGE_KEY='taskflow_503020_v1';
  var BACKUP_KEY='taskflow_503020_v1_backup';
  var state=null;
  var memoryFallback=null;
  var observer=null;

  function blankState(){return {schemaVersion:1,revision:0,salary:0,salaryUpdatedAt:null,salaryChanges:[],records:[]};}
  function validMonth(v){return /^\d{4}-\d{2}$/.test(String(v||''));}
  function monthIndex(key){var p=String(key).split('-');return (Number(p[0])||0)*12+(Number(p[1])||1)-1;}
  function monthFromIndex(idx){var y=Math.floor(idx/12),m=(idx%12)+1;return String(y).padStart(4,'0')+'-'+String(m).padStart(2,'0');}
  function shiftMonth(key,delta){return monthFromIndex(monthIndex(key)+delta);}
  function compareMonth(a,b){return monthIndex(a)-monthIndex(b);}
  function currentMonthGT(){
    try{
      var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit'}).formatToParts(new Date());
      var y=parts.find(function(x){return x.type==='year';}).value;
      var m=parts.find(function(x){return x.type==='month';}).value;
      return y+'-'+m;
    }catch(_){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
  }
  function monthLabel(key){
    var p=String(key).split('-'),d=new Date(Number(p[0]),Number(p[1])-1,1,12,0,0);
    try{return new Intl.DateTimeFormat('es-GT',{month:'long',year:'numeric',timeZone:'America/Guatemala'}).format(d).replace(/^./,function(c){return c.toUpperCase();});}
    catch(_){return key;}
  }
  function fmt(amount){
    var n=Number(amount)||0;
    try{return new Intl.NumberFormat('es-GT',{style:'currency',currency:'GTQ',currencyDisplay:'narrowSymbol',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);}
    catch(_){return 'Q '+n.toFixed(2);}
  }
  function parseMoney(raw){
    var s=String(raw==null?'':raw).trim().replace(/[^0-9,.-]/g,'');
    if(!s)return NaN;
    var neg=s.indexOf('-')===0;
    s=s.replace(/-/g,'');
    var comma=s.lastIndexOf(','),dot=s.lastIndexOf('.');
    if(comma>-1&&dot>-1){
      if(dot>comma)s=s.replace(/,/g,'');
      else{s=s.replace(/\./g,'').replace(',','.');}
    }else if(comma>-1){
      var after=s.length-comma-1;
      if(after===3&&/^\d{1,3}(,\d{3})+$/.test(s))s=s.replace(/,/g,'');
      else s=s.replace(/,/g,'.');
    }else if(dot>-1){
      var parts=s.split('.');
      if(parts.length>2)s=parts.join('');
      else if(parts[1]&&parts[1].length===3&&/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
    }
    var n=Number(s);return neg?-n:n;
  }
  function clone(obj){return JSON.parse(JSON.stringify(obj));}
  function normalizeData(data){
    var out=blankState();
    if(!data||typeof data!=='object')return out;
    out.revision=Math.max(0,Number(data.revision)||0);
    out.salary=Math.max(0,Number(data.salary)||0);
    out.salaryUpdatedAt=Number(data.salaryUpdatedAt)||null;
    if(Array.isArray(data.salaryChanges)){
      out.salaryChanges=data.salaryChanges.filter(function(x){return x&&validMonth(x.month)&&Number(x.salary)>0;}).map(function(x){return {month:x.month,salary:Number(x.salary),createdAt:Number(x.createdAt)||Date.now()};});
    }
    if(Array.isArray(data.records)){
      var seen={};
      out.records=data.records.filter(function(x){return x&&validMonth(x.month)&&Number(x.salary)>0&&!seen[x.month]&&(seen[x.month]=true);}).map(function(x){
        var sal=Number(x.salary)||0;
        return {id:'503020-'+x.month,month:x.month,salary:sal,needs:Number(x.needs)||sal*.5,wants:Number(x.wants)||sal*.3,savings:Number(x.savings)||sal*.2,createdAt:Number(x.createdAt)||Date.now()};
      });
    }
    out.salaryChanges.sort(function(a,b){return compareMonth(a.month,b.month)||a.createdAt-b.createdAt;});
    out.records.sort(function(a,b){return compareMonth(b.month,a.month);});
    return out;
  }
  function parseWrapper(raw){
    try{
      var w=JSON.parse(raw||'null');
      if(!w)return null;
      if(w.data&&typeof w.data==='object')return {data:normalizeData(w.data),revision:Number(w.revision)||0,savedAt:Number(w.savedAt)||0};
      return {data:normalizeData(w),revision:Number(w.revision)||0,savedAt:Number(w.savedAt)||0};
    }catch(_){return null;}
  }
  function loadState(){
    var a=null,b=null;
    try{a=parseWrapper(localStorage.getItem(STORAGE_KEY));b=parseWrapper(localStorage.getItem(BACKUP_KEY));}catch(_){ }
    var best=null;
    if(a&&b)best=(a.revision>b.revision||(a.revision===b.revision&&a.savedAt>=b.savedAt))?a:b;
    else best=a||b;
    if(best)return normalizeData(best.data);
    if(memoryFallback)return normalizeData(memoryFallback);
    return blankState();
  }
  function persist(){
    state.revision=(Number(state.revision)||0)+1;
    var wrapper={data:clone(state),revision:state.revision,savedAt:Date.now()};
    memoryFallback=clone(state);
    try{var raw=JSON.stringify(wrapper);localStorage.setItem(STORAGE_KEY,raw);localStorage.setItem(BACKUP_KEY,raw);return true;}catch(_){return false;}
  }
  function salaryForMonth(month){
    var chosen=0;
    state.salaryChanges.forEach(function(c){if(compareMonth(c.month,month)<=0)chosen=c.salary;});
    return Number(chosen)||0;
  }
  function createRecord(month,salary){
    return {id:'503020-'+month,month:month,salary:salary,needs:salary*.50,wants:salary*.30,savings:salary*.20,createdAt:Date.now()};
  }
  function maintainRecords(saveIfChanged){
    var current=currentMonthGT(),start=shiftMonth(current,-5),changed=false;
    var before=state.records.length;
    state.records=state.records.filter(function(r){return compareMonth(r.month,start)>=0&&compareMonth(r.month,current)<=0;});
    if(state.records.length!==before)changed=true;

    state.salaryChanges.sort(function(a,b){return compareMonth(a.month,b.month)||a.createdAt-b.createdAt;});
    var first=null;
    state.salaryChanges.forEach(function(c){if(compareMonth(c.month,current)<=0&&(!first||compareMonth(c.month,first)<0))first=c.month;});
    if(first){
      var from=compareMonth(first,start)>0?first:start;
      for(var m=from;compareMonth(m,current)<=0;m=shiftMonth(m,1)){
        var exists=state.records.some(function(r){return r.month===m;});
        var sal=salaryForMonth(m);
        if(!exists&&sal>0){state.records.push(createRecord(m,sal));changed=true;}
      }
    }
    state.records.sort(function(a,b){return compareMonth(b.month,a.month);});

    if(state.salaryChanges.length){
      var baseline=null,kept=[];
      state.salaryChanges.forEach(function(c){if(compareMonth(c.month,start)<0)baseline=c;else kept.push(c);});
      if(baseline)kept.unshift(baseline);
      if(kept.length!==state.salaryChanges.length){state.salaryChanges=kept;changed=true;}
    }
    if(changed&&saveIfChanged!==false)persist();
    return changed;
  }
  function latestChange(){return state.salaryChanges.length?state.salaryChanges[state.salaryChanges.length-1]:null;}
  function saveSalary(amount){
    var current=currentMonthGT();
    var currentRecord=state.records.some(function(r){return r.month===current;});
    var effective=currentRecord?shiftMonth(current,1):current;
    var idx=-1;
    state.salaryChanges.forEach(function(c,i){if(c.month===effective)idx=i;});
    var change={month:effective,salary:amount,createdAt:Date.now()};
    if(idx>=0)state.salaryChanges[idx]=change;else state.salaryChanges.push(change);
    state.salaryChanges.sort(function(a,b){return compareMonth(a.month,b.month)||a.createdAt-b.createdAt;});
    state.salary=amount;state.salaryUpdatedAt=Date.now();
    maintainRecords(false);
    return {persisted:persist(),effective:effective,currentRecord:currentRecord};
  }

  function make(tag,cls,text){var el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el;}
  function allocationCard(cls,pct,title,note,id){
    var el=make('article','tf503020-allocation '+cls);
    var p=make('div','tf503020-percent',pct+'%');
    var t=make('div','tf503020-bucket-title',title);
    var a=make('div','tf503020-amount','—');a.id=id;
    var n=make('div','tf503020-bucket-note',note);
    var bal=make('div','tf503020-balance');bal.innerHTML='<span>Parte del ingreso total</span><strong>'+pct+' / 100</strong>';
    el.append(p,t,a,n,bal);return el;
  }
  function guideCard(cls,title,items){
    var el=make('article','tf503020-guide '+cls),head=make('div','tf503020-guide-head');
    head.append(make('span','tf503020-dot'),document.createTextNode(title));
    var ul=document.createElement('ul');items.forEach(function(item){ul.appendChild(make('li','',item));});
    el.append(head,ul);return el;
  }
  function buildModal(){
    if(document.getElementById('tf503020Overlay'))return document.getElementById('tf503020Overlay');
    var overlay=make('div','window-container tf503020-overlay');overlay.id='tf503020Overlay';overlay.setAttribute('aria-hidden','true');
    var shell=make('section','tf503020-shell');shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-labelledby','tf503020Title');
    var head=make('header','tf503020-head');
    var icon=make('span','tf503020-brand-icon');icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 5h16M4 12h10M4 19h5"/><path d="M20 10v9M16 14h4"/></svg>';
    var tw=make('div','tf503020-title-wrap');tw.innerHTML='<div class="tf503020-kicker">Presupuesto mensual</div><h2 class="tf503020-title" id="tf503020Title">50/30/20</h2>';
    var close=make('button','tf503020-close','×');close.type='button';close.id='tf503020Close';close.setAttribute('aria-label','Cerrar 50/30/20');
    head.append(icon,tw,close);
    var content=make('div','tf503020-content');

    var intro=make('section','tf503020-card tf503020-intro');
    var ic=make('div');ic.innerHTML='<h3>Tu salario se distribuye obligatoriamente en tres partes</h3><p>Ingresa tu ingreso mensual en quetzales. TaskFlow calcula el 50% para necesidades, el 30% para gustos y el 20% para ahorro, exactamente sobre el 100% del salario indicado.</p>';
    intro.append(ic,make('span','tf503020-rule-pill','50 + 30 + 20 = 100%'));

    var income=make('section','tf503020-card');income.innerHTML='<h3>Ingreso mensual</h3><p>El salario vigente se puede actualizar. Los registros mensuales ya creados quedan protegidos: no se pueden editar ni eliminar manualmente.</p>';
    var ig=make('div','tf503020-income-grid');
    var field=make('div','tf503020-field');var lab=make('label','','Salario / ingresos mensuales *');lab.setAttribute('for','tf503020Salary');
    var mw=make('div','tf503020-money-wrap');mw.innerHTML='<span class="tf503020-money-prefix">Q</span><input id="tf503020Salary" type="text" inputmode="decimal" autocomplete="off" placeholder="5,000.00" aria-describedby="tf503020Status">';
    field.append(lab,mw);var save=make('button','tf503020-save','Guardar salario');save.type='button';save.id='tf503020Save';ig.append(field,save);
    var status=make('div','tf503020-status');status.id='tf503020Status';income.append(ig,status);

    var alloc=make('section','tf503020-allocations');
    alloc.append(allocationCard('needs',50,'Necesidades','Gastos esenciales y básicos.','tf503020Needs'),allocationCard('wants',30,'Gustos','Consumo personal no esencial.','tf503020Wants'),allocationCard('savings',20,'Ahorro','Ahorro, inversión y reducción de deuda.','tf503020Savings'));

    var rules=make('section','tf503020-card');var rh=make('div','tf503020-section-head');rh.innerHTML='<div><h3>Qué incluye cada parte</h3><p>Clasificación tomada de las imágenes de referencia.</p></div><small>El monto de cada bloque depende del salario.</small>';rules.appendChild(rh);
    var guides=make('div','tf503020-guides');
    guides.append(
      guideCard('needs','50% · Necesidades',['Vivienda','Servicios (luz, agua, gas, etc.)','Seguro','Alimentos','Salud','Transporte','Cuidado personal']),
      guideCard('wants','30% · Gustos',['Entretenimiento','Compras','Comer fuera','Suscripciones']),
      guideCard('savings','20% · Ahorro',['Jubilación','Emergencias','Inversiones','Pago de deudas'])
    );rules.appendChild(guides);

    var history=make('section','tf503020-card');var hh=make('div','tf503020-section-head');hh.innerHTML='<div><h3>Registros mensuales</h3><p>Se crean automáticamente por mes y conservan el salario usado en ese momento.</p></div><small>Historial móvil de 6 meses</small>';history.append(hh,make('div','tf503020-history'));history.lastChild.id='tf503020History';

    var wealth=make('section','tf503020-card');var wh=make('div','tf503020-section-head');wh.innerHTML='<div><h3>Ruta patrimonial de las referencias</h3><p>Contenido adicional inspirado en las otras imágenes que compartiste.</p></div><small>Orientación educativa</small>';wealth.appendChild(wh);
    var wg=make('div','tf503020-wealth-grid');
    var w1=make('article','tf503020-wealth');w1.innerHTML='<strong>Al acumular Q1,000</strong><p>La referencia propone dividir esos primeros 1,000 en 70% para un fondo de reserva inmobiliario y 30% para educación.</p><div class="split"><div><b>Q700</b><span>Fondo de reserva inmobiliario</span></div><div><b>Q300</b><span>Educación financiera</span></div></div>';
    var w2=make('article','tf503020-wealth');w2.innerHTML='<strong>Decisiones de consumo vs. patrimonio</strong><p>Las imágenes comparan gastar en vacaciones, lujos, suscripciones y compras impulsivas con destinar capital a un inmueble o activo que pueda construir patrimonio.</p><ul class="tf503020-books"><li>Padre rico, Padre pobre</li><li>El inversor inteligente</li><li>Piense y Hágase Rico</li><li>El Efecto compuesto</li><li>El Millonario de la Puerta de al lado</li></ul><div class="tf503020-note"><b>Nota de TaskFlow:</b> una propiedad, inversión o alquiler puede subir o bajar de valor; la plusvalía y la rentabilidad no están garantizadas.</div>';
    wg.append(w1,w2);wealth.appendChild(wg);

    content.append(intro,income,alloc,rules,history,wealth);shell.append(head,content);overlay.appendChild(shell);document.body.appendChild(overlay);
    close.addEventListener('click',closeTool);
    overlay.addEventListener('click',function(e){if(e.target===overlay)closeTool();});
    save.addEventListener('click',handleSave);
    var input=mw.querySelector('input');
    input.addEventListener('input',function(){renderPreview(parseMoney(input.value));});
    input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();handleSave();}});
    return overlay;
  }
  function ensureHubButton(){
    var hub=document.getElementById('v27MainHub');if(!hub||document.getElementById('tf503020Hub'))return;
    var btn=make('button','v27-hub-button tf503020-hub');btn.type='button';btn.id='tf503020Hub';
    btn.innerHTML='<span class="v30-hub-icon tf503020-hub-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 13h6M7 17h3"/><path d="M17 13v4M15 15h4"/></svg></span><span><b>50/30/20</b><small>Organiza tu salario mensual en Q</small></span><i class="fas fa-chevron-right"></i>';
    btn.addEventListener('click',openTool);hub.appendChild(btn);
  }
  function renderPreview(amount){
    var n=Number(amount);if(!Number.isFinite(n)||n<=0)n=0;
    var a=document.getElementById('tf503020Needs'),b=document.getElementById('tf503020Wants'),c=document.getElementById('tf503020Savings');
    if(a)a.textContent=n>0?fmt(n*.5):'—';if(b)b.textContent=n>0?fmt(n*.3):'—';if(c)c.textContent=n>0?fmt(n*.2):'—';
  }
  function setStatus(text,type){var el=document.getElementById('tf503020Status');if(!el)return;el.className='tf503020-status'+(type?' '+type:'');el.textContent=text||'';}
  function renderHistory(){
    var box=document.getElementById('tf503020History');if(!box)return;box.replaceChildren();
    if(!state.records.length){box.appendChild(make('div','tf503020-empty','Aún no hay registros. Guarda tu salario y TaskFlow creará automáticamente el registro del mes correspondiente.'));return;}
    state.records.forEach(function(r){
      var row=make('article','tf503020-record');
      var main=make('div','tf503020-record-main');main.append(make('div','tf503020-record-month',monthLabel(r.month)),make('div','tf503020-record-salary',fmt(r.salary)),make('div','tf503020-record-lock','🔒 Registro protegido · eliminación automática al cumplir 6 meses'));
      function cell(label,val){var c=make('div','tf503020-record-cell');c.append(make('span','',label),make('strong','',fmt(val)));return c;}
      row.append(main,cell('50% necesidades',r.needs),cell('30% gustos',r.wants),cell('20% ahorro',r.savings));box.appendChild(row);
    });
  }
  function renderState(){
    maintainRecords(true);
    var input=document.getElementById('tf503020Salary');if(input){input.value=state.salary>0?new Intl.NumberFormat('es-GT',{minimumFractionDigits:0,maximumFractionDigits:2}).format(state.salary):'';renderPreview(state.salary);}
    var current=currentMonthGT(),lc=latestChange();
    if(state.salary>0&&lc){
      if(compareMonth(lc.month,current)>0)setStatus('Salario actualizado. Se aplicará a partir de '+monthLabel(lc.month)+'. El registro actual no se modifica.','warn');
      else setStatus('Salario vigente: '+fmt(state.salary)+'. El registro mensual queda protegido una vez creado.','ok');
    }else setStatus('Ingresa tu salario mensual para activar la distribución y el historial.','');
    renderHistory();
  }
  function handleSave(){
    var input=document.getElementById('tf503020Salary');if(!input)return;
    var amount=parseMoney(input.value);
    if(!Number.isFinite(amount)||amount<=0){setStatus('Ingresa un salario válido mayor que Q0. Ejemplo: 5,000 o 50,000.','error');input.focus();return;}
    if(amount>1000000000){setStatus('El monto es demasiado alto. Revisa la cantidad ingresada.','error');input.focus();return;}
    var result=saveSalary(Math.round(amount*100)/100);
    renderState();
    if(!result.persisted)setStatus('El cálculo funciona, pero el navegador no permitió guardar el historial local.','warn');
  }
  function openTool(){
    state=loadState();maintainRecords(true);var overlay=buildModal();renderState();overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');overlay.scrollTop=0;document.body.classList.add('tf503020-open');
    setTimeout(function(){var input=document.getElementById('tf503020Salary');if(input&&!state.salary)input.focus({preventScroll:true});},80);
  }
  function closeTool(){var overlay=document.getElementById('tf503020Overlay');if(!overlay)return;overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');document.body.classList.remove('tf503020-open');}
  function init(){
    state=loadState();maintainRecords(true);ensureHubButton();
    observer=new MutationObserver(function(){ensureHubButton();});observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){var o=document.getElementById('tf503020Overlay');if(o&&o.classList.contains('open'))closeTool();}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
