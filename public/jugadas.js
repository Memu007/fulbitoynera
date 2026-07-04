// Guardar, cargar, listar y duplicar jugadas
(function(){

const SAVED_KEY = 'pizarraPro.saved.v1';

function loadSaved(){
  try{
    const r = localStorage.getItem(SAVED_KEY);
    if(r) S.saved = JSON.parse(r);
  }catch(e){}
}
function persistSaved(){
  try{
    localStorage.setItem(SAVED_KEY, JSON.stringify(S.saved));
  }catch(e){}
}

async function fetchSaved(){
  S.saved = [];
  loadSaved();
  if(isGuest()) return;
  try{
    const res = await fetch('/api/jugadas',{credentials:'include'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    if(Array.isArray(data)){
      S.saved = data.map(j=>{
        let parsed;
        try{ parsed = JSON.parse(j.data); }catch(e){ parsed = {}; }
        return {
          id: j.id,
          name: j.nombre,
          game: parseInt(j.gameType.replace('F','')) || 5,
          t1: parsed.t1 || 5,
          t2: parsed.t2 || 5,
          f1: parsed.f1 || '1-2-1',
          f2: parsed.f2 || '1-2-1',
          duration: j.duration,
          tracks: parsed.tracks || {},
          drawings: parsed.drawings || [],
          meta: parsed.meta || {}
        };
      });
      persistSaved();
    }
  }catch(e){ console.error('Error cargando jugadas del servidor',e); }
}

function renderPlays(){
  const list = document.getElementById('playsList');
  list.innerHTML = '';
  if(!S.saved.length){
    list.innerHTML = '<div class="empty">Todavía no guardaste jugadas.<br>Grabá una y tocá 💾 Guardar.</div>';
    return;
  }
  S.saved.forEach((pl,i)=>{
    const el = document.createElement('div');
    el.className = 'playItem';
    el.innerHTML = `<span style="font-size:21px">📋</span>
      <span class="tx"><b>${esc(pl.name)}</b><small>F${pl.game} · ${pl.t1}v${pl.t2} · ${(pl.duration/1000).toFixed(1)}s</small></span>
      <button class="miniBtn" data-a="d" data-i="${i}" title="Duplicar">⧉</button>
      <button class="miniBtn" data-a="l" data-i="${i}">Cargar</button>
      <button class="miniBtn warn" data-a="x" data-i="${i}">✕</button>`;
    list.appendChild(el);
  });
  list.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const i = +b.dataset.i;
    if(b.dataset.a === 'x'){
      if(S.saved[i].id){
        fetch('/api/jugadas/'+S.saved[i].id,{method:'DELETE',credentials:'include'}).catch(()=>{});
      }
      S.saved.splice(i,1); persistSaved(); renderPlays(); toast('Jugada eliminada');
    }
    else if(b.dataset.a === 'd'){
      const orig = S.saved[i];
      const copy = JSON.parse(JSON.stringify(orig));
      copy.name = (orig.name||'Jugada')+' (copia)';
      copy.id = null;
      S.saved.push(copy);
      persistSaved(); renderPlays();
      toast('⧉ Duplicada: '+copy.name+' — cargala para editar');
    }
    else loadPlay(i);
  });
}

function loadPlay(i){
  const pl = S.saved[i];
  discardPreview(true);
  S.game = pl.game; S.team1 = pl.t1; S.team2 = pl.t2; S.form1 = pl.f1; S.form2 = pl.f2;
  syncGameSeg(); buildPlayers();
  S.players.forEach(p=>{
    const m = pl.meta[p.id];
    if(m){ p.name=m.name; p.num=m.num; if(m.photo) p.photo=m.photo; else p.photo=null; }
  });
  S.tracks = JSON.parse(JSON.stringify(pl.tracks));
  S.duration = pl.duration;
  S.drawings = JSON.parse(JSON.stringify(pl.drawings||[]));
  S.carrier = null; S.fx = [];
  S.playT = 0; resize(); applyFrame(0); setMode('idle'); closeSheets();
  toast('Cargada: '+pl.name);
}

// Handler del botón guardar
document.getElementById('saveOk').onclick = ()=>{
  if(!canSavePlay()){
    closeSheets();
    toast('🔒 Alcanzaste el límite de 3 jugadas en FREE — pasá a PRO');
    setTimeout(()=>openSheet('shPlans'),300);
    return;
  }
  const name = document.getElementById('playName').value.trim() || 'Jugada '+(S.saved.length+1);
  const meta = {};
  S.players.forEach(p=>meta[p.id]={name:p.name,num:p.num,photo:p.photo||null});
  const playData = {
    name, game:S.game, t1:S.team1, t2:S.team2, f1:S.form1, f2:S.form2,
    duration:S.duration,
    tracks:JSON.parse(JSON.stringify(S.tracks)),
    drawings:JSON.parse(JSON.stringify(S.drawings)),
    meta
  };
  S.saved.push(playData);
  persistSaved();
  // Persistir en servidor si está logueado
  if(!isGuest()){
    fetch('/api/jugadas',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify({
        nombre:name,
        gameType:'F'+S.game,
        duration:S.duration,
        data:JSON.stringify(playData)
      })
    }).then(res=>res.json()).then(j=>{ playData.id=j.id; }).catch(e=>console.error('Error guardando en servidor',e));
  }
  document.getElementById('playName').value='';
  closeSheets(); toast('💾 Guardada: '+name);
};

// Expose
window.fetchSaved = fetchSaved;
window.renderPlays = renderPlays;
window.loadPlay = loadPlay;

})();
