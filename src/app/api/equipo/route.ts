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

    let equipo = await db.equipo.findFirst({
      where: { usuarioId: session.user.id },
    })

    if (!equipo) {
      equipo = await db.equipo.create({
        data: {
          nombre: 'Mi equipo',
          usuarioId: session.user.id,
          roster: JSON.stringify({ players: [] }),
        },
      })
    }

    return NextResponse.json({
      id: equipo.id,
      nombre: equipo.nombre,
      roster: equipo.roster,
      match: equipo.match,
    })
  } catch (e) {
    console.error('Error en GET /api/equipo', e)
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
    const { nombre, roster, match } = body

    const existing = await db.equipo.findFirst({
      where: { usuarioId: session.user.id },
    })

    const data = {
      nombre: nombre !== undefined ? String(nombre) : existing?.nombre || 'Mi equipo',
      roster: roster !== undefined ? String(roster) : existing?.roster || JSON.stringify({ players: [] }),
      match: match !== undefined ? String(match) : existing?.match,
    }

    const equipo = await db.equipo.upsert({
      where: existing ? { id: existing.id } : { id: '' },
      update: data,
      create: {
        ...data,
        usuarioId: session.user.id,
      } as any,
    })

    return NextResponse.json({
      id: equipo.id,
      nombre: equipo.nombre,
      roster: equipo.roster,
      match: equipo.match,
    })
  } catch (e) {
    console.error('Error en POST /api/equipo', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
