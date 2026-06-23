// Auth UI de Pizarra Pro
// Expone funciones en window. Depende de S, updatePlanBadge, toast, etc.

(function(){
// ---------------- Auth (login/registro/recuperar) ----------------
// Auth server-side con NextAuth. El frontend standalone (HTML+JS) usa fetch directo.
const AUTH_BASE='/api/auth';
S.user=null;
function isGuest(){return !S.user}
let _authMode='login'; // login | register | forgot
function initials(name){return(name||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?'}

async function fetchSession(){
  try{
    const res=await fetch(`${AUTH_BASE}/session`,{credentials:'include'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json();
    if(data.user){
      S.user={id:data.user.id,name:data.user.name||data.user.email.split('@')[0],email:data.user.email,plan:data.user.plan||'free'};
      if(S.user.plan)S.plan=S.user.plan;
    } else {
      S.user=null;
    }
  }catch(e){
    console.error('Error cargando sesión',e);
    S.user=null;
  }
  refreshUserUI();
  updatePlanBadge();
}

async function getCsrfToken(){
  const res=await fetch(`${AUTH_BASE}/csrf`,{credentials:'include'});
  if(!res.ok)throw new Error('HTTP '+res.status);
  const data=await res.json();
  return data.csrfToken;
}

async function login(email,password){
  const csrf=await getCsrfToken();
  const res=await fetch(`${AUTH_BASE}/callback/credentials`,{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    credentials:'include',
    body:new URLSearchParams({csrfToken:csrf,email,password,callbackUrl:'/',json:'true'})
  });
  const data=await res.json();
  if(data.error){throw new Error(data.error==='CredentialsSignin'?'Email o contraseña incorrectos':data.error)}
  await fetchSession();
  await fetchSaved();
  await fetchRoster();
  return S.user;
}

async function register(name,email,password){
  const res=await fetch(`${AUTH_BASE}/register`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    credentials:'include',
    body:JSON.stringify({name,email,password})
  });
  const data=await res.json();
  if(!res.ok){throw new Error(data.error||'Error al crear cuenta')}
  return login(email,password);
}

async function logout(){
  try{
    const csrf=await getCsrfToken();
    await fetch(`${AUTH_BASE}/signout`,{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      credentials:'include',
      body:new URLSearchParams({csrfToken:csrf,json:'true'})
    });
  }catch(e){
    console.error('Error cerrando sesión',e);
  }
  S.user=null;
  refreshUserUI();
  updatePlanBadge();
  toast('Sesión cerrada');
}

function openAuth(mode){
  _authMode=mode||'login';
  const title=document.getElementById('authTitle');
  const sub=document.getElementById('authSub');
  const submit=document.getElementById('authSubmit');
  const nameField=document.getElementById('nameField');
  const passField=document.getElementById('passField');
  const switchP=document.getElementById('authSwitch');
  const links=document.getElementById('authLinks');
  const err=document.getElementById('authError');
  const suc=document.getElementById('authSuccess');
  err.classList.remove('show');suc.classList.remove('show');
  document.getElementById('authForm').reset();
  if(_authMode==='login'){
    title.textContent='Iniciar sesión';
    sub.textContent='Entrá para guardar tus jugadas en la nube y sincronizar entre dispositivos.';
    submit.textContent='ENTRAR';
    nameField.style.display='none';
    passField.style.display='block';
    switchP.innerHTML='¿No tenés cuenta? <a id="authSwitchLink">Registrate gratis</a>';
    links.style.display='flex';
  } else if(_authMode==='register'){
    title.textContent='Crear cuenta';
    sub.textContent='Gratis. Guardá jugadas, sincronizá y desbloqueá la IA.';
    submit.textContent='CREAR CUENTA';
    nameField.style.display='block';
    passField.style.display='block';
    switchP.innerHTML='¿Ya tenés cuenta? <a id="authSwitchLink">Iniciar sesión</a>';
    links.style.display='none';
  } else if(_authMode==='forgot'){
    title.textContent='Recuperar contraseña';
    sub.textContent='Te enviamos un link a tu email para restablecerla. (Próximamente)';
    submit.textContent='ENVIAR LINK';
    nameField.style.display='none';
    passField.style.display='none';
    switchP.innerHTML='¿Ya te acordás? <a id="authSwitchLink">Volver a iniciar sesión</a>';
    links.style.display='none';
  }
  document.getElementById('authModal').classList.add('show');
  const sl=document.getElementById('authSwitchLink');
  if(sl)sl.onclick=()=>openAuth(_authMode==='login'?'register':'login');
}
function closeAuth(){document.getElementById('authModal').classList.remove('show')}
function authError(msg){const e=document.getElementById('authError');e.textContent=msg;e.classList.add('show')}
function authSuccess(msg){const e=document.getElementById('authSuccess');e.textContent=msg;e.classList.add('show')}
function refreshUserUI(){
  const pill=document.getElementById('userPill');
  const loginBtn=document.getElementById('hLogin');
  if(S.user){
    pill.style.display='flex';
    loginBtn.style.display='none';
    document.getElementById('userAvatar').textContent=initials(S.user.name||S.user.email);
    document.getElementById('userName').textContent=S.user.name||S.user.email.split('@')[0];
  } else {
    pill.style.display='none';
    loginBtn.style.display='flex';
  }
}
document.getElementById('hLogin').onclick=()=>openAuth('login');
document.getElementById('authForgot').onclick=()=>openAuth('forgot');
document.getElementById('authForm').onsubmit=async(e)=>{
  e.preventDefault();
  const email=document.getElementById('authEmail').value.trim().toLowerCase();
  const pass=document.getElementById('authPass').value;
  const name=document.getElementById('authName').value.trim();
  document.getElementById('authError').classList.remove('show');
  document.getElementById('authSuccess').classList.remove('show');
  if(_authMode==='forgot'){
    authSuccess('📧 Recuperación de contraseña próximamente.');
    setTimeout(()=>{closeAuth();toast('📧 Recuperación próximamente')},1800);
    return;
  }
  try{
    if(_authMode==='register'){
      if(name.length<2){authError('Decinos tu nombre (mínimo 2 caracteres)');return}
      if(pass.length<6){authError('La contraseña tiene que tener al menos 6 caracteres');return}
      await register(name,email,pass);
      authSuccess('✓ Cuenta creada. ¡Bienvenido!');
      setTimeout(()=>{closeAuth();refreshUserUI();toast('✓ Sesión iniciada — bienvenido')},1200);
      return;
    }
    // login
    await login(email,pass);
    closeAuth();refreshUserUI();
    toast('✓ Hola de nuevo');
  }catch(err){
    authError(err.message||'Error al iniciar sesión');
  }
};
document.getElementById('userPill').onclick=(e)=>{
  e.stopPropagation();
  document.getElementById('userMenu').classList.toggle('show');
};
document.addEventListener('click',()=>document.getElementById('userMenu').classList.remove('show'));
document.getElementById('umPlays').onclick=()=>{document.getElementById('userMenu').classList.remove('show');openSheet('shPlays')};
document.getElementById('umUpgrade').onclick=()=>{document.getElementById('userMenu').classList.remove('show');openSheet('shPlans')};
document.getElementById('umLogout').onclick=()=>{
  document.getElementById('userMenu').classList.remove('show');
  logout();
};


// ---- Expose ----
window.isGuest=isGuest;
window.fetchSession=fetchSession;
window.openAuth=openAuth;
window.closeAuth=closeAuth;
window.refreshUserUI=refreshUserUI;
window.logout=logout;
})();
