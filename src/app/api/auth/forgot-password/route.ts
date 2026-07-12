import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit,getClientIp,rateLimitResponse } from '@/lib/rate-limit'
import { createResetToken,RESET_TOKEN_TTL_MS } from '@/lib/password-reset'
const LIMIT={windowMs:900000,maxRequests:5};const MESSAGE='Si existe una cuenta con ese email, te enviamos un enlace para recuperar la contraseña.'
export async function POST(req:Request){
  const limit=checkRateLimit(`forgot:${getClientIp(req)}`,LIMIT);if(!limit.allowed)return rateLimitResponse(limit,'Demasiados intentos. Probá más tarde.')
  try{const body=await req.json();const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';if(!/^\S+@\S+\.\S+$/.test(email))return NextResponse.json({error:'Email inválido'},{status:400})
    const user=await db.usuario.findUnique({where:{email},select:{id:true}});if(!user)return NextResponse.json({message:MESSAGE})
    const {token,tokenHash}=createResetToken();await db.$transaction([db.passwordResetToken.deleteMany({where:{usuarioId:user.id}}),db.passwordResetToken.create({data:{usuarioId:user.id,tokenHash,expiresAt:new Date(Date.now()+RESET_TOKEN_TTL_MS)}})])
    const appUrl=(process.env.NEXT_PUBLIC_APP_URL||process.env.NEXTAUTH_URL||'http://localhost:3000').replace(/\/$/,'');const resetUrl=`${appUrl}/pizarra-pro.html?reset=${token}`
    const key=process.env.RESEND_API_KEY?.trim(),from=process.env.EMAIL_FROM?.trim()
    if(!key||!from){const host=new URL(appUrl).hostname;if(process.env.ALLOW_DEV_RESET_LINKS==='true'&&['localhost','127.0.0.1'].includes(host))return NextResponse.json({message:MESSAGE,devResetUrl:resetUrl});await db.passwordResetToken.deleteMany({where:{usuarioId:user.id}});return NextResponse.json({error:'El servicio de email no está configurado.'},{status:503})}
    const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[email],subject:'Recuperá tu contraseña de Pizarra Pro',html:`<p>Recibimos un pedido para cambiar tu contraseña.</p><p><a href="${resetUrl}">Crear una nueva contraseña</a></p><p>El enlace vence en 1 hora.</p>`})})
    if(!sent.ok){await db.passwordResetToken.deleteMany({where:{usuarioId:user.id}});return NextResponse.json({error:'No pudimos enviar el email.'},{status:502})}return NextResponse.json({message:MESSAGE})
  }catch(e){console.error(e);return NextResponse.json({error:'Error interno'},{status:500})}
}
