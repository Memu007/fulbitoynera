import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_SIZE = 2_000_000 // 2MB
const ALLOWED_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    const ext = ALLOWED_MIME[file.type]
    if (!ext) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo PNG, JPG, WEBP o GIF.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Archivo demasiado grande. Máximo 2MB.' },
        { status: 413 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    mkdirSync(UPLOAD_DIR, { recursive: true })
    writeFileSync(join(UPLOAD_DIR, safeName), buffer)

    return NextResponse.json({ url: `/uploads/${safeName}` })
  } catch (e) {
    console.error('Error en POST /api/upload', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
