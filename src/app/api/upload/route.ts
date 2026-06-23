import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

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

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split('.').pop() || 'png'
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    mkdirSync(UPLOAD_DIR, { recursive: true })
    writeFileSync(join(UPLOAD_DIR, safeName), buffer)

    return NextResponse.json({ url: `/uploads/${safeName}` })
  } catch (e) {
    console.error('Error en POST /api/upload', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
