(function(){
  'use strict';
  if(window.__tf503020InputFormatV104)return;
  window.__tf503020InputFormatV104=true;

  function formatSalaryText(raw){
    var s=String(raw==null?'':raw).replace(/[^0-9.,]/g,'');
    if(!s)return '';

    // En TaskFlow la coma se usa visualmente para separar miles.
    s=s.replace(/,/g,'');

    var integer=s;
    var decimals='';
    var keepDecimal=false;
    var dotCount=(s.match(/\./g)||[]).length;
    var lastDot=s.lastIndexOf('.');

    if(lastDot>=0){
      var after=s.length-lastDot-1;
      if(after<=2){
        integer=s.slice(0,lastDot).replace(/\./g,'');
        decimals=s.slice(lastDot+1).replace(/\D/g,'').slice(0,2);
        keepDecimal=true;
      }else{
        integer=s.replace(/\./g,'');
      }
    }

    if(dotCount>1&&lastDot>=0){
      var suffix=s.slice(lastDot+1).replace(/\D/g,'');
      if(suffix.length<=2){
        integer=s.slice(0,lastDot).replace(/\D/g,'');
        decimals=suffix.slice(0,2);
        keepDecimal=true;
      }else{
        integer=s.replace(/\D/g,'');
        decimals='';
        keepDecimal=false;
      }
    }

    integer=String(integer).replace(/\D/g,'').replace(/^0+(?=\d)/,'');
    if(!integer)integer='0';
    integer=integer.replace(/\B(?=(\d{3})+(?!\d))/g,',');

    if(keepDecimal)return integer+'.'+decimals;
    return integer;
  }

  function formatInput(input){
    if(!input||input.id!=='tf503020Salary')return;
    var old=String(input.value||'');
    var caret=typeof input.selectionStart==='number'?input.selectionStart:old.length;
    var digitsBefore=old.slice(0,caret).replace(/\D/g,'').length;
    var next=formatSalaryText(old);
    if(next===old)return;

    input.value=next;
    try{
      var pos=next.length;
      if(digitsBefore===0)pos=0;
      else{
        var seen=0;
        for(var i=0;i<next.length;i++){
          if(/\d/.test(next.charAt(i)))seen++;
          if(seen>=digitsBefore){pos=i+1;break;}
        }
      }
      input.setSelectionRange(pos,pos);
    }catch(_){ }
  }

  document.addEventListener('input',function(event){
    var input=event.target;
    if(input&&input.id==='tf503020Salary')formatInput(input);
  },false);

  document.addEventListener('focusin',function(event){
    var input=event.target;
    if(input&&input.id==='tf503020Salary')formatInput(input);
  },false);
})();
