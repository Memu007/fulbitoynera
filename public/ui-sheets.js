// UI de sheets, formaciones, equipos, edición de jugador y toast
// Expone funciones en window. Depende de S, draw, applyFormation, etc.

(function(){

// sheets
const bg=document.getElementById('sheetBg');
function openSheet(id){
  closeSheets();bg.classList.add('open');
  document.getElementById(id).classList.add('open');
  if(id==='shPlays')renderPlays();
  if(id==='shForm')renderFormSheet();
  if(id==='shAI')renderAISheet();
  if(id==='shTeams'){S._t1=S.team1;S._t2=S.team2;syncTeams()}
}
function closeSheets(){bg.classList.remove('open');document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('open'))}
bg.onclick=closeSheets;

// velocidad
function renderSpeeds(){
  const l=document.getElementById('speedList');l.innerHTML='';
  SPEEDS.forEach(s=>{
    const el=document.createElement('div');
    el.className='opt'+(S.speed===s.v?' sel':'');
    el.innerHTML=`<span class="ic" style="background:#ffb02022">${s.i}</span>
      <span class="tx"><b>${s.n} · ${s.v}x</b><small>${s.d}</small></span><span class="ck">✔</span>`;
    el.onclick=()=>{S.speed=s.v;document.getElementById('speedLabel').textContent=s.v+'x';renderSpeeds();closeSheets();toast('Velocidad '+s.v+'x')};
    l.appendChild(el);
  });
}

// equipos
function syncTeams(){
  document.getElementById('t1n').textContent=S._t1;
  document.getElementById('t2n').textContent=S._t2;
  document.getElementById('t1m').disabled=S._t1<=3;document.getElementById('t1p').disabled=S._t1>=11;
  document.getElementById('t2m').disabled=S._t2<=3;document.getElementById('t2p').disabled=S._t2>=11;
}
S._t1=5;S._t2=5;
document.getElementById('t1m').onclick=()=>{S._t1=Math.max(3,S._t1-1);syncTeams()};
document.getElementById('t1p').onclick=()=>{S._t1=Math.min(11,S._t1+1);syncTeams()};
document.getElementById('t2m').onclick=()=>{S._t2=Math.max(3,S._t2-1);syncTeams()};
document.getElementById('t2p').onclick=()=>{S._t2=Math.min(11,S._t2+1);syncTeams()};
document.getElementById('teamsApply').onclick=()=>{
  S.team1=S._t1;S.team2=S._t2;
  if(!parseForm(S.form1,S.team1))S.form1='auto';
  if(!parseForm(S.form2,S.team2))S.form2='auto';
  discardPreview(true);clearPlay(true);S.carrier=null;S.fx=[];
  buildPlayers(true);setMode('idle');draw();closeSheets();
  toast(`Equipos: ${S.team1} vs ${S.team2}`);
};

// formaciones
let formTeam='blue';
document.getElementById('ftBlue').onclick=()=>{formTeam='blue';renderFormSheet()};
document.getElementById('ftRed').onclick=()=>{formTeam='red';renderFormSheet()};
function renderFormSheet(){
  document.getElementById('ftBlue').classList.toggle('on',formTeam==='blue');
  document.getElementById('ftRed').classList.toggle('on',formTeam==='red');
  document.getElementById('formModeLbl').textContent='FÚTBOL '+S.game+' · EQUIPO '+(formTeam==='blue'?'AZUL':'ROJO');
  const count=formTeam==='blue'?S.team1:S.team2;
  const cur=formTeam==='blue'?S.form1:S.form2;
  const box=document.getElementById('formChips');box.innerHTML='';
  let any=false;
  FORMATIONS[S.game].forEach(code=>{
    const ok=!!parseForm(code,count);
    const b=document.createElement('button');
    b.className='fChip'+(cur===code?' sel':'');
    b.textContent=code;b.disabled=!ok;if(ok)any=true;
    b.onclick=()=>{applyFormation(formTeam,code);renderFormSheet();toast('Formación '+code+' aplicada')};
    box.appendChild(b);
  });
  document.getElementById('formHint').textContent=any?
    'Aplicar una formación reubica al equipo y borra la jugada en curso.':
    `Con ${count} jugadores no hay formaciones estándar de Fútbol ${S.game}. Ajustá la cantidad en 👥.`;
}

// IA sheet
function renderAISheet(){
  const ab=document.getElementById('attChips');ab.innerHTML='';
  [['auto','🤖 Auto'],['blue','🔵 Azul'],['red','🔴 Rojo']].forEach(([id,lbl])=>{
    const b=document.createElement('button');
    b.className='fChip'+(S.attTeam===id?' sel':'');
    b.textContent=lbl;
    b.onclick=()=>{S.attTeam=id;renderAISheet()};
    ab.appendChild(b);
  });
  const box=document.getElementById('styleChips');box.innerHTML='';
  STYLES.forEach(s=>{
    const b=document.createElement('button');
    b.className='fChip'+(S.aiStyle===s.id?' sel':'');
    b.textContent=s.i+' '+s.n;
    b.onclick=()=>{S.aiStyle=s.id;renderAISheet()};
    box.appendChild(b);
  });
  const has=Object.keys(S.tracks).length>0&&S.duration>0;
  document.getElementById('aiHasPlay').style.display=has?'block':'none';
  document.getElementById('aiNoPlay').style.display=has?'none':'block';
}
// edición jugador
let _plPhotoTemp=null;
function openPlayerEdit(p){
  S.editing=p;
  document.getElementById('plName').value=p.name||'';
  document.getElementById('plNum').value=p.num;
  _plPhotoTemp=null;
  const prev=document.getElementById('plPhotoPreview');
  const delBtn=document.getElementById('plPhotoDel');
  if(p.photo){
    prev.style.backgroundImage='url('+p.photo+')';
    prev.textContent='';
    delBtn.style.display='block';
  } else {
    prev.style.backgroundImage='';
    prev.textContent='👤';
    delBtn.style.display='none';
  }
  openSheet('shPlayer');
}
document.getElementById('plPhoto').onchange=async(e)=>{
  const f=e.target.files[0];
  if(!f)return;
  if(isGuest()){toast('Registrate para subir fotos de jugadores');openAuth('register');e.target.value='';return}
  if(f.size>800*1024){toast('La foto es muy grande (máx 800KB)');return}
  try{
    const form=new FormData();
    form.append('file',f);
    const res=await fetch('/api/upload',{method:'POST',credentials:'include',body:form});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json();
    _plPhotoTemp=data.url;
    const prev=document.getElementById('plPhotoPreview');
    prev.style.backgroundImage='url('+_plPhotoTemp+')';
    prev.textContent='';
    document.getElementById('plPhotoDel').style.display='block';
  }catch(err){console.error('Error subiendo foto',err);toast('Error al subir foto')}
};
document.getElementById('plPhotoDel').onclick=()=>{
  _plPhotoTemp='';
  const prev=document.getElementById('plPhotoPreview');
  prev.style.backgroundImage='';
  prev.textContent='👤';
  document.getElementById('plPhotoDel').style.display='none';
};
document.getElementById('plOk').onclick=()=>{
  if(S.editing){
    S.editing.name=document.getElementById('plName').value.trim().slice(0,14);
    const n=parseInt(document.getElementById('plNum').value);
    if(!isNaN(n))S.editing.num=clamp(n,0,99);
    if(_plPhotoTemp!==null){
      if(_plPhotoTemp==='')delete S.editing.photo;
      else S.editing.photo=_plPhotoTemp;
    }
  }
  _plPhotoTemp=null;
  S.editing=null;closeSheets();draw();if(typeof scheduleDraftSave==='function')scheduleDraftSave();
};

// toast
let toastT;
function toast(m){
  const t=document.getElementById('toast');
  t.textContent=m;t.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2400);
}

function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}

// ---- Expose ----
window.openSheet=openSheet;
window.closeSheets=closeSheets;
window.toast=toast;
window.renderSpeeds=renderSpeeds;
window.openPlayerEdit=openPlayerEdit;
window.syncTeams=syncTeams;
window.renderFormSheet=renderFormSheet;
window.renderAISheet=renderAISheet;
window.esc=esc;

})();
