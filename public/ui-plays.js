// Entry point vacío: funcionalidad migrada a minutos.js, jugadas.js, preview-ia.js, compartir.js
// Los módulos anteriores ya exponen todo en window.

(function(){
return;

// ---- Preview IA ----
function previewComplete(){
  if(!Object.keys(S.tracks).length||S.duration<=0){toast('Primero grabá una jugada');return}
  if(!canUseAI()){
    closeSheets();
    toast('🧠 Usaste tu IA gratis de hoy — pasá a PRO para ilimitada');
    setTimeout(()=>openSheet('shPlans'),300);
    return;
  }
  registerAIUse();
  const res=completePlay(S.tracks,S.duration,S.aiStyle,S.attTeam);
  S.preview={tracks:res.tracks,duration:S.duration};
  S.prevShow='ai';
  closeSheets();updatePrevSeg();
  document.getElementById('pAI').classList.add('show');
  document.getElementById('btnRow').style.display='none';
  document.getElementById('aiBar').classList.add('show');
  stopPlay();applyFrame(0);play();
  toast('✨ Ataca '+(res.att==='blue'?'AZUL 🔵':'ROJO 🔴')+' — compará y aplicá');
  updateUI();
}
function applyPreview(){
  if(!S.preview)return;
  S.tracks=S.preview.tracks;S.duration=S.preview.duration;
  discardPreview(true);
  stopPlay();toast('✓ Mejora aplicada a tu jugada');updateUI();
}
function finishPrevUI(){
  document.getElementById('pAI').classList.remove('show');
  document.getElementById('aiBar').classList.remove('show');
  document.getElementById('btnRow').style.display='flex';
  updateUI();
}
function updatePrevSeg(){
  document.getElementById('aiSeeOrig').classList.toggle('on',S.prevShow==='orig');
  document.getElementById('aiSeeAI').classList.toggle('on',S.prevShow==='ai');
}

// ---- Jugada de ejemplo ----
function demoPlay(){
  discardPreview(true);
  buildPlayers(true);applyFormationsQuiet();
  const D=6200,side=Math.random()<0.5?-1:1;
  const sx=0.5+side*0.34;
  const tr={};
  for(const p of S.players)tr[p.id]=[{t:0,x:p.x,y:p.y}];
  const ball=tr['ball'];
  ball.length=0;
  ball.push({t:0,x:.5,y:.58},{t:900,x:.5,y:.50},{t:2300,x:clamp(sx+side*0.08,0.08,0.92),y:.38},
    {t:3300,x:clamp(sx+side*0.10,0.06,0.94),y:.26},{t:4400,x:.52,y:.15},{t:5400,x:.5,y:.055});
  const blues=S.players.filter(p=>p.team==='blue'&&!p.gk);
  let wing=blues.reduce((a,b)=>(side>0?b.x>a.x:b.x<a.x)?b:a,blues[0]);
  let str=blues.filter(p=>p!==wing).reduce((a,b)=>b.y<a.y?b:a,blues.filter(p=>p!==wing)[0]||blues[0]);
  if(wing){const k=tr[wing.id];k.push({t:2400,x:clamp(sx+side*0.12,0.06,0.94),y:.40},{t:3600,x:clamp(sx+side*0.13,0.05,0.95),y:.24})}
  if(str&&str!==wing){const k=tr[str.id];k.push({t:2600,x:.5,y:.30},{t:4600,x:.53,y:.16},{t:5300,x:.5,y:.10})}
  for(const id in tr){const k=tr[id],l=k[k.length-1];if(l.t<D)k.push({t:D,x:l.x,y:l.y})}
  const full=completePlay(tr,D,S.aiStyle,'blue').tracks;
  S.tracks=tr;S.duration=D;
  S.preview={tracks:full,duration:D};
  S.prevShow='ai';updatePrevSeg();
  closeSheets();
  document.getElementById('pAI').classList.add('show');
  document.getElementById('btnRow').style.display='none';
  document.getElementById('aiBar').classList.add('show');
  stopPlay();applyFrame(0);play();
  toast('🎲 Jugada de ejemplo (estilo '+STYLES.find(s=>s.id===S.aiStyle).n.toLowerCase()+')');
  updateUI();
}

// ---- Guardar / cargar ----
const SAVED_KEY='pizarraPro.saved.v1';
function loadSaved(){try{const r=localStorage.getItem(SAVED_KEY);if(r)S.saved=JSON.parse(r)}catch(e){}}
function persistSaved(){try{localStorage.setItem(SAVED_KEY,JSON.stringify(S.saved))}catch(e){}}

async function fetchSaved(){
  S.saved=[];
  loadSaved();
  if(isGuest())return;
  try{
    const res=await fetch('/api/jugadas',{credentials:'include'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json();
    if(Array.isArray(data)){
      S.saved=data.map(j=>{
        let parsed;
        try{parsed=JSON.parse(j.data)}catch(e){parsed={}}
        return{
          id:j.id,name:j.nombre,game:parseInt(j.gameType.replace('F',''))||5,
          t1:parsed.t1||5,t2:parsed.t2||5,f1:parsed.f1||'1-2-1',f2:parsed.f2||'1-2-1',
          duration:j.duration,tracks:parsed.tracks||{},drawings:parsed.drawings||[],meta:parsed.meta||{}
        }
      });
      persistSaved();
    }
  }catch(e){console.error('Error cargando jugadas del servidor',e)}
}

function renderPlays(){
  const list=document.getElementById('playsList');list.innerHTML='';
  if(!S.saved.length){
    list.innerHTML='<div class="empty">Todavía no guardaste jugadas.<br>Grabá una y tocá 💾 Guardar.</div>';return;
  }
  S.saved.forEach((pl,i)=>{
    const el=document.createElement('div');el.className='playItem';
    el.innerHTML=`<span style="font-size:21px">📋</span>
      <span class="tx"><b>${esc(pl.name)}</b><small>F${pl.game} · ${pl.t1}v${pl.t2} · ${(pl.duration/1000).toFixed(1)}s</small></span>
      <button class="miniBtn" data-a="d" data-i="${i}" title="Duplicar">⧉</button>
      <button class="miniBtn" data-a="l" data-i="${i}">Cargar</button>
      <button class="miniBtn warn" data-a="x" data-i="${i}">✕</button>`;
    list.appendChild(el);
  });
  list.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i;
    if(b.dataset.a==='x'){
      if(S.saved[i].id){
        fetch('/api/jugadas/'+S.saved[i].id,{method:'DELETE',credentials:'include'}).catch(()=>{});
      }
      S.saved.splice(i,1);persistSaved();renderPlays();toast('Jugada eliminada');
    }
    else if(b.dataset.a==='d'){
      const orig=S.saved[i];
      const copy=JSON.parse(JSON.stringify(orig));
      copy.name=(orig.name||'Jugada')+' (copia)';
      copy.id=null;
      S.saved.push(copy);
      persistSaved();renderPlays();
      toast('⧉ Duplicada: '+copy.name+' — cargala para editar');
    }
    else loadPlay(i);
  });
}

function loadPlay(i){
  const pl=S.saved[i];
  discardPreview(true);
  S.game=pl.game;S.team1=pl.t1;S.team2=pl.t2;S.form1=pl.f1;S.form2=pl.f2;
  syncGameSeg();buildPlayers();
  S.players.forEach(p=>{const m=pl.meta[p.id];if(m){p.name=m.name;p.num=m.num;if(m.photo)p.photo=m.photo;else p.photo=null}});
  S.tracks=JSON.parse(JSON.stringify(pl.tracks));
  S.duration=pl.duration;S.drawings=JSON.parse(JSON.stringify(pl.drawings||[]));
  S.carrier=null;S.fx=[];
  S.playT=0;resize();applyFrame(0);setMode('idle');closeSheets();
  toast('Cargada: '+pl.name);
}

// Handler del botón guardar
document.getElementById('saveOk').onclick=()=>{
  if(!canSavePlay()){
    closeSheets();
    toast('🔒 Alcanzaste el límite de 3 jugadas en FREE — pasá a PRO');
    setTimeout(()=>openSheet('shPlans'),300);
    return;
  }
  const name=document.getElementById('playName').value.trim()||'Jugada '+(S.saved.length+1);
  const meta={};S.players.forEach(p=>meta[p.id]={name:p.name,num:p.num,photo:p.photo||null});
  const playData={name,game:S.game,t1:S.team1,t2:S.team2,f1:S.form1,f2:S.form2,
    duration:S.duration,tracks:JSON.parse(JSON.stringify(S.tracks)),
    drawings:JSON.parse(JSON.stringify(S.drawings)),meta};
  S.saved.push(playData);
  persistSaved();
  // Persistir en servidor si está logueado
  if(!isGuest()){
    fetch('/api/jugadas',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',
      body:JSON.stringify({nombre:name,gameType:'F'+S.game,duration:S.duration,data:JSON.stringify(playData)})
    }).then(res=>res.json()).then(j=>{playData.id=j.id}).catch(e=>console.error('Error guardando en servidor',e));
  }
  document.getElementById('playName').value='';
  closeSheets();toast('💾 Guardada: '+name);
};

// Handlers de preview IA (se mueven acá para asegurar que las funciones existan)
document.getElementById('aiComplete').onclick=previewComplete;
document.getElementById('aiDemo').onclick=demoPlay;

// ---- Plantillas de jugadas ----
function renderTemplates(){
  const list=document.getElementById('templatesList');
  if(typeof PLAYS_TEMPLATES==='undefined'){list.innerHTML='<p class="empty">No se pudieron cargar las plantillas.</p>';return}
  // Agrupar por categoría
  const byCat={};
  PLAYS_TEMPLATES.forEach(t=>{(byCat[t.cat]=byCat[t.cat]||[]).push(t)});
  let html='<p class="hint" style="text-align:left;padding:0 4px 14px">Cargá una jugada lista para ver, editar o guardar.</p>';
  for(const cat in byCat){
    html+=`<div class="secTitle">${esc(cat)}</div>`;
    byCat[cat].forEach(t=>{
      html+=`<div class="opt" data-tpl="${t.id}" style="cursor:pointer">
        <span class="ic" style="background:${t.att==='blue'?'#3B82F622':'#EF444422'}">${t.att==='blue'?'🔵':'🔴'}</span>
        <span class="tx"><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></span>
        <span class="ck" style="opacity:1">▶</span>
      </div>`;
    });
  }
  html+='<p class="hint" style="margin-top:14px">Las plantillas cargan en su modalidad (F5, F8 o F11). Podés editarlas, pasarlas a IA o guardarlas.</p>';
  list.innerHTML=html;
  list.querySelectorAll('.opt').forEach(el=>{
    el.onclick=()=>loadTemplate(el.dataset.tpl);
  });
}
function loadTemplate(id){
  const t=PLAYS_TEMPLATES.find(p=>p.id===id);
  if(!t){toast('Plantilla no encontrada');return}
  closeSheets();
  // Cambiar al game de la plantilla si no coincide
  if(S.game!==t.game){
    S.game=t.game;S.team1=t.game;S.team2=t.game;
    S.form1=t.game===5?'1-2-1':t.game===8?'3-3-1':'4-3-3';
    S.form2=S.form1;
    syncGameSeg();buildPlayers();
  } else {
    buildPlayers(true);
    applyFormationsQuiet();
  }
  discardPreview(true);
  // Construir tracks completas: los jugadores que no están en la plantilla quedan quietos
  S.tracks={};
  for(const p of S.players){
    if(t.tracks[p.id]){
      S.tracks[p.id]=JSON.parse(JSON.stringify(t.tracks[p.id]));
    } else {
      S.tracks[p.id]=[{t:0,x:p.x,y:p.y},{t:t.duration,x:p.x,y:p.y}];
    }
  }
  S.duration=t.duration;
  S.playT=0;
  S.carrier=null;S.fx=[];S.drawings=[];
  setMode('idle');
  resize();applyFrame(0);
  // Auto-reproducir
  setTimeout(()=>{play();},400);
  toast('🎴 '+t.name+' — reproduciendo');
}
function sharePlay(){
  if(!hasPlay()){toast('Grabá una jugada antes de compartir');return}
  if(S.plan!=='pro'){
    closeSheets();
    toast('🔒 Compartir por link es PRO — pasate y compartí con tu plantel');
    setTimeout(()=>openSheet('shPlans'),300);
    return;
  }
  // Codificar la jugada en base64 para embeber en el URL (sin backend)
  const meta={};S.players.forEach(p=>meta[p.id]={name:p.name,num:p.num,photo:p.photo||null});
  const payload={
    n:'Jugada compartida',
    g:S.game,t1:S.team1,t2:S.team2,f1:S.form1,f2:S.form2,
    d:S.duration,
    t:S.tracks,
    dr:S.drawings||[],
    m:meta
  };
  try{
    const json=JSON.stringify(payload);
    // Usar btoa con UTF-8 safe
    const b64=btoa(unescape(encodeURIComponent(json)));
    const url=location.origin+'/pizarra-pro.html?play='+b64;
    if(navigator.share){
      navigator.share({title:'Pizarra Pro — Jugada táctica',text:'Mirá esta jugada:',url}).catch(()=>{});
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
  const params=new URLSearchParams(location.search);
  const playData=params.get('play');
  if(!playData)return false;
  try{
    const json=decodeURIComponent(escape(atob(playData)));
    const p=JSON.parse(json);
    discardPreview(true);
    S.game=p.g||5;S.team1=p.t1||5;S.team2=p.t2||5;S.form1=p.f1||'1-2-1';S.form2=p.f2||'1-2-1';
    syncGameSeg();buildPlayers();
    if(p.m)S.players.forEach(pl=>{const m=p.m[pl.id];if(m){pl.name=m.name||'';pl.num=m.num||pl.num}});
    S.tracks=p.t||{};S.duration=p.d||0;S.drawings=p.dr||[];
    S.carrier=null;S.fx=[];S.playT=0;
    resize();applyFrame(0);setMode('idle');
    // Auto-reproducir la jugada compartida
    setTimeout(()=>{play();},500);
    toast('🔗 Jugada compartida cargada — reproduciendo');
    return true;
  }catch(e){
    toast('No pudimos cargar la jugada compartida');
    return false;
  }
}

function exportGIF(){
  if(typeof GIF==='undefined'){toast('No pude cargar el codificador GIF. Revisá tu conexión.');return}
  if(!hasPlay()){toast('Grabá una jugada primero');return}
  if(S.mode==='play')setMode('pause');
  const D=curDuration();
  const fps=14,N=Math.max(2,Math.min(Math.round(D/1000*fps),100));
  const scale=Math.min(1,360/W);
  const w=Math.round(W*scale),h=Math.round(H*scale);
  const gif=new GIF({workers:1,quality:12,width:w,height:h,
    workerScript:'/gif.worker.js'});
  const saved=S.players.map(p=>({id:p.id,x:p.x,y:p.y}));
  const savedT=S.playT;
  const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;
  const tctx=tmp.getContext('2d');
  for(let i=0;i<N;i++){
    const t=D*(i/(N-1||1));
    applyFrame(t,true); // easing para que el GIF se vea igual que la reproducción
    tctx.drawImage(cv,0,0,w,h);
    gif.addFrame(tmp,{delay:Math.round(1000/fps)});
  }
  S.players.forEach(p=>{const s=saved.find(q=>q.id===p.id);if(s){p.x=s.x;p.y=s.y}});
  S.playT=savedT;
  if(S.mode==='pause'||S.mode==='idle')applyFrame(savedT);
  toast('🎬 Generando GIF… tardá unos segundos');
  gif.on('finished',blob=>{
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;
    a.download='pizarra-pro-jugada.gif';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    toast('🎬 GIF listo — descargado');
  });
  gif.render();
}

// ---- Expose ----
window.fetchSaved=fetchSaved;
window.fetchRoster=fetchRoster;
window.persistRoster=persistRoster;
window.renderMinutes=renderMinutes;
window.renderTemplates=renderTemplates;
window.loadTemplate=loadTemplate;
window.sharePlay=sharePlay;
window.loadSharedPlay=loadSharedPlay;
window.exportGIF=exportGIF;
window.previewComplete=previewComplete;
window.applyPreview=applyPreview;
window.finishPrevUI=finishPrevUI;
window.updatePrevSeg=updatePrevSeg;
window.demoPlay=demoPlay;
window.renderPlays=renderPlays;
window.loadPlay=loadPlay;

})();
