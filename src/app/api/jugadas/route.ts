import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { effectivePlan, hasUnlimitedAccess } from '@/lib/plans'
import { validatePlayInput } from '@/lib/play-validation'

const FREE_SAVED_MAX = 3

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const jugadas = await db.jugada.findMany({
      where: { usuarioId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(jugadas)
  } catch (e) {
    console.error('Error en GET /api/jugadas', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const validation = validatePlayInput(await req.json())
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })
    const { nombre, gameType, duration, data } = validation.value
    const subscription = await db.suscripcion.findUnique({ where: { usuarioId: session.user.id } })
    if (!hasUnlimitedAccess(effectivePlan(subscription))) {
      const count = await db.jugada.count({ where: { usuarioId: session.user.id } })
      if (count >= FREE_SAVED_MAX) return NextResponse.json({ error: 'Alcanzaste el límite de 3 jugadas del plan Free' }, { status: 403 })
    }

    const jugada = await db.jugada.create({
      data: {
        nombre: nombre!,
        gameType: gameType!,
        duration: duration!,
        data: data!,
        usuarioId: session.user.id,
      },
    })

    return NextResponse.json(jugada, { status: 201 })
  } catch (e) {
    console.error('Error en POST /api/jugadas', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
