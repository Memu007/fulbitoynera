// Event handlers de input sobre el canvas de Pizarra Pro
// Expone funciones en window. Depende de S, cv, W, H, draw, playerR, pushFx, etc.

(function(){
  function ptr(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/W,y:(e.clientY-r.top)/H}}
  window.ballObj = function(){return S.players.find(p=>p.ball)};
  function attachR(){return (playerR()*2.4)/W}
  window.nearestPlayer = function(x,y,r){
    let best=null,bd=r;
    for(const p of S.players){
      if(p.ball)continue;
      const d=Math.hypot(p.x-x,p.y-y);
      if(d<bd){bd=d;best=p}
    }
    return best;
  };
  // offset de la pelota respecto al jugador que la posee (en su propio campo de coordenadas 0..1)
  // La pelota queda adelante del jugador, hacia el arco rival.
  window.ballAtFoot = function(pl){
    const dxN=0, dyN=playerR()*1.25/H*(pl.team==='blue'?-1:1);
    return{x:clamp(pl.x+dxN,0.02,0.98),y:clamp(pl.y+dyN,0.02,0.98)};
  };
  window.attachBall = function(pl){
    if(!pl||pl.ball)return;
    const same=S.carrier===pl.id;
    S.carrier=pl.id;
    const b=ballObj(),o=ballAtFoot(pl);
    b.x=o.x;b.y=o.y;
    if(S.mode==='rec')addKey(b);
    if(!same)toast('⚽ La lleva '+(pl.team==='blue'?'Azul':'Rojo')+' '+(pl.name||pl.num));
    draw();
  };
  function hit(pos){
    const b=ballObj();
    const rB=(playerR()*0.62)/W*2.6; // agarre generoso para la pelota
    const rP=playerR()/W*1.7;
    // si hay un jugador MUY cerca del toque, gana (edición)
    let best=null,bd=rP;
    for(const p of S.players){
      if(p.ball)continue;
      const d=Math.hypot(p.x-pos.x,p.y-pos.y);
      if(d<bd){best=p;bd=d}
    }
    const dB=Math.hypot(b.x-pos.x,b.y-pos.y);
    if(dB<rB){
      // tocás la pelota: si no hay dueño, o el toque es justo sobre ella (no sobre un jugador), la agarrás
      if(!best || dB<bd*0.8) return b;
    }
    return best;
  }

  let _longPressT=null,_lpStart=null;
  function clearLongPress(){if(_longPressT){clearTimeout(_longPressT);_longPressT=null}}
  function endPtr(){
    clearLongPress();_lpStart=null;
    if(S.drawMode&&S.curStroke){
      if(S.curStroke.pts.length>2)S.drawings.push(S.curStroke);
      S.curStroke=null;draw();if(typeof scheduleDraftSave==='function')scheduleDraftSave();return;
    }
    const d=S.dragging;
    if(d){
      if(d.ball){ // pelota soltada sobre un jugador → se la asignás (pase recibido)
        const tgt=nearestPlayer(d.x,d.y,attachR());
        if(tgt)attachBall(tgt);
      }else if(!S.carrier){ // jugador que pisa una pelota suelta, la toma
        const b=ballObj();
        if(Math.hypot(b.x-d.x,b.y-d.y)<attachR())attachBall(d);
      }
      if(S.mode==='rec'){
        addKey(d);
        if(S.carrier===d.id)addKey(ballObj());
      }
    }
    S.dragging=null;S.curFx=null;draw();if(typeof scheduleDraftSave==='function')scheduleDraftSave();
  }

  cv.addEventListener('pointerdown',e=>{
    const pos=ptr(e);
    if(S.drawMode){
      S.curStroke={color:S.drawColor,pts:[pos]};
      cv.setPointerCapture(e.pointerId);draw();return;
    }
    if(S.mode==='play')return;
    const p=hit(pos);
    if(p){
      // doble-tap en jugador → pelota vuela a su pie (rápido, sin arrastrar)
      const now=performance.now();
      if(!p.ball&&S.lastTap.id===p.id&&now-S.lastTap.t<320){
        S.lastTap={t:0,id:null};
        clearLongPress();
        attachBall(p);
        // si está grabando, ya se registró el key en attachBall
        return;
      }
      S.lastTap={t:now,id:p.id};
      S.dragging=p;S.curFx=null;cv.setPointerCapture(e.pointerId);
      if(S.mode==='rec'){pushUndo();addKey(p)}
      // long-press (500ms sin moverse) → editar jugador
      _lpStart={x:pos.x,y:pos.y,id:p.id};
      clearLongPress();
      _longPressT=setTimeout(()=>{
        if(S.dragging===p){
          S.dragging=null;
          openPlayerEdit(p);
          draw();
        }
      },500);
      draw();
    }
  });
  cv.addEventListener('pointermove',e=>{
    const pos=ptr(e);
    if(S.drawMode&&S.curStroke){
      const lp=S.curStroke.pts[S.curStroke.pts.length-1];
      if(Math.hypot(pos.x-lp.x,pos.y-lp.y)>0.006)S.curStroke.pts.push(pos);
      draw();return;
    }
    // cancelar long-press si se mueve más de un umbral
    if(_lpStart&&Math.hypot(pos.x-_lpStart.x,pos.y-_lpStart.y)>0.012){clearLongPress();_lpStart=null}
    if(!S.dragging)return;
    const d=S.dragging;
    if(d.ball&&S.carrier)S.carrier=null; // tomar la pelota del pie = empieza un pase
    d.x=clamp(pos.x,0.02,0.98);
    d.y=clamp(pos.y,0.02,0.98);
    if(S.carrier===d.id){ // lleva la pelota pegada al pie (parent-child: SIEMPRE recalculada desde el jugador)
      const b=ballObj(),o=ballAtFoot(d);
      b.x=o.x;b.y=o.y;
      if(S.mode==='rec')addKey(b,true);
    } else if(!d.ball){
      // jugador moviéndose SIN la pelota: si la pisa (pelota suelta), la toma al instante
      const b=ballObj();
      if(Math.hypot(b.x-d.x,b.y-d.y)<attachR()*0.9 && S.mode!=='play'){
        attachBall(d);
      }
    }
    if(S.mode==='rec')addKey(d,true);
    else pushFx(d);
    draw();
  });
  cv.addEventListener('pointerup',endPtr);
  cv.addEventListener('pointercancel',endPtr);
})();
