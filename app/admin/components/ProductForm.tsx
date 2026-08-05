'use client'

import React, { useEffect, useState } from 'react'
import { compressImage } from '@/lib/imageCompress'

type Props = {
  isVisible: boolean
  isEditing: boolean
  categories: any[]
  submitting: boolean
  initialData: { name?: string; price?: string; compare_at_price?: string; sizes?: string; colors?: string; unit?: string; category_id?: string; marca?: string; stock_quantity?: number; image_urls?: string[] } | null
  onSubmit: (data: { name: string; price: string; compare_at_price?: string; sizes?: string; colors?: string; unit?: string; category_id: string; marca?: string; stock_quantity: number; image_urls: string[] }) => Promise<any>
  onCancel: () => void
  onOpenCategoryModal?: () => void
}

const field = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all font-semibold'

export default function ProductForm({ isVisible, isEditing, categories, submitting, initialData, onSubmit, onCancel, onOpenCategoryModal }: Props) {
  const [form, setForm] = useState({ name: '', price: '', compare_at_price: '', sizes: '', colors: '', unit: '', category_id: '', marca: '', stock_quantity: 0, image_urls: [] as string[] })
  const [uploading, setUploading] = useState(false)

  // Categorías agrupadas
  const mainParents = categories.filter((c: any) => !c.name.includes(' - '))
  const subCategoriesByParent: Record<string, any[]> = {}

  categories.forEach((c: any) => {
    if (c.name.includes(' - ')) {
      const parentName = c.name.split(' - ')[0].trim()
      if (!subCategoriesByParent[parentName]) {
        subCategoriesByParent[parentName] = []
      }
      subCategoriesByParent[parentName].push(c)
    }
  })

  const orphanSubs = categories.filter((c: any) => 
    c.name.includes(' - ') && !mainParents.some(p => p.name.toLowerCase().trim() === c.name.split(' - ')[0].toLowerCase().trim())
  )

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    try {
      setUploading(true)
      const uploaded: string[] = []
      for (const rawFile of files) {
        const file = await compressImage(rawFile)
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        const result = await res.json()
        if (result.success && result.imageUrl) {
          uploaded.push(result.imageUrl)
        } else {
          alert(result.error || `Error al subir ${file.name}`)
        }
      }
      if (uploaded.length > 0) {
        setForm(f => ({ ...f, image_urls: [...f.image_urls, ...uploaded] }))
      }
    } catch (err) {
      console.error(err)
      alert('Error en la subida de imagen')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = (url: string) => {
    setForm(f => ({ ...f, image_urls: f.image_urls.filter(u => u !== url) }))
  }

  useEffect(() => {
    if (initialData) {
      setForm({
        name:             initialData.name             ?? '',
        price:            initialData.price            ?? '',
        compare_at_price: initialData.compare_at_price ?? '',
        sizes:            initialData.sizes            ?? '',
        colors:           initialData.colors           ?? '',
        unit:             initialData.unit             ?? '',
        category_id:      initialData.category_id      ?? '',
        marca:            initialData.marca            ?? '',
        stock_quantity:   initialData.stock_quantity   ?? 0,
        image_urls:       initialData.image_urls       ?? [],
      })
    } else {
      setForm({ name: '', price: '', compare_at_price: '', sizes: '', colors: '', unit: '', category_id: '', marca: '', stock_quantity: 0, image_urls: [] })
    }
  }, [initialData])

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      name:             form.name.trim(),
      price:            form.price,
      compare_at_price: form.compare_at_price || undefined,
      sizes:            form.sizes.trim() || undefined,
      colors:           form.colors.trim() || undefined,
      unit:             form.unit.trim() || undefined,
      category_id:      form.category_id,
      marca:            form.marca.trim() || undefined,
      stock_quantity:   Number(form.stock_quantity) || 0,
      image_urls:       form.image_urls,
    })
  }

  if (!isVisible) return null

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-in">
      {/* Header del form */}
      <div className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between ${isEditing ? 'bg-slate-100/80' : 'bg-slate-50/80'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-800 text-sm font-bold bg-slate-200 border border-slate-300">
            {isEditing ? '✏️' : '+'}
          </div>
          <h2 className="font-black text-slate-900 text-xs uppercase tracking-widest">
            {isEditing ? 'Editar producto' : 'Nuevo producto'}
          </h2>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Campos */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">

          {/* Nombre — ancho completo */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre del producto <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ej: Remera Oversize Heavyweight FKUS"
              className={field}
              required
            />
          </div>

          {/* Categoría */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Categoría / Subcategoría <span className="text-red-500">*</span>
              </label>
              {onOpenCategoryModal && (
                <button
                  type="button"
                  onClick={onOpenCategoryModal}
                  className="text-[10px] font-extrabold text-slate-900 hover:text-slate-600 uppercase tracking-wider cursor-pointer underline"
                >
                  + Nueva Categoría
                </button>
              )}
            </div>
            <select
              value={form.category_id}
              onChange={e => set('category_id', e.target.value)}
              className={field}
              required
            >
              <option value="">Seleccioná una categoría o subcategoría…</option>
              {mainParents.map((parent: any) => {
                const subs = subCategoriesByParent[parent.name] || []
                if (subs.length > 0) {
                  return (
                    <optgroup key={parent.id} label={parent.name.toUpperCase()} className="bg-white font-bold text-slate-900">
                      <option value={parent.id} className="bg-white text-slate-900 font-semibold">
                        {parent.name} (General / Todo)
                      </option>
                      {subs.map((sub: any) => (
                        <option key={sub.id} value={sub.id} className="bg-white text-slate-700 font-normal">
                          ↳ {sub.name.split(' - ')[1]}
                        </option>
                      ))}
                    </optgroup>
                  )
                }
                return (
                  <option key={parent.id} value={parent.id} className="bg-white text-slate-900">
                    {parent.name}
                  </option>
                )
              })}
              {orphanSubs.length > 0 && (
                <optgroup label="OTRAS SUBCATEGORÍAS" className="bg-white font-bold text-slate-900">
                  {orphanSubs.map((c: any) => (
                    <option key={c.id} value={c.id} className="bg-white text-slate-700 font-normal">
                      {c.name.split(' - ')[0]} ➔ {c.name.split(' - ')[1]}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Precio de Venta */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Precio de venta <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                placeholder="0.00"
                className={`${field} pl-7`}
                required
              />
            </div>
          </div>

          {/* Precio Original (Compare At) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Precio original <span className="text-slate-400 font-normal">(sin descuento)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.compare_at_price}
                onChange={e => set('compare_at_price', e.target.value)}
                placeholder="Ej: 45900"
                className={`${field} pl-7`}
              />
            </div>
          </div>

          {/* Talles */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Talles <span className="text-slate-400 font-normal">(separados por coma)</span>
            </label>
            <input
              value={form.sizes}
              onChange={e => set('sizes', e.target.value)}
              placeholder="Ej: S, M, L, XL, XXL"
              className={field}
            />
          </div>

          {/* Colores */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Colores <span className="text-slate-400 font-normal">(separados por coma)</span>
            </label>
            <input
              value={form.colors}
              onChange={e => set('colors', e.target.value)}
              placeholder="Ej: Negro, Melange, Azul Marino"
              className={field}
            />
          </div>

          {/* Sexo / Género */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Género / Destinatario
            </label>
            <select
              value={form.unit}
              onChange={e => set('unit', e.target.value)}
              className={field}
            >
              <option value="">No especificado (Unisex)</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>

          {/* Marca */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Marca <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              value={form.marca}
              onChange={e => set('marca', e.target.value)}
              placeholder="Ej: FKUS"
              className={field}
            />
          </div>

          {/* Imágenes del Producto — ancho completo */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Imágenes del producto <span className="text-slate-400 font-normal">(opcional, podés subir varias)</span>
            </label>
            <div className="flex flex-col gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
              {form.image_urls.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {form.image_urls.map((url, idx) => (
                    <div key={url} className="relative w-20 h-20 bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0 group">
                      <img src={url} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-slate-900/80 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                          Portada
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  id="product_image_file"
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="product_image_file"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 shadow-xs cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {uploading ? 'Subiendo...' : form.image_urls.length > 0 ? 'Agregar más imágenes' : 'Subir imágenes'}
                </label>
                <p className="text-[11px] text-slate-400 mt-1">Formatos: JPG, PNG, WEBP. Tamaño recomendado: 800x600 px. La primera imagen es la portada.</p>
              </div>
            </div>
          </div>

          {/* Cantidad en stock — ancho completo */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Cantidad en stock
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.stock_quantity}
              onChange={e => set('stock_quantity', e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
              placeholder="0"
              className={`${field} sm:max-w-[200px]`}
            />
            <p className="text-[11px] text-slate-400 mt-1">Cuando llega a 0 el producto deja de mostrarse en el catálogo.</p>
          </div>

        </div>

        {/* Acciones */}
        <div className="flex gap-3 mt-6 pt-5 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest disabled:opacity-60 transition-colors shadow-sm cursor-pointer"
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
              isEditing ? 'Guardar cambios' : 'Agregar producto'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
