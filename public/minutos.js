// Control de minutos (inferiores)
// Plantel standalone: [{id,name,num,playedMs,active}], partido: {running,startMs,elapsed}
// Los guests pueden usarlo en memoria pero no persistir. Los usuarios logueados guardan en servidor.
(function(){

S.roster = [];
S.match = { running: false, startMs: 0, elapsed: 0 };
let _matchTick = null;
let _persisting = false;
let _pendingPersist = false;

async function fetchRoster(){
  if(isGuest()){ S.roster=[]; S.match={running:false,startMs:0,elapsed:0}; return; }
  try{
    const res = await fetch('/api/equipo',{credentials:'include'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    if(data.roster){
      const o = JSON.parse(data.roster);
      S.roster = o.roster || [];
    }
    if(data.match){
      const m = JSON.parse(data.match);
      S.match = m || {running:false,startMs:0,elapsed:0};
    }
  }catch(e){
    console.error('Error cargando plantel del servidor',e);
    S.roster=[]; S.match={running:false,startMs:0,elapsed:0};
  }
}

async function persistRoster(){
  if(isGuest()) return; // guests usan en memoria, no persisten
  // Evitar race condition: si hay un guardado en curso, encolar el último
  if(_persisting){
    _pendingPersist = true;
    return;
  }
  _persisting = true;
  _pendingPersist = false;
  try{
    await fetch('/api/equipo',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify({
        roster: JSON.stringify({roster:S.roster}),
        match: JSON.stringify(S.match)
      })
    });
  }catch(e){ console.error('Error guardando plantel en servidor',e); }
  finally{
    _persisting = false;
    if(_pendingPersist) await persistRoster();
  }
}

function tickMatch(){
  if(!S.match.running) return;
  // acumular tiempo a los jugadores activos
  const now = performance.now();
  const dt = now - S.match.startMs;
  S.match.startMs = now;
  for(const p of S.roster){ if(p.active) p.playedMs += dt; }
  persistRoster();
  // refrescar solo el reloj y los minutos (no re-render todo)
  const clock = document.getElementById('matchClock');
  if(clock){
    let total = S.match.elapsed;
    for(const p of S.roster) total += p.playedMs;
    clock.textContent = fmtMin(total);
  }
  document.querySelectorAll('.rosterItem').forEach(el=>{
    const id = el.dataset.pid;
    const p = S.roster.find(x=>x.id===id);
    if(p) el.querySelector('.min').textContent = fmtMin(p.playedMs);
  });
}

function renderMinutes(){
  const body = document.getElementById('minutesBody');
  let total = S.match.elapsed;
  for(const p of S.roster) total += p.playedMs;
  const active = S.roster.filter(p=>p.active).length;
  // calcular equidad
  const avg = S.roster.length ? total / S.roster.length : 0;
  const sorted = [...S.roster].sort((a,b)=>a.playedMs-b.playedMs);
  const lowest = sorted[0];
  let html = '<div id="matchTimer">';
  html += '<div class="clock" id="matchClock">'+fmtMin(total)+'</div>';
  html += '<div class="lbl">Tiempo de partido · '+active+' en cancha</div>';
  html += '<div class="btns">';
  html += '<button class="primary" id="mStart">'+(S.match.running?'⏸ Pausar':'▶ Iniciar')+'</button>';
  html += '<button id="mShare" style="background:var(--accent);color:#0E1416;border:none">📤 WhatsApp</button>';
  html += '<button id="mReset" class="danger">↺ Reset</button>';
  html += '</div></div>';
  // sugerencia de equidad
  if(S.roster.length > 1 && total > 30000){
    const ratio = lowest.playedMs / avg;
    if(ratio < 0.6){
      html += '<div class="fairnessHint warn">⚠️ '+esc(lowest.name||('#'+lowest.num))+' jugó poco ('+fmtMin(lowest.playedMs)+'). Dale minutos ahora.</div>';
    } else {
      html += '<div class="fairnessHint">✓ Minutos equitativos. Buen trabajo.</div>';
    }
  }
  // lista de jugadores
  if(S.roster.length === 0){
    html += '<p class="empty">Cargá tu plantel abajo. Después tocá ▶ Iniciar y marcá quién entra/sale durante el partido.</p>';
  } else {
    html += '<div class="secTitle">PLANTEL (tocá para entrar/salir)</div>';
    for(const p of [...S.roster].sort((a,b)=>b.playedMs-a.playedMs)){
      const ratio = avg > 0 ? p.playedMs / avg : 1;
      let badge = '';
      if(total > 20000){
        if(ratio < 0.5) badge = '<span class="badge low">POCO</span>';
        else if(ratio < 0.85) badge = '<span class="badge warn">BAJO</span>';
        else badge = '<span class="badge ok">OK</span>';
      }
      html += '<div class="rosterItem'+(p.active?' active':'')+'" data-pid="'+p.id+'">';
      html += '<span class="sw"></span>';
      html += '<span class="num">'+(p.num||'?')+'</span>';
      html += '<span class="name">'+esc(p.name||('Jugador '+(p.num||'')))+'</span>';
      html += badge;
      html += '<span class="min">'+fmtMin(p.playedMs)+'</span>';
      html += '<button class="del" data-del="'+p.id+'">✕</button>';
      html += '</div>';
    }
  }
  // agregar jugador
  html += '<div class="secTitle" style="margin-top:14px">AGREGAR JUGADOR</div>';
  html += '<div class="addPlayerRow">';
  html += '<input type="text" id="newPlName" placeholder="Nombre (ej: Juani)" maxlength="14">';
  html += '<input type="number" id="newPlNum" placeholder="N°" min="0" max="99" style="max-width:70px;margin:0">';
  html += '<button id="addPlBtn">+</button>';
  html += '</div>';
  html += '<p class="hint">'+(isGuest()?'Probá el control de minutos. Registrate para guardar el plantel.':'Los minutos se guardan solos. Si salís de la app, al volver seguís donde dejaste.')+'</p>';
  body.innerHTML = html;
  // events
  document.getElementById('mStart').onclick = ()=>{
    if(S.match.running){
      S.match.running = false;
      clearInterval(_matchTick);
    } else {
      S.match.running = true;
      S.match.startMs = performance.now();
      _matchTick = setInterval(tickMatch,1000);
    }
    persistRoster();
    renderMinutes();
  };
  document.getElementById('mShare').onclick = ()=>{
    if(S.roster.length === 0){ toast('Cargá jugadores antes de compartir'); return; }
    // Pausar el timer para que los minutos no cambien al compartir
    const wasRunning = S.match.running;
    if(wasRunning){ document.getElementById('mStart').click(); }
    // Generar texto plano para WhatsApp
    let txt = '*⏱️ Minutos jugados*\n';
    txt += ' Partido: '+fmtMin(S.roster.reduce((a,p)=>a+p.playedMs,0))+'\n\n';
    const sorted = [...S.roster].sort((a,b)=>b.playedMs-a.playedMs);
    for(const p of sorted){
      const name = p.name || ('Jugador '+(p.num||'?'));
      const min = fmtMin(p.playedMs);
      const ratio = S.roster.length > 0 ? p.playedMs / (S.roster.reduce((a,x)=>a+x.playedMs,0)/S.roster.length || 1) : 1;
      const mark = ratio < 0.5 ? '🔴' : ratio < 0.85 ? '🟡' : '🟢';
      txt += mark+' #'+(p.num||'?')+' '+name+': '+min+'\n';
    }
    txt += '\n_Pizarra Pro_';
    // WhatsApp: usar wa.me si hay app, si no copiar al portapapeles
    const waUrl = 'https://wa.me/?text='+encodeURIComponent(txt);
    if(navigator.share){
      navigator.share({title:'Minutos jugados',text}).catch(()=>{ window.open(waUrl,'_blank'); });
    } else {
      navigator.clipboard.writeText(txt).then(()=>{
        toast('📋 Copiado — abriendo WhatsApp...');
        setTimeout(()=>window.open(waUrl,'_blank'),500);
      }).catch(()=>{ window.open(waUrl,'_blank'); });
    }
  };
  document.getElementById('mReset').onclick = ()=>{
    if(!confirm('¿Resetear todos los minutos a 0?')) return;
    S.match.running = false; S.match.elapsed = 0; clearInterval(_matchTick);
    for(const p of S.roster){ p.playedMs = 0; p.active = false; }
    persistRoster(); renderMinutes();
  };
  document.getElementById('addPlBtn').onclick = ()=>{
    const name = document.getElementById('newPlName').value.trim().slice(0,14);
    const num = parseInt(document.getElementById('newPlNum').value) || S.roster.length+1;
    S.roster.push({id:'p'+Date.now(),name,num,playedMs:0,active:false});
    persistRoster(); renderMinutes();
    setTimeout(()=>{ const i=document.getElementById('newPlName'); if(i) i.focus(); },100);
  };
  body.querySelectorAll('.rosterItem').forEach(el=>{
    el.onclick = (e)=>{
      if(e.target.dataset.del){
        const id = e.target.dataset.del;
        S.roster = S.roster.filter(p=>p.id!==id);
        persistRoster(); renderMinutes(); return;
      }
      const p = S.roster.find(x=>x.id===el.dataset.pid);
      if(p){ p.active=!p.active; persistRoster(); renderMinutes(); }
    };
  });
}

// Expose
window.fetchRoster = fetchRoster;
window.persistRoster = persistRoster;
window.renderMinutes = renderMinutes;

})();
