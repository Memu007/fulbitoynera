// Compartir jugada por link y exportar a GIF
(function(){

function sharePlay(){
  if(!hasPlay()){ toast('Grabá una jugada antes de compartir'); return; }
  if(S.plan !== 'pro'){
    closeSheets();
    toast('🔒 Compartir por link es PRO — pasate y compartí con tu plantel');
    setTimeout(()=>openSheet('shPlans'),300);
    return;
  }
  // Codificar la jugada en base64 para embeber en el URL (sin backend)
  const meta = {};
  S.players.forEach(p=>meta[p.id]={name:p.name,num:p.num,photo:p.photo||null});
  const payload = {
    n:'Jugada compartida',
    g:S.game, t1:S.team1, t2:S.team2, f1:S.form1, f2:S.form2,
    d:S.duration,
    t:S.tracks,
    dr:S.drawings||[],
    m:meta
  };
  try{
    const json = JSON.stringify(payload);
    // Usar btoa con UTF-8 safe
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const url = location.origin + '/pizarra-pro.html?play='+b64;
    if(navigator.share){
      navigator.share({title:'Pizarra Pro — Jugada táctica', text:'Mirá esta jugada:', url}).catch(()=>{});
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(url).then(()=>{
        toast('🔗 Link copiado — pegalo en WhatsApp');
      }).catch(()=>{
        // Fallback del fallback: mostrar input
        prompt('Copiá este link:',url);
      });
    }
  }catch(e){
    toast('No pudimos generar el link (jugada muy grande)');
  }
}

// Al cargar, si hay ?play= en el URL, cargar la jugada compartida
function loadSharedPlay(){
  const params = new URLSearchParams(location.search);
  const playData = params.get('play');
  if(!playData) return false;
  try{
    const json = decodeURIComponent(escape(atob(playData)));
    const p = JSON.parse(json);
    discardPreview(true);
    S.game = p.g || 5; S.team1 = p.t1 || 5; S.team2 = p.t2 || 5;
    S.form1 = p.f1 || '1-2-1'; S.form2 = p.f2 || '1-2-1';
    syncGameSeg(); buildPlayers();
    if(p.m) S.players.forEach(pl=>{ const m=p.m[pl.id]; if(m){ pl.name=m.name||''; pl.num=m.num||pl.num; } });
    S.tracks = p.t || {}; S.duration = p.d || 0; S.drawings = p.dr || [];
    S.carrier = null; S.fx = []; S.playT = 0;
    resize(); applyFrame(0); setMode('idle');
    // Auto-reproducir la jugada compartida
    setTimeout(()=>{ play(); },500);
    toast('🔗 Jugada compartida cargada — reproduciendo');
    return true;
  }catch(e){
    toast('No pudimos cargar la jugada compartida');
    return false;
  }
}

function exportGIF(){
  if(typeof GIF === 'undefined'){ toast('No pude cargar el codificador GIF. Revisá tu conexión.'); return; }
  if(!hasPlay()){ toast('Grabá una jugada primero'); return; }
  if(S.mode === 'play') setMode('pause');
  const D = curDuration();
  const fps = 14, N = Math.max(2, Math.min(Math.round(D/1000*fps), 100));
  const scale = Math.min(1, 360/W);
  const w = Math.round(W*scale), h = Math.round(H*scale);
  const gif = new GIF({ workers:1, quality:12, width:w, height:h, workerScript:'/gif.worker.js' });
  const saved = S.players.map(p=>({id:p.id,x:p.x,y:p.y}));
  const savedT = S.playT;
  const tmp = document.createElement('canvas');
  tmp.width = w; tmp.height = h;
  const tctx = tmp.getContext('2d');
  for(let i=0; i<N; i++){
    const t = D*(i/(N-1||1));
    applyFrame(t,true); // easing para que el GIF se vea igual que la reproducción
    tctx.drawImage(cv,0,0,w,h);
    gif.addFrame(tmp,{delay:Math.round(1000/fps)});
  }
  S.players.forEach(p=>{ const s=saved.find(q=>q.id===p.id); if(s){ p.x=s.x; p.y=s.y; } });
  S.playT = savedT;
  if(S.mode === 'pause' || S.mode === 'idle') applyFrame(savedT);
  toast('🎬 Generando GIF… tardá unos segundos');
  gif.on('finished', blob=>{
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = 'pizarra-pro-jugada.gif';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    toast('🎬 GIF listo — descargado');
  });
  gif.render();
}

// Expose
window.sharePlay = sharePlay;
window.loadSharedPlay = loadSharedPlay;
window.exportGIF = exportGIF;

})();
