import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const REGISTER_LIMIT = { windowMs: 60_000, maxRequests: 5 }

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const limit = checkRateLimit(`register:${ip}`, REGISTER_LIMIT)
    if (!limit.allowed) {
      return rateLimitResponse(limit, 'Demasiados intentos de registro. Probá más tarde.')
    }

    const body = await req.json()
    const { email, password, name } = body

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
    }

    const emailClean = email.toLowerCase().trim()
    const passwordClean = String(password)
    const nameClean = name ? String(name).trim() : null

    if (emailClean.length < 5 || !emailClean.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    if (passwordClean.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }
    if (nameClean && nameClean.length < 2) {
      return NextResponse.json({ error: 'El nombre debe tener al menos 2 caracteres' }, { status: 400 })
    }

    const existing = await db.usuario.findUnique({ where: { email: emailClean } })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(passwordClean, 10)

    const user = await db.usuario.create({
      data: {
        email: emailClean,
        nombre: nameClean,
        passwordHash,
      },
    })

    await db.suscripcion.create({
      data: {
        usuarioId: user.id,
        plan: 'free',
      },
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      plan: 'free',
    })
  } catch (e) {
    console.error('Error en /api/auth/register', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
