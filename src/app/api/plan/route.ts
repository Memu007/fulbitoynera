import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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
      plan: subscription?.plan || 'free',
      aiUsedToday: subscription?.aiUsedToday || 0,
      aiDate: subscription?.aiDate || '',
    })
  } catch (e) {
    console.error('Error en GET /api/plan', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
