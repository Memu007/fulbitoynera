import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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

    const body = await req.json()
    const { nombre, gameType, duration, data } = body

    if (!nombre || !gameType || !data) {
      return NextResponse.json(
        { error: 'nombre, gameType y data son requeridos' },
        { status: 400 }
      )
    }

    const jugada = await db.jugada.create({
      data: {
        nombre: String(nombre),
        gameType: String(gameType),
        duration: Number(duration) || 0,
        data: String(data),
        usuarioId: session.user.id,
      },
    })

    return NextResponse.json(jugada, { status: 201 })
  } catch (e) {
    console.error('Error en POST /api/jugadas', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
