// UI de modo, toolbar y botones principales de Pizarra Pro
// Expone funciones en window. Depende de S, draw, setMode, playback, canvas, etc.

(function(){
  window.updateUI = function(){
    const has=hasPlay(),rec=S.mode==='rec',pl=S.mode==='play',pa=S.mode==='pause',pv=!!S.preview;
    const bR=document.getElementById('bRec');
    bR.classList.toggle('recOn',rec);
    bR.querySelector('.ico').textContent=rec?'⏹':'⏺';
    document.getElementById('bRecL').textContent=rec?'Detener':(Object.keys(S.tracks).length?'Regrabar':'Grabar');
    bR.disabled=pl||pa||pv;

    const bP=document.getElementById('bPlay');
    bP.disabled=!has||rec;
    bP.querySelector('.ico').textContent=pl?'⏸':'▶';
    document.getElementById('bPlayL').textContent=pl?'Pausar':(pa?'Continuar':'Reproducir');
    document.getElementById('bStop').disabled=!(pl||pa);
    document.getElementById('bSave').disabled=!Object.keys(S.tracks).length||rec||pv;
    document.getElementById('bReset').disabled=rec;

    const scrub=document.getElementById('scrub');
    scrub.disabled=!has||rec;
    document.getElementById('tTot').textContent=(curDuration()/1000).toFixed(1)+'s';
    if(!has){document.getElementById('tCur').textContent='0.0s';scrub.value=0;scrub.style.setProperty('--fill','0%')}

    document.getElementById('rDraw').disabled=pl||rec;
    document.getElementById('rForm').disabled=pl||pa||rec||pv;
    document.getElementById('rTeams').disabled=pl||pa||rec||pv;
    document.getElementById('rAI').disabled=pl&&!pv||rec;
    document.getElementById('hExport').disabled=!has||rec||pl;
    document.getElementById('hShare').disabled=!has||rec;
  };

  function selCol(id){document.querySelectorAll('.dBtn.col').forEach(b=>b.classList.toggle('on',b.id===id))}
  window.enterPresent = function(){
    if(!hasPlay()){toast('Grabá o cargá una jugada antes de presentar');return}
    if(S.mode==='rec'){toast('Detené la grabación antes de presentar');return}
    document.body.classList.add('presenting');
    document.getElementById('presentExit').style.display='flex';
    // reproducir desde el inicio en loop
    S.loop=true;document.getElementById('chipLoop').classList.add('on');
    stopPlay();play();
    toast('🖥️ Modo presentación · tocá ✕ para salir');
  };
  window.exitPresent = function(){
    document.body.classList.remove('presenting');
    document.getElementById('presentExit').style.display='none';
    pause();
    resize();
  };

  // Preview AI
  document.getElementById('aiSeeOrig').onclick=()=>{S.prevShow='orig';updatePrevSeg();stopPlay();play()};
  document.getElementById('aiSeeAI').onclick=()=>{S.prevShow='ai';updatePrevSeg();stopPlay();play()};
  document.getElementById('aiReplay').onclick=()=>{stopPlay();play()};
  document.getElementById('aiYes').onclick=applyPreview;
  document.getElementById('aiNo').onclick=()=>discardPreview(false);

  // Botones de modo principal
  document.getElementById('bRec').onclick=()=>S.mode==='rec'?stopRec():startRec();
  document.getElementById('bPlay').onclick=()=>S.mode==='play'?pause():play();
  document.getElementById('bStop').onclick=stopPlay;
  document.getElementById('bReset').onclick=()=>{
    discardPreview(true);clearPlay();S.drawings=[];S.carrier=null;S.fx=[];
    buildPlayers(true);applyFormationsQuiet();setMode('idle');draw();
    document.getElementById('bPlayL').textContent='Reproducir';
    toast('Pizarra limpia');
  };
  document.getElementById('bSave').onclick=()=>openSheet('shSave');

  // Rail / toolbar
  document.getElementById('rDraw').onclick=()=>{
    if(S.mode==='rec'){toast('Terminá la grabación para dibujar');return}
    S.drawMode=!S.drawMode;
    document.getElementById('rDraw').classList.toggle('on',S.drawMode);
    document.getElementById('drawBar').classList.toggle('show',S.drawMode);
    toast(S.drawMode?'✏️ Dibujá flechas sobre la cancha':'Modo mover jugadores');
  };
  document.getElementById('dExit').onclick=()=>document.getElementById('rDraw').click();
  document.getElementById('dUndo').onclick=()=>{S.drawings.pop();draw()};
  document.getElementById('dClear').onclick=()=>{S.drawings=[];draw();toast('Dibujos borrados')};
  document.getElementById('dWhite').onclick=()=>{S.drawColor='#f3f6f1';selCol('dWhite')};
  document.getElementById('dAmber').onclick=()=>{S.drawColor='#ffb020';selCol('dAmber')};
  document.getElementById('rForm').onclick=()=>openSheet('shForm');
  document.getElementById('rTeams').onclick=()=>openSheet('shTeams');
  document.getElementById('rAI').onclick=()=>{if(S.preview){toast('Cerrá la vista previa primero (✓ o ✕)');return}openSheet('shAI')};
  document.getElementById('rPresent').onclick=enterPresent;
  document.getElementById('presentExit').onclick=exitPresent;

  // Header / chips
  document.getElementById('hPlays').onclick=()=>openSheet('shPlays');
  document.getElementById('hHelp').onclick=()=>startTour();
  document.getElementById('hUpgrade').onclick=()=>openSheet('shPlans');
  document.getElementById('hHome').onclick=()=>{try{top.location.href='/landing';}catch(e){location.href='/landing';}};
  document.getElementById('chipSpeed').onclick=()=>openSheet('shSpeed');
  document.getElementById('chipLoop').onclick=()=>{
    S.loop=!S.loop;
    document.getElementById('chipLoop').classList.toggle('on',S.loop);
    toast(S.loop?'🔁 Repetición en bucle':'Repetición desactivada');
  };
  document.getElementById('undoFloat').onclick=undoRec;
  document.getElementById('hExport').onclick=()=>{
    if(S.plan==='free' && S.saved.length>=1 && S.aiUsedToday>=1){
      // allow GIF export but show upgrade nudge after 1st
    }
    exportGIF();
  };
  document.getElementById('hShare').onclick=sharePlay;
  document.getElementById('hTemplates').onclick=()=>{openSheet('shTemplates');renderTemplates()};
  document.getElementById('hMinutes').onclick=()=>{openSheet('shMinutes');renderMinutes()};

  // Cambio de modalidad (5/8/11)
  document.querySelectorAll('#gameSeg button').forEach(b=>b.onclick=()=>{
    const g=+b.dataset.g;if(g===S.game)return;
    if(S.mode!=='idle'){toast('Detené la reproducción/grabación primero');return}
    discardPreview(true);
    S.game=g;S.team1=g;S.team2=g;
    S.form1=DEFAULT_FORM[g];S.form2=DEFAULT_FORM[g];
    syncGameSeg();clearPlay(true);S.drawings=[];S.carrier=null;S.fx=[];
    buildPlayers();resize();updateUI();
    toast('Fútbol '+g+' · '+DEFAULT_FORM[g]);
  });
})();
