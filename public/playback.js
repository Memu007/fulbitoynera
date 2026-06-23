// Lógica de reproducción, grabación y preview de Pizarra Pro
// Expone funciones en window. Depende de S, draw, simplifyTrack, posAt, setMode/updateUI (UI).

(function(){
  // ---------------- Estado de modo ----------------
  window.setMode = function(m){
    S.mode=m;
    document.getElementById('pRec').classList.toggle('show',m==='rec');
    document.getElementById('pPlay').classList.toggle('show',m==='play'&&!S.preview);
    document.getElementById('pPause').classList.toggle('show',m==='pause');
    document.getElementById('undoFloat').classList.toggle('show',m==='rec');
    // Focus mode: atenuar UI durante play/pause para foco en cancha
    document.body.classList.toggle('focus',(m==='play'||m==='pause')&&!S.preview);
    updateUI();
  };

  // ---------------- Preview ----------------
  window.discardPreview = function(silent){
    if(!S.preview&&silent)return finishPrevUI();
    S.preview=null;
    finishPrevUI();
    if(!silent){stopPlay();toast('Se mantiene tu jugada original')}
  };

  // ---------------- Clear ----------------
  window.clearPlay = function(silent){S.tracks={};S.duration=0;S.playT=0;if(!silent)updateUI()};

  // ---------------- Grabación ----------------
  let lastKeyT={};
  window.addKey = function(p,thr){
    const t=performance.now()-S.recStart;
    if(thr&&lastKeyT[p.id]&&t-lastKeyT[p.id]<40)return;
    lastKeyT[p.id]=t;
    S.tracks[p.id].push({t,x:p.x,y:p.y});
    S.duration=Math.max(S.duration,t);
    document.getElementById('recTime').textContent=(t/1000).toFixed(1)+'s';
  };
  window.startRec = function(){
    discardPreview(true);
    S.tracks={};S.duration=0;lastKeyT={};S.recHistory=[];
    S.recStart=performance.now();
    for(const p of S.players)S.tracks[p.id]=[{t:0,x:p.x,y:p.y}];
    setMode('rec');toast('⏺ Mové la pelota y tus jugadores clave');
  };
  window.stopRec = function(){
    const t=performance.now()-S.recStart;
    S.duration=Math.max(S.duration,t,600);
    // Simplificar tracks con Douglas-Peucker: el arrastre del dedo deja 100+ puntos
    // con jitter; RDP los reduce a los 5-15 que importan, dejando una trayectoria
    // limpia que Catmull-Rom interpola suavemente.
    for(const id in S.tracks){
      const kf=simplifyTrack(S.tracks[id]);
      S.tracks[id]=kf;
    }
    for(const p of S.players){
      const kf=S.tracks[p.id],last=kf[kf.length-1];
      if(last.t<S.duration)kf.push({t:S.duration,x:last.x,y:last.y});
    }
    S.playT=0;setMode('idle');
    toast('Jugada grabada · '+(S.duration/1000).toFixed(1)+'s — probá ✨ IA');
  };
  window.pushUndo = function(){
    if(S.mode!=='rec')return;
    S.recHistory.push({
      tracks:JSON.parse(JSON.stringify(S.tracks)),
      duration:S.duration,
      carrier:S.carrier
    });
    if(S.recHistory.length>30)S.recHistory.shift();
  };
  window.undoRec = function(){
    if(S.mode!=='rec'||!S.recHistory.length){toast('Nada para deshacer');return}
    const s=S.recHistory.pop();
    S.tracks=s.tracks;S.duration=s.duration;S.carrier=s.carrier;
    document.getElementById('recTime').textContent=(S.duration/1000).toFixed(1)+'s';
    draw();toast('↶ Movimiento deshecho');
  };

  // ---------------- Reproducción ----------------
  window.activeTracks = function(){
    if(S.preview&&S.prevShow==='ai')return S.preview.tracks;
    return Object.keys(S.tracks).length?S.tracks:null;
  };
  window.curDuration = function(){return S.preview&&S.prevShow==='ai'?S.preview.duration:S.duration};

  // Easing temporal: los jugadores aceleran al arrancar y frenan al llegar.
  function easeInOutQuad(tn){
    return tn<0.5 ? 2*tn*tn : 1-2*(1-tn)*(1-tn);
  }
  window.applyFrame = function(t, useEasing){
    const tr=activeTracks();if(!tr)return;
    const D=curDuration();
    // Mezclar 55% lineal + 45% eased: sutil pero se nota (acelera al inicio, frena al final)
    let tEff=t;
    if(useEasing && D>200){
      const tn=t/D;
      tEff=(0.55*tn + 0.45*easeInOutQuad(tn))*D;
    }
    const LOOK=60; // ms lookback para calcular velocidad
    for(const p of S.players){
      const kf=tr[p.id];
      if(kf&&kf.length){
        const q=posAt(kf,tEff);
        const qPrev=posAt(kf,Math.max(0,tEff-LOOK));
        p.prevX=p.x; p.prevY=p.y;
        p.x=q.x; p.y=q.y;
        p.vx=q.x-qPrev.x; p.vy=q.y-qPrev.y;
        p.spd=Math.hypot(p.vx,p.vy);
      }
    }
    draw();
    const sc=document.getElementById('scrub');
    const pct=D?t/D*1000:0; // la barra muestra tiempo lineal (natural al scrollear)
    sc.value=pct;sc.style.setProperty('--fill',(pct/10)+'%');
    document.getElementById('tCur').textContent=(t/1000).toFixed(1)+'s';
  };
  function loop(now){
    if(S.mode!=='play')return;
    const dt=now-S.lastFrame;S.lastFrame=now;
    S.playT+=dt*S.speed;
    const D=curDuration();
    if(S.playT>=D){
      if(S.loop){
        S.playT=0;applyFrame(0,true);requestAnimationFrame(loop);return;
      }
      S.playT=D;applyFrame(D,true);setMode('idle');
      document.getElementById('bPlayL').textContent='Repetir';
      return;
    }
    applyFrame(S.playT,true);
    requestAnimationFrame(loop);
  }
  window.play = function(){
    if(!hasPlay())return;
    if(S.mode==='pause'){setMode('play');S.lastFrame=performance.now();requestAnimationFrame(loop);return}
    if(S.playT>=curDuration())S.playT=0;
    setMode('play');S.lastFrame=performance.now();requestAnimationFrame(loop);
  };
  window.pause = function(){if(S.mode==='play')setMode('pause')};
  window.stopPlay = function(){S.playT=0;applyFrame(0);setMode('idle')};
  window.hasPlay = function(){return curDuration()>0&&!!activeTracks()};

  // Scrub
  const scrub=document.getElementById('scrub');
  scrub.addEventListener('input',()=>{
    if(!hasPlay())return;
    if(S.mode==='play')setMode('pause');
    S.playT=scrub.value/1000*curDuration();
    applyFrame(S.playT);
  });
})();
