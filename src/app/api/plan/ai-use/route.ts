import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const FREE_AI_DAILY = 1 // Debe coincidir con FREE_AI_DAILY en public/pizarra-pro.html
const AI_USE_LIMIT = { windowMs: 60_000, maxRequests: 20 }

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const limit = checkRateLimit(`ai-use:${ip}`, AI_USE_LIMIT)
    if (!limit.allowed) {
      return rateLimitResponse(limit, 'Demasiadas solicitudes a la IA. Probá más tarde.')
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const today = new Date().toISOString().slice(0, 10)

    let subscription = await db.suscripcion.findUnique({
      where: { usuarioId: session.user.id },
    })

    if (!subscription) {
      subscription = await db.suscripcion.create({
        data: {
          usuarioId: session.user.id,
          plan: 'free',
        },
      })
    }

    // Reset diario si cambió el día
    if (subscription.aiDate !== today) {
      subscription = await db.suscripcion.update({
        where: { usuarioId: session.user.id },
        data: { aiDate: today, aiUsedToday: 0 },
      })
    }

    if (subscription.plan === 'pro' || subscription.plan === 'club') {
      return NextResponse.json({ canUse: true, aiUsedToday: subscription.aiUsedToday })
    }

    if (subscription.aiUsedToday >= FREE_AI_DAILY) {
      return NextResponse.json({ canUse: false, aiUsedToday: subscription.aiUsedToday })
    }

    const updated = await db.suscripcion.update({
      where: { usuarioId: session.user.id },
      data: { aiUsedToday: { increment: 1 } },
    })

    return NextResponse.json({ canUse: true, aiUsedToday: updated.aiUsedToday })
  } catch (e) {
    console.error('Error en POST /api/plan/ai-use', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
