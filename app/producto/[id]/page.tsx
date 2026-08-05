'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/app/components/Header'
import WhatsAppFAB from '@/app/components/WhatsAppFAB'
import { useCart } from '@/app/context/CartContext'
import { ChevronLeft, ChevronRight, Check, ArrowLeft } from 'lucide-react'

type Product = {
  id: number | string
  name: string
  price: string | null
  compare_at_price: string | null
  sizes: string | null
  colors: string | null
  unit: string | null
  marca: string | null
  category_id: number | string
  stock_quantity: number | null
  image_urls: string[] | null
  categories?: { name: string } | null
}

const formatMoney = (value: string | null) => {
  if (!value) return '—'
  const num = parseFloat(value)
  if (isNaN(num)) return '—'
  return `$ ${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { addItem, setIsOpen } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [justAdded, setJustAdded] = useState(false)
  const [showContactMenu, setShowContactMenu] = useState(false)

  useEffect(() => {
    const id = params?.id
    if (!id) return
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, compare_at_price, sizes, colors, unit, marca, category_id, stock_quantity, image_urls, categories(name)')
        .eq('id', id)
        .maybeSingle()

      if (error || !data) {
        setNotFound(true)
      } else {
        const p = data as any
        setProduct(p)
        const colorList = p.colors ? p.colors.split(',').map((c: string) => c.trim()).filter(Boolean) : []
        const sizeList = p.sizes ? p.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : []
        setSelectedColor(colorList[0] || '')
        setSelectedSize(sizeList[0] || '')
      }
      setLoading(false)
    }
    load()
  }, [params?.id])

  const handleWhatsAppContact = () => {
    const msg = `Hola! Me interesa consultar sobre "${product?.name}".`
    window.open(`https://wa.me/+5493854021865?text=${encodeURIComponent(msg)}`, '_blank')
    setShowContactMenu(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full border-4 border-zinc-850" />
              <div className="absolute inset-0 rounded-full border-4 border-t-white animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">FKUS</div>
            </div>
            <p className="font-extrabold text-zinc-200 tracking-wider text-xs uppercase">Cargando producto…</p>
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center px-6">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-white font-semibold mb-2">No encontramos este producto.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-xs font-black uppercase tracking-widest text-white border-b border-white pb-0.5 hover:text-zinc-300 hover:border-zinc-300 transition-all cursor-pointer"
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    )
  }

  const images = product.image_urls && product.image_urls.length > 0 ? product.image_urls : []
  const colorList = product.colors ? product.colors.split(',').map(c => c.trim()).filter(Boolean) : []
  const sizeList = product.sizes ? product.sizes.split(',').map(s => s.trim()).filter(Boolean) : []
  const inStock = (product.stock_quantity ?? 0) > 0
  const hasPrice = !!product.price

  const discount = product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price || '0')
    ? Math.round((1 - parseFloat(product.price || '0') / parseFloat(product.compare_at_price)) * 100)
    : 0

  const handleAdd = () => {
    if (!hasPrice || !inStock) return
    const cartItemId = `${product.id}-${selectedSize || ''}-${selectedColor || ''}`
    addItem({
      id: product.id,
      cartItemId,
      name: product.name,
      price: product.price ?? '0',
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined,
      unit: product.unit ?? undefined,
      categoryName: product.categories?.name ?? undefined,
      image_url: images[0] ?? undefined,
    })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1800)
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Volver */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-white uppercase tracking-widest mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> Volver
        </button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">

          {/* ── Galería de Imágenes ── */}
          <div className="flex gap-3 sm:gap-4">
            {/* Miniaturas verticales (desktop) */}
            {images.length > 1 && (
              <div className="hidden sm:flex flex-col gap-2.5 w-16 shrink-0">
                {images.map((src, idx) => (
                  <button
                    key={src + idx}
                    onClick={() => setImgIndex(idx)}
                    className={`relative aspect-[3/4] overflow-hidden border transition-all cursor-pointer ${
                      idx === imgIndex ? 'border-white' : 'border-zinc-800 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Imagen principal */}
            <div className="relative flex-1 aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-zinc-925 group/gallery">
              {images.length > 0 ? (
                <img
                  src={images[imgIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl text-zinc-700 font-light tracking-widest">FKUS</span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                    className="sm:hidden absolute left-0 top-0 bottom-0 w-1/4 flex items-center justify-start pl-3 text-white cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => setImgIndex(i => (i + 1) % images.length)}
                    className="sm:hidden absolute right-0 top-0 bottom-0 w-1/4 flex items-center justify-end pr-3 text-white cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" strokeWidth={1.5} />
                  </button>
                  <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
                    {images.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-px transition-all duration-300 ${idx === imgIndex ? 'w-4 bg-white' : 'w-2.5 bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {discount > 0 && (
                <div className="absolute top-4 left-4 border border-white/70 text-white text-[10px] font-medium px-2.5 py-1 tracking-[0.15em] uppercase">
                  −{discount}%
                </div>
              )}
            </div>
          </div>

          {/* ── Panel de Información ── */}
          <div className="flex flex-col pt-1 lg:pt-2">

            {/* Breadcrumb marca / categoría */}
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-zinc-400 mb-3">
              {product.marca && <span className="text-white font-semibold">{product.marca}</span>}
              {product.marca && product.categories?.name && <span className="text-zinc-600">•</span>}
              {product.categories?.name && <span>{product.categories.name}</span>}
              {product.unit && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span>{product.unit}</span>
                </>
              )}
            </div>

            {/* Nombre */}
            <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-wide leading-snug mb-5">
              {product.name}
            </h1>

            {/* Precio */}
            <div className="flex items-baseline gap-3">
              {hasPrice && (
                <span className="text-xl font-semibold text-white">
                  {formatMoney(product.price)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-sm text-zinc-500 line-through font-light">
                  {formatMoney(product.compare_at_price)}
                </span>
              )}
            </div>

            {!inStock && (
              <span className="inline-block mt-3 text-[11px] font-bold text-red-400 uppercase tracking-widest w-fit">
                Sin stock
              </span>
            )}

            {/* Colores */}
            {colorList.length > 0 && (
              <div className="mt-8">
                <span className="block text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-3">
                  Color {selectedColor && <span className="text-zinc-500">— {selectedColor}</span>}
                </span>
                <div className="flex flex-wrap gap-2">
                  {colorList.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-4 py-2 border text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
                        selectedColor === c
                          ? 'border-white text-white'
                          : 'border-zinc-700 text-zinc-400 hover:border-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Talles */}
            {sizeList.length > 0 && (
              <div className="mt-6">
                <span className="block text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-3">
                  Talle {selectedSize && <span className="text-zinc-500">— {selectedSize}</span>}
                </span>
                <div className="flex flex-wrap gap-2">
                  {sizeList.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[48px] px-3.5 py-2.5 border text-[11px] font-medium uppercase transition-colors cursor-pointer ${
                        selectedSize === s
                          ? 'border-white bg-white text-black'
                          : 'border-zinc-700 text-zinc-300 hover:border-zinc-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Añadir al carrito */}
            {hasPrice && (
              <button
                onClick={handleAdd}
                disabled={!inStock}
                className={`mt-10 w-full py-4 uppercase tracking-[0.2em] text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  justAdded ? 'bg-white text-black' : 'bg-black border border-zinc-700 text-white hover:border-white'
                }`}
              >
                {justAdded ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Agregado al carrito
                  </span>
                ) : inStock ? 'Añadir al carrito' : 'Sin stock disponible'}
              </button>
            )}

            <button
              onClick={handleWhatsAppContact}
              className="mt-4 text-[11px] text-zinc-400 hover:text-white underline underline-offset-4 decoration-zinc-600 hover:decoration-white transition-colors cursor-pointer w-fit"
            >
              Consultar por WhatsApp
            </button>

            {justAdded && (
              <button
                onClick={() => setIsOpen(true)}
                className="mt-3 text-[11px] font-bold text-zinc-300 hover:text-white uppercase tracking-widest w-fit cursor-pointer"
              >
                Ver carrito →
              </button>
            )}
          </div>
        </div>
      </div>

      <WhatsAppFAB
        showMenu={showContactMenu}
        setShowMenu={setShowContactMenu}
        onContact={handleWhatsAppContact}
      />
    </div>
  )
}
