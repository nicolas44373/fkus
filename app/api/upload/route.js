import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generar un nombre único para el archivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`

    // Subir a Supabase Storage (bucket 'fkus-images')
    const { data, error } = await supabase.storage
      .from('fkus-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      console.error('Supabase storage error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('fkus-images')
      .getPublicUrl(fileName)

    return NextResponse.json({ 
      success: true, 
      imageUrl: publicUrl 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Error uploading image' }, 
      { status: 500 }
    )
  }
}