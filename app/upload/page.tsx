'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UploadPage() {

  const [file, setFile] = useState<File | null>(null)

  const upload = async () => {

    if (!file) return

    const fileName = `imovel-${Date.now()}-${file.name}`

    const { data, error } = await supabase.storage
      .from('imoveis')
      .upload(fileName, file)

    if (error) {
      console.log(error)
      alert('Erro no upload')
      return
    }

    const { data: url } = supabase.storage
      .from('imoveis')
      .getPublicUrl(fileName)

    console.log(url)

    alert('Upload feito!')
  }

  return (
    <div style={{padding:40}}>
      <h1>Teste Upload</h1>

      <input
        type="file"
        onChange={(e)=> setFile(e.target.files?.[0] || null)}
      />

      <button onClick={upload}>
        Upload
      </button>
    </div>
  )
}
