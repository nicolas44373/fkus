'use client'

import React, { useEffect, useState } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  category: { id: number | string; name: string; image_url: string | null } | null
  onSubmit: (data: { name: string; image_url: string | null }) => Promise<any>
  submitting: boolean
}

const fieldClass = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all'

export default function CategoryModal({ isOpen, onClose, category, onSubmit, submitting }: Props) {
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (category) {
      setName(category.name || '')
      setImageUrl(category.image_url || null)
    } else {
      setName('')
      setImageUrl(null)
    }
  }, [category, isOpen])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const result = await res.json()
      if (result.success && result.imageUrl) {
        setImageUrl(result.imageUrl)
      } else {
        alert(result.error || 'Error al subir la imagen')
      }
    } catch (err) {
      console.error(err)
      alert('Error en la subida de la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await onSubmit({
      name: name.trim(),
      image_url: imageUrl
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${category ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold ${category ? 'bg-amber-500' : 'bg-emerald-500'}`}>
              {category ? '✏️' : '+'}
            </div>
            <h2 className="font-extrabold text-gray-900 text-base">
              {category ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Nombre de la categoría */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Nombre de la categoría <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Rebozados, Ofertas, Pescados"
              className={fieldClass}
              required
              autoFocus
            />
          </div>

          {/* Imagen de la categoría */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Imagen de la categoría <span className="text-gray-300 font-normal">(opcional)</span>
            </label>
            <div className="flex items-center gap-4 bg-gray-50 border border-gray-150 rounded-xl p-4">
              {imageUrl ? (
                <div className="relative w-20 h-20 bg-white border border-gray-200 rounded-lg overflow-hidden shrink-0 group">
                  <img src={imageUrl} alt="Vista previa" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                  >
                    Eliminar
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 bg-white border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-2xl text-gray-300 shrink-0 select-none">
                  🖼️
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  id="category_image_file"
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="category_image_file"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 shadow-sm cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {uploading ? 'Subiendo...' : 'Subir imagen'}
                </label>
                <p className="text-[10px] text-gray-400 mt-1">Formatos: JPG, PNG, WEBP. Tamaño recomendado: 800x600 px.</p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60 transition-colors shadow-sm cursor-pointer ${
                category
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando…
                </>
              ) : (
                category ? 'Guardar cambios' : 'Crear categoría'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
