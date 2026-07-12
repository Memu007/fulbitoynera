import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { effectivePlan } from '@/lib/plans'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const subscription = await db.suscripcion.findUnique({
      where: { usuarioId: session.user.id },
    })

    return NextResponse.json({
      plan: effectivePlan(subscription),
      status: subscription?.status || null,
      currentPeriodEnd: subscription?.currentPeriodEnd || null,
      aiUsedToday: subscription?.aiUsedToday || 0,
      aiDate: subscription?.aiDate || '',
    })
  } catch (e) {
    console.error('Error en GET /api/plan', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
