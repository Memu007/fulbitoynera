// Preview IA, demo de jugadas y plantillas
(function(){

// ---- Preview IA ----
async function previewComplete(){
  if(!Object.keys(S.tracks).length || S.duration <= 0){ toast('Primero grabá una jugada'); return; }
  if(!await ensureCanUseAI()){
    closeSheets();
    toast('🧠 Usaste tu IA gratis de hoy — pasá a PRO para ilimitada');
    setTimeout(()=>openSheet('shPlans'),300);
    return;
  }
  registerAIUse();
  const res = completePlay(S.tracks, S.duration, S.aiStyle, S.attTeam);
  S.preview = { tracks:res.tracks, duration:S.duration };
  S.prevShow = 'ai';
  closeSheets(); updatePrevSeg();
  document.getElementById('pAI').classList.add('show');
  document.getElementById('btnRow').style.display = 'none';
  document.getElementById('aiBar').classList.add('show');
  stopPlay(); applyFrame(0); play();
  toast('✨ Ataca '+(res.att==='blue'?'AZUL 🔵':'ROJO 🔴')+' — compará y aplicá');
  updateUI();
}
function applyPreview(){
  if(!S.preview) return;
  S.tracks = S.preview.tracks; S.duration = S.preview.duration;
  discardPreview(true);
  stopPlay(); toast('✓ Mejora aplicada a tu jugada'); updateUI();
}
function finishPrevUI(){
  document.getElementById('pAI').classList.remove('show');
  document.getElementById('aiBar').classList.remove('show');
  document.getElementById('btnRow').style.display = 'flex';
  updateUI();
}
function updatePrevSeg(){
  document.getElementById('aiSeeOrig').classList.toggle('on', S.prevShow==='orig');
  document.getElementById('aiSeeAI').classList.toggle('on', S.prevShow==='ai');
}

// ---- Jugada de ejemplo ----
function demoPlay(){
  discardPreview(true);
  buildPlayers(true); applyFormationsQuiet();
  const D = 6200, side = Math.random() < 0.5 ? -1 : 1;
  const sx = 0.5 + side * 0.34;
  const tr = {};
  for(const p of S.players) tr[p.id] = [{t:0,x:p.x,y:p.y}];
  const ball = tr['ball'];
  ball.length = 0;
  ball.push(
    {t:0,x:.5,y:.58},
    {t:900,x:.5,y:.50},
    {t:2300,x:clamp(sx+side*0.08,0.08,0.92),y:.38},
    {t:3300,x:clamp(sx+side*0.10,0.06,0.94),y:.26},
    {t:4400,x:.52,y:.15},
    {t:5400,x:.5,y:.055}
  );
  const blues = S.players.filter(p=>p.team==='blue' && !p.gk);
  let wing = blues.reduce((a,b)=>(side>0 ? b.x>a.x : b.x<a.x) ? b : a, blues[0]);
  let str = blues.filter(p=>p!==wing).reduce((a,b)=>b.y<a.y?b:a, blues.filter(p=>p!==wing)[0] || blues[0]);
  if(wing){ const k=tr[wing.id]; k.push({t:2400,x:clamp(sx+side*0.12,0.06,0.94),y:.40},{t:3600,x:clamp(sx+side*0.13,0.05,0.95),y:.24}); }
  if(str && str!==wing){ const k=tr[str.id]; k.push({t:2600,x:.5,y:.30},{t:4600,x:.53,y:.16},{t:5300,x:.5,y:.10}); }
  for(const id in tr){ const k=tr[id], l=k[k.length-1]; if(l.t<D) k.push({t:D,x:l.x,y:l.y}); }
  const full = completePlay(tr,D,S.aiStyle,'blue').tracks;
  S.tracks = tr; S.duration = D;
  S.preview = { tracks:full, duration:D };
  S.prevShow = 'ai'; updatePrevSeg();
  closeSheets();
  document.getElementById('pAI').classList.add('show');
  document.getElementById('btnRow').style.display = 'none';
  document.getElementById('aiBar').classList.add('show');
  stopPlay(); applyFrame(0); play();
  toast('🎲 Jugada de ejemplo (estilo '+STYLES.find(s=>s.id===S.aiStyle).n.toLowerCase()+')');
  updateUI();
}

// ---- Plantillas de jugadas ----
function renderTemplates(){
  const list = document.getElementById('templatesList');
  if(typeof PLAYS_TEMPLATES === 'undefined'){
    list.innerHTML = '<p class="empty">No se pudieron cargar las plantillas.</p>';
    return;
  }
  // Agrupar por categoría
  const byCat = {};
  PLAYS_TEMPLATES.forEach(t=>{ (byCat[t.cat]=byCat[t.cat]||[]).push(t); });
  let html = '<p class="hint" style="text-align:left;padding:0 4px 14px">Cargá una jugada lista para ver, editar o guardar.</p>';
  for(const cat in byCat){
    html += `<div class="secTitle">${esc(cat)}</div>`;
    byCat[cat].forEach(t=>{
      html += `<div class="opt" data-tpl="${t.id}" style="cursor:pointer">
        <span class="ic" style="background:${t.att==='blue'?'#3B82F622':'#EF444422'}">${t.att==='blue'?'🔵':'🔴'}</span>
        <span class="tx"><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></span>
        <span class="ck" style="opacity:1">▶</span>
      </div>`;
    });
  }
  html += '<p class="hint" style="margin-top:14px">Las plantillas cargan en su modalidad (F5, F8 o F11). Podés editarlas, pasarlas a IA o guardarlas.</p>';
  list.innerHTML = html;
  list.querySelectorAll('.opt').forEach(el=>{
    el.onclick = ()=>loadTemplate(el.dataset.tpl);
  });
}
function loadTemplate(id){
  const t = PLAYS_TEMPLATES.find(p=>p.id===id);
  if(!t){ toast('Plantilla no encontrada'); return; }
  closeSheets();
  // Cambiar al game de la plantilla si no coincide
  if(S.game !== t.game){
    S.game = t.game; S.team1 = t.game; S.team2 = t.game;
    S.form1 = t.game===5 ? '1-2-1' : t.game===8 ? '3-3-1' : '4-3-3';
    S.form2 = S.form1;
    syncGameSeg(); buildPlayers();
  } else {
    buildPlayers(true);
    applyFormationsQuiet();
  }
  discardPreview(true);
  // Construir tracks completas: los jugadores que no están en la plantilla quedan quietos
  S.tracks = {};
  for(const p of S.players){
    if(t.tracks[p.id]){
      S.tracks[p.id] = JSON.parse(JSON.stringify(t.tracks[p.id]));
    } else {
      S.tracks[p.id] = [{t:0,x:p.x,y:p.y},{t:t.duration,x:p.x,y:p.y}];
    }
  }
  S.duration = t.duration;
  S.playT = 0;
  S.carrier = null; S.fx = []; S.drawings = [];
  setMode('idle');
  resize(); applyFrame(0);
  // Auto-reproducir
  setTimeout(()=>{ play(); },400);
  toast('🎴 '+t.name+' — reproduciendo');
}

// Handlers de botones de IA
document.getElementById('aiComplete').onclick = previewComplete;
document.getElementById('aiDemo').onclick = demoPlay;

// Expose
window.previewComplete = previewComplete;
window.applyPreview = applyPreview;
window.finishPrevUI = finishPrevUI;
window.updatePrevSeg = updatePrevSeg;
window.demoPlay = demoPlay;
window.renderTemplates = renderTemplates;
window.loadTemplate = loadTemplate;

})();
