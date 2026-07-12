import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { validatePlayInput } from '@/lib/play-validation'

async function getJugada(id: string, userId: string) {
  return db.jugada.findFirst({
    where: { id, usuarioId: userId },
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const existing = await getJugada(id, session.user.id)
    if (!existing) {
      return NextResponse.json({ error: 'Jugada no encontrada' }, { status: 404 })
    }

    const validation = validatePlayInput(await req.json(), true)
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })
    const { nombre, gameType, duration, data } = validation.value

    const updated = await db.jugada.update({
      where: { id },
      data: {
        nombre: nombre !== undefined ? String(nombre) : existing.nombre,
        gameType: gameType !== undefined ? String(gameType) : existing.gameType,
        duration: duration !== undefined ? Number(duration) : existing.duration,
        data: data !== undefined ? String(data) : existing.data,
      },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('Error en PUT /api/jugadas/:id', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const existing = await getJugada(id, session.user.id)
    if (!existing) {
      return NextResponse.json({ error: 'Jugada no encontrada' }, { status: 404 })
    }

    await db.jugada.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Error en DELETE /api/jugadas/:id', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
