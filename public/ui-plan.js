// UI de planes y límites de Pizarra Pro
// Expone funciones en window. Depende de S, isGuest, toast, openSheet.

(function(){

// ---- Paywall / planes ----
const FREE_AI_DAILY=1;
const FREE_SAVED_MAX=3;
function aiTodayDate(){return new Date().toISOString().slice(0,10)}
async function ensureCanUseAI(){
  if(S.plan==='pro'||S.plan==='club')return true;
  if(isGuest()){
    // Guest: contador local (1 uso gratis por día). No llama al servidor porque requiere auth.
    if(S.aiDate!==aiTodayDate()){S.aiDate=aiTodayDate();S.aiUsedToday=0}
    return S.aiUsedToday<FREE_AI_DAILY;
  }
  try{
    const res=await fetch('/api/plan/ai-use',{method:'POST',credentials:'include'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json();
    S.aiUsedToday=data.aiUsedToday||0;
    S.aiDate=aiTodayDate();
    return !!data.canUse;
  }catch(e){
    console.error('Error verificando uso de IA',e);
    return false;
  }
}
function canUseAI(){
  // Sync wrapper: para callers legacy, siempre devuelve true si pro; free consulta server async via ensureCanUseAI
  if(S.plan==='pro'||S.plan==='club'||isGuest())return true;
  return S.aiUsedToday<FREE_AI_DAILY;
}
function registerAIUse(){
  // El contador se incrementa en el servidor. Actualizamos localmente para reflejo inmediato.
  S.aiUsedToday++;
}
function canSavePlay(){
  if(S.plan==='pro')return true;
  return S.saved.length<FREE_SAVED_MAX;
}
async function fetchPlan(){
  try{
    const res=await fetch('/api/plan',{credentials:'include'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json();
    if(data.plan){
      S.plan=data.plan;
      S.aiUsedToday=data.aiUsedToday||0;
      S.aiDate=data.aiDate||'';
    }
  }catch(e){
    console.error('Error cargando plan',e);
    S.plan='free';
    S.aiUsedToday=0;
    S.aiDate='';
  }
  updatePlanBadge();
}
function persistPlan(){
  // El plan ahora se persiste en el servidor. No guardar en localStorage.
}
function updatePlanBadge(){
  const b=document.getElementById('planBadge');
  if(S.plan==='pro'){b.textContent='PRO';b.classList.remove('free')}
  else{b.textContent='FREE';b.classList.add('free')}
}
// selección de plan en el sheet
document.querySelectorAll('#shPlans .planCard').forEach(card=>{
  card.onclick=()=>{
    document.querySelectorAll('#shPlans .planCard').forEach(c=>c.classList.remove('sel'));
    card.classList.add('sel');
  };
});
document.getElementById('plansCta').onclick=async()=>{
  const sel=document.querySelector('#shPlans .planCard.sel');
  const plan=sel?sel.dataset.plan:'pro-yearly';
  const btn=document.getElementById('plansCta');
  const orig=btn.textContent;
  btn.textContent='PROCESANDO…';btn.disabled=true;
  try{
    const res=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan}),credentials:'include'});
    const data=await res.json();
    if(data.error){toast('Error: '+data.error);return}
    if(data.redirectUrl){
      // Modo producción: redirigir a Stripe Checkout
      window.top.location.href=data.redirectUrl;
    } else {
      // Modo demo: el servidor ya activó el plan en DB. Refrescamos desde el servidor.
      await fetchPlan();
      closeSheets();
      toast('✨ Plan activado — disfrutá la IA ilimitada');
    }
  }catch(e){
    toast('No pudimos procesar el pago. Intentá de nuevo.');
  }finally{
    btn.textContent=orig;btn.disabled=false;
  }
};

// ---- Expose ----
window.canUseAI=canUseAI;
window.ensureCanUseAI=ensureCanUseAI;
window.registerAIUse=registerAIUse;
window.canSavePlay=canSavePlay;
window.fetchPlan=fetchPlan;
window.updatePlanBadge=updatePlanBadge;

})();
