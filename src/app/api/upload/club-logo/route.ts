

import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Kein Datei-Upload gefunden' }, { status: 400 })
    }

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      return NextResponse.json({ error: 'Nur PNG oder JPG erlaubt' }, { status: 400 })
    }

    // Maximalgröße 5 MB
    const MAX_BYTES = 5 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Datei zu groß (max. 5 MB)' }, { status: 413 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'club-logos')
    await mkdir(uploadDir, { recursive: true })
    
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const filename = `club_${Date.now()}.${ext}`
    const filepath = path.join(uploadDir, filename)

    await writeFile(filepath, buffer)

    const publicUrl = `/uploads/club-logos/${filename}`
    return NextResponse.json({ url: publicUrl, mime: file.type })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 })
  }
}