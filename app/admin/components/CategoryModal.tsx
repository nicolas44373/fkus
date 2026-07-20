'use client'

import React, { useEffect, useState } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  category: { id: number | string; name: string; image_url: string | null } | null
  onSubmit: (data: { name: string; image_url: string | null }) => Promise<any>
  submitting: boolean
  categories: { id: number | string; name: string }[]
  presetParentName?: string
}

const fieldClass = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition-all font-semibold'

export default function CategoryModal({ isOpen, onClose, category, onSubmit, submitting, categories, presetParentName }: Props) {
  const [isSubcategoryMode, setIsSubcategoryMode] = useState(false)
  const [parentCategoryId, setParentCategoryId] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Filter to show only top-level parents in parent selection dropdown
  const parentOptions = categories.filter((c: any) => 
    !c.name.includes(' - ') && String(c.id) !== String(category?.id)
  )

  useEffect(() => {
    if (category) {
      if (category.name.includes(' - ')) {
        const parts = category.name.split(' - ')
        const pName = parts[0].trim()
        const sName = parts.slice(1).join(' - ').trim()
        
        const parent = categories.find((c: any) => c.name.toLowerCase().trim() === pName.toLowerCase())
        setParentCategoryId(parent ? String(parent.id) : '')
        setNameInput(sName)
        setIsSubcategoryMode(true)
      } else {
        setParentCategoryId('')
        setNameInput(category.name || '')
        setIsSubcategoryMode(false)
      }
      setImageUrl(category.image_url || null)
    } else {
      if (presetParentName) {
        const parent = categories.find((c: any) => c.name.toLowerCase().trim() === presetParentName.toLowerCase())
        setParentCategoryId(parent ? String(parent.id) : '')
        setIsSubcategoryMode(true)
      } else {
        setParentCategoryId('')
        setIsSubcategoryMode(false)
      }
      setNameInput('')
      setImageUrl(null)
    }
  }, [category, isOpen, categories, presetParentName])

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
    if (!nameInput.trim()) return

    let finalName = nameInput.trim()
    if (isSubcategoryMode && parentCategoryId) {
      const parent = categories.find((c: any) => String(c.id) === String(parentCategoryId))
      if (parent) {
        finalName = `${parent.name} - ${nameInput.trim()}`
      }
    }

    await onSubmit({
      name: finalName,
      image_url: imageUrl
    })
  }

  if (!isOpen) return null

  const selectedParentObj = categories.find((c: any) => String(c.id) === String(parentCategoryId))

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-w-md w-full animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-800 text-xs font-bold bg-slate-200 border border-slate-300">
              {category ? '✏️' : '+'}
            </div>
            <h2 className="font-black text-slate-900 text-xs uppercase tracking-widest">
              {category ? 'Editar Categoría / Subcategoría' : 'Crear Categoría / Subcategoría'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Tipo Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tipo de Rubro
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => { setIsSubcategoryMode(false); setParentCategoryId('') }}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  !isSubcategoryMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Categoría Principal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSubcategoryMode(true)
                  if (!parentCategoryId && parentOptions.length > 0) {
                    setParentCategoryId(String(parentOptions[0].id))
                  }
                }}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  isSubcategoryMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Subcategoría
              </button>
            </div>
          </div>
          
          {/* Categoría Padre (Solo si es subcategoría) */}
          {isSubcategoryMode && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Categoría Padre <span className="text-red-500">*</span>
              </label>
              {parentOptions.length > 0 ? (
                <select
                  value={parentCategoryId}
                  onChange={e => setParentCategoryId(e.target.value)}
                  className={fieldClass}
                  required
                >
                  <option value="">Selecciona una categoría principal…</option>
                  {parentOptions.map((c: any) => (
                    <option key={c.id} value={c.id} className="bg-white text-slate-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold">
                  ⚠️ No existen categorías principales aún. Primero crea una categoría principal (ej: Pantalones).
                </div>
              )}
            </div>
          )}

          {/* Nombre de la categoría/subcategoría */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {isSubcategoryMode ? 'Nombre de la Subcategoría' : 'Nombre de la Categoría Principal'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder={isSubcategoryMode ? "Ej: Cargos, Bermudas, Boxy, Oversize" : "Ej: Pantalones, Remeras, Accesorios"}
              className={fieldClass}
              required
              autoFocus
            />
          </div>

          {/* Live Preview Badge */}
          {nameInput.trim() && (
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">
                Previsualización en FKUS:
              </span>
              {isSubcategoryMode && selectedParentObj ? (
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-slate-600">{selectedParentObj.name}</span>
                  <span className="text-slate-400">➔</span>
                  <span className="text-slate-900 font-black">{nameInput.trim()}</span>
                </div>
              ) : (
                <div className="font-black text-slate-900">{nameInput.trim()}</div>
              )}
            </div>
          )}

          {/* Imagen de la categoría */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Imagen de portada <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
              {imageUrl ? (
                <div className="relative w-20 h-20 bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0 group">
                  <img src={imageUrl} alt="Vista previa" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                  >
                    Eliminar
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 bg-white border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-2xl text-slate-300 shrink-0 select-none">
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
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 shadow-xs cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {uploading ? 'Subiendo...' : 'Subir imagen'}
                </label>
                <p className="text-[10px] text-slate-400 mt-1">Formatos: JPG, PNG, WEBP. Recomendado: 800x600 px.</p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || uploading || (isSubcategoryMode && !parentCategoryId)}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando…
                </>
              ) : (
                category ? 'Guardar Cambios' : 'Crear'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
