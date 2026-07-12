// Splash + tour interactivo de Pizarra Pro
// Expone initSplash y startTour en window. Depende de S, openAuth, toast.

(function(){

var SPLASH_KEY='pizarraPro.splashSeen';
var TOUR_KEY='pizarraPro.tourSeen';

// ---- Pasos del tour ----
var STEPS=[
  {sel:'#gameSeg',title:'Elegí la modalidad',text:'Fútbol 5, 8 u 11. La cancha y las formaciones se ajustan solas.'},
  {sel:'#fieldWrap',title:'Mové lo importante',text:'Arrastrá jugadores y pelota. Mantené presionado un jugador para poner nombre y número.'},
  {sel:'#bRec',title:'Grabá',text:'Tocá Grabar y mové sólo a los protagonistas. Después podés reproducir y corregir.'},
  {sel:'#hHome',title:'Todo a un toque',text:'Desde Inicio abrís partido, plantillas, jugadas guardadas y presentación.'}
];

// ---- Splash ----
function initSplash(){
  var el=document.getElementById('splash');
  if(!el)return;
  // Si ya está logueado o ya vio el splash, ocultar
  if(S.user||localStorage.getItem(SPLASH_KEY)){
    el.style.display='none';
    // Si no vio el tour y no hay usuario, arrancar tour
    if(!S.user&&!localStorage.getItem(TOUR_KEY)){
      setTimeout(startTour,300);
    }
    return;
  }
  // Mostrar splash
  el.style.display='flex';
  document.getElementById('splashTactic').onclick=function(){
    localStorage.setItem(SPLASH_KEY,'1');
    closeSplash();
    if(!localStorage.getItem(TOUR_KEY)){
      setTimeout(startTour,400);
    }
  };
  document.getElementById('splashMatch').onclick=function(){localStorage.setItem(SPLASH_KEY,'1');closeSplash();setTimeout(function(){openSheet('shMinutes');renderMinutes();},420)};
  document.getElementById('splashPlays').onclick=function(){localStorage.setItem(SPLASH_KEY,'1');closeSplash();setTimeout(function(){openSheet('shPlays');},420)};
  document.getElementById('splashRegister').onclick=function(){
    localStorage.setItem(SPLASH_KEY,'1');
    closeSplash();
    if(typeof openAuth==='function')openAuth('register');
  };
}

function openCoachHome(){
  document.getElementById('coachPlayCount').textContent=(S.saved&&S.saved.length?S.saved.length+' guardadas':'Abrir guardadas');
  document.querySelector('#coachTactic b').textContent=hasPlay()?'Continuar jugada':'Preparar jugada';
  document.querySelector('#coachTactic small').textContent=hasPlay()?'Seguir donde la dejaste':'Volver a la cancha y grabar';
  document.getElementById('coachPresent').disabled=!hasPlay();
  document.getElementById('coachExport').disabled=!hasPlay();
  openSheet('shCoach');
}
document.getElementById('coachTactic').onclick=function(){closeSheets()};
document.getElementById('coachMinutes').onclick=function(){openSheet('shMinutes');renderMinutes()};
document.getElementById('coachTemplates').onclick=function(){openSheet('shTemplates');renderTemplates()};
document.getElementById('coachPlays').onclick=function(){openSheet('shPlays')};
document.getElementById('coachPresent').onclick=function(){closeSheets();enterPresent()};
document.getElementById('coachExport').onclick=function(){closeSheets();document.getElementById('hExport').click()};
document.getElementById('coachHelp').onclick=function(){closeSheets();startTour()};
document.getElementById('coachPlan').onclick=function(){openSheet('shPlans')};

function closeSplash(){
  var el=document.getElementById('splash');
  if(!el)return;
  el.classList.add('hide');
  setTimeout(function(){el.style.display='none';el.classList.remove('hide');},400);
}

// ---- Tour ----
var tourIdx=0;
var tourActive=false;

var _rafPending=false;
function onTourResize(){
  if(!tourActive||_rafPending)return;
  _rafPending=true;
  requestAnimationFrame(function(){_rafPending=false;showStep();});
}

function onTourKey(e){if(e.key==='Escape')endTour();}

function startTour(){
  if(tourActive)return;
  tourIdx=0;
  tourActive=true;
  buildOverlay();
  showStep();
  window.addEventListener('resize',onTourResize);
  window.addEventListener('scroll',onTourResize,true);
  window.addEventListener('keydown',onTourKey);
  var ov=document.getElementById('tourOverlay');
  if(ov)ov.addEventListener('click',function(e){if(e.target===ov)endTour();});
}

function buildOverlay(){
  if(document.getElementById('tourOverlay'))return;
  var ov=document.createElement('div');
  ov.id='tourOverlay';
  ov.innerHTML='<div id="tourHighlight"></div><div id="tourArrow"></div><div id="tourTooltip" class="fade-in"></div>';
  document.body.appendChild(ov);
}

function removeOverlay(){
  var ov=document.getElementById('tourOverlay');
  if(ov)ov.remove();
}

function showStep(){
  if(tourIdx<0||tourIdx>=STEPS.length){endTour();return}
  var step=STEPS[tourIdx];
  var target=document.querySelector(step.sel);
  if(!target){tourIdx++;showStep();return}

  var rect=target.getBoundingClientRect();
  var inViewport=rect.top>=0&&rect.bottom<=window.innerHeight&&rect.left>=0&&rect.right<=window.innerWidth;

  if(!inViewport){
    target.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(positionStep,300,target,step);
    return;
  }
  positionStep(target,step);
}

function positionStep(target,step){
  var rect=target.getBoundingClientRect();
  var hl=document.getElementById('tourHighlight');
  var tt=document.getElementById('tourTooltip');
  var arrow=document.getElementById('tourArrow');

  var pad=6;
  hl.style.left=(rect.left-pad)+'px';
  hl.style.top=(rect.top-pad)+'px';
  hl.style.width=(rect.width+pad*2)+'px';
  hl.style.height=(rect.height+pad*2)+'px';

  var ttW=Math.min(280,window.innerWidth-40);
  var ttH=120;
  var margin=14;
  var ttLeft,ttTop,arrowLeft,arrowTop,arrowRot;

  if(rect.bottom+ttH+margin<window.innerHeight){
    ttLeft=rect.left+rect.width/2-ttW/2;
    ttTop=rect.bottom+margin;
    arrowLeft=rect.left+rect.width/2-6;
    arrowTop=rect.bottom+margin-7;
    arrowRot=45;
  }else if(rect.top-ttH-margin>0){
    ttLeft=rect.left+rect.width/2-ttW/2;
    ttTop=rect.top-ttH-margin;
    arrowLeft=rect.left+rect.width/2-6;
    arrowTop=rect.top-margin-7;
    arrowRot=225;
  }else{
    if(rect.right+ttW+margin<window.innerWidth){
      ttLeft=rect.right+margin;
      ttTop=rect.top+rect.height/2-ttH/2;
      arrowLeft=rect.right+margin-7;
      arrowTop=rect.top+rect.height/2-6;
      arrowRot=45;
    }else{
      ttLeft=rect.left-ttW-margin;
      ttTop=rect.top+rect.height/2-ttH/2;
      arrowLeft=rect.left-margin-7;
      arrowTop=rect.top+rect.height/2-6;
      arrowRot=225;
    }
  }

  ttLeft=Math.max(10,Math.min(ttLeft,window.innerWidth-ttW-10));
  ttTop=Math.max(10,Math.min(ttTop,window.innerHeight-ttH-10));

  tt.style.left=ttLeft+'px';
  tt.style.top=ttTop+'px';

  arrow.style.left=arrowLeft+'px';
  arrow.style.top=arrowTop+'px';
  arrow.style.transform='rotate('+arrowRot+'deg)';

  var stepChanged=tt.dataset.step!==String(tourIdx);
  if(stepChanged){
    tt.dataset.step=String(tourIdx);
    var isLast=tourIdx===STEPS.length-1;
    var isFirst=tourIdx===0;
    var pct=Math.round((tourIdx+1)/STEPS.length*100);
    tt.innerHTML=
      '<div class="tour-progress"><div class="tour-bar" style="width:'+pct+'%"></div></div>'+
      '<div class="tour-title">'+step.title+'</div>'+
      '<div class="tour-text">'+step.text+'</div>'+
      '<div class="tour-nav">'+
        '<button class="tour-skip" id="tourSkip">Saltar</button>'+
        '<span class="tour-step">'+(tourIdx+1)+' / '+STEPS.length+'</span>'+
        '<div class="tour-btns">'+
          (isFirst?'':'<button class="tour-btn tour-prev" id="tourPrev">Atrás</button>')+
          '<button class="tour-btn tour-next" id="tourNext">'+(isLast?'Entendido':'Siguiente')+'</button>'+
        '</div>'+
      '</div>';

    // Fade-in animation
    tt.classList.remove('show');
    void tt.offsetWidth;
    tt.classList.add('show');

    document.getElementById('tourNext').onclick=function(){
      if(isLast){endTour();}
      else{tourIdx++;showStep();}
    };
    var prevBtn=document.getElementById('tourPrev');
    if(prevBtn)prevBtn.onclick=function(){tourIdx--;showStep();};
    document.getElementById('tourSkip').onclick=endTour;
  }
}

function endTour(){
  tourActive=false;
  tourIdx=0;
  removeOverlay();
  localStorage.setItem(TOUR_KEY,'1');
  window.removeEventListener('resize',onTourResize);
  window.removeEventListener('scroll',onTourResize,true);
  window.removeEventListener('keydown',onTourKey);
}

// ---- Expose ----
window.initSplash=initSplash;
window.startTour=startTour;
window.openCoachHome=openCoachHome;

})();
