import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { effectivePlan, hasUnlimitedAccess } from '@/lib/plans'
import { SHARED_PLAY_TTL_MS, validateSharedPlayData } from '@/lib/shared-play'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
const SHARE_LIMIT={windowMs:60000,maxRequests:20}
export async function POST(req:Request){
  try{
    const limit=checkRateLimit(`share:${getClientIp(req)}`,SHARE_LIMIT);if(!limit.allowed)return rateLimitResponse(limit,'Creaste demasiados enlaces. Esperá un minuto.')
    const session=await getServerSession(authOptions);if(!session?.user?.id)return NextResponse.json({error:'Iniciá sesión para compartir'},{status:401})
    const subscription=await db.suscripcion.findUnique({where:{usuarioId:session.user.id}})
    if(!hasUnlimitedAccess(effectivePlan(subscription)))return NextResponse.json({error:'Compartir por link requiere plan Pro o Club'},{status:403})
    const body=await req.json();const data=validateSharedPlayData(body.data);if(!data)return NextResponse.json({error:'Jugada inválida o demasiado grande'},{status:400})
    const now=new Date();await db.sharedPlay.deleteMany({where:{expiresAt:{lt:now}}})
    const shared=await db.sharedPlay.create({data:{usuarioId:session.user.id,data,expiresAt:new Date(now.getTime()+SHARED_PLAY_TTL_MS)}})
    const base=(process.env.NEXT_PUBLIC_APP_URL||process.env.NEXTAUTH_URL||new URL(req.url).origin).replace(/\/$/,'')
    return NextResponse.json({id:shared.id,url:`${base}/pizarra-pro.html?share=${shared.id}`,expiresAt:shared.expiresAt},{status:201})
  }catch(e){console.error(e);return NextResponse.json({error:'No pudimos crear el enlace'},{status:500})}
}
