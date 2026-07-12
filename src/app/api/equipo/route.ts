import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const MAX_ROSTER_BYTES = 250_000
const MAX_MATCH_BYTES = 50_000
function validateJsonString(value: unknown, maxBytes: number): string | null {
  if (typeof value !== 'string' || Buffer.byteLength(value,'utf8') > maxBytes) return null
  try { const parsed=JSON.parse(value); return parsed && typeof parsed==='object' ? value : null } catch { return null }
}

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
          roster: JSON.stringify({ roster: [] }),
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

    if (nombre !== undefined && (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 80)) return NextResponse.json({ error:'Nombre de equipo inválido' },{status:400})
    const rosterClean=roster===undefined?undefined:validateJsonString(roster,MAX_ROSTER_BYTES)
    const matchClean=match===undefined||match===null?match:validateJsonString(match,MAX_MATCH_BYTES)
    if(roster!==undefined&&rosterClean===null)return NextResponse.json({error:'Plantel inválido'},{status:400})
    if(match!==undefined&&match!==null&&matchClean===null)return NextResponse.json({error:'Estado de partido inválido'},{status:400})

    const existing = await db.equipo.findFirst({
      where: { usuarioId: session.user.id },
    })

    const data = {
      nombre: nombre !== undefined ? nombre.trim() : existing?.nombre || 'Mi equipo',
      roster: rosterClean !== undefined ? rosterClean! : existing?.roster || JSON.stringify({ roster: [] }),
      match: matchClean !== undefined ? matchClean : existing?.match,
    }
    const equipo = existing
      ? await db.equipo.update({ where:{id:existing.id}, data })
      : await db.equipo.create({ data:{...data,usuarioId:session.user.id} })

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
