'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import WhatsAppFAB from '@/app/components/WhatsAppFAB'
import { useCart } from '@/app/context/CartContext'
import { ChevronLeft, ChevronRight, Check, ArrowLeft, Plus, Minus, Truck, ShieldCheck, Ruler } from 'lucide-react'

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
  const [quantity, setQuantity] = useState(1)
  const [openSection, setOpenSection] = useState<string | null>('detalles')
  const [related, setRelated] = useState<Product[]>([])

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
        setQuantity(1)

        if (p.category_id) {
          const { data: rel } = await supabase
            .from('products')
            .select('id, name, price, compare_at_price, sizes, colors, unit, marca, category_id, stock_quantity, image_urls, categories(name)')
            .eq('category_id', p.category_id)
            .neq('id', p.id)
            .limit(4)
          setRelated((rel as any) || [])
        } else {
          setRelated([])
        }
      }
      setLoading(false)
    }
    load()
  }, [params?.id])

  const toggleSection = (key: string) => setOpenSection(prev => prev === key ? null : key)

  const handleWhatsAppContact = () => {
    const msg = `Hola! Me interesa consultar sobre "${product?.name}".`
    window.open(`https://wa.me/+5493813504756?text=${encodeURIComponent(msg)}`, '_blank')
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
    for (let i = 0; i < quantity; i++) {
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
    }
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
          className="flex items-center gap-1.5 text-[11px] font-bold text-smoke hover:text-bone uppercase tracking-widest mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> Volver
        </button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">

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
                      idx === imgIndex ? 'border-gold-500' : 'border-hairline opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Imagen principal con zoom sutil al hover */}
            <div className="relative flex-1 aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-surface-raised group/gallery cursor-zoom-in">
              {images.length > 0 ? (
                <img
                  src={images[imgIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/gallery:scale-110"
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
                <div className="absolute top-4 left-4 bg-gold-500 text-black text-[10px] font-black px-2.5 py-1 tracking-[0.15em] uppercase">
                  −{discount}%
                </div>
              )}
            </div>
          </div>

          {/* ── Panel de Información (sticky en desktop) ── */}
          <div className="flex flex-col pt-1 lg:pt-2 lg:sticky lg:top-24">

            {/* Breadcrumb marca / categoría */}
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-smoke mb-3">
              {product.marca && <span className="text-bone font-semibold">{product.marca}</span>}
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
            <h1 className="text-2xl sm:text-3xl font-medium text-bone tracking-wide leading-snug mb-5">
              {product.name}
            </h1>

            {/* Precio */}
            <div className="flex items-baseline gap-3">
              {hasPrice && (
                <span className="text-xl font-semibold text-bone">
                  {formatMoney(product.price)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-sm text-smoke line-through font-light">
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
                <span className="block text-[10px] font-medium text-smoke uppercase tracking-widest mb-3">
                  Color {selectedColor && <span className="text-zinc-500">— {selectedColor}</span>}
                </span>
                <div className="flex flex-wrap gap-2">
                  {colorList.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-4 py-2 border text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
                        selectedColor === c
                          ? 'border-gold-500 text-gold-400'
                          : 'border-hairline text-smoke hover:border-zinc-500 hover:text-zinc-200'
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
                <div className="flex items-center justify-between mb-3">
                  <span className="block text-[10px] font-medium text-smoke uppercase tracking-widest">
                    Talle {selectedSize && <span className="text-zinc-500">— {selectedSize}</span>}
                  </span>
                  <button
                    onClick={() => {
                      setOpenSection('talles')
                      document.getElementById('section-talles')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    className="text-[10px] font-bold text-smoke hover:text-gold-400 uppercase tracking-widest underline underline-offset-2 cursor-pointer"
                  >
                    Guía de talles
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizeList.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[48px] px-3.5 py-2.5 border text-[11px] font-medium uppercase transition-colors cursor-pointer ${
                        selectedSize === s
                          ? 'border-gold-500 bg-gold-500 text-black'
                          : 'border-hairline text-smoke hover:border-zinc-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cantidad */}
            <div className="mt-6">
              <span className="block text-[10px] font-medium text-smoke uppercase tracking-widest mb-3">Cantidad</span>
              <div className="inline-flex items-center border border-hairline">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center text-smoke hover:text-bone transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-9 text-center text-xs font-semibold text-bone select-none">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-9 h-9 flex items-center justify-center text-smoke hover:text-bone transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Añadir al carrito (desktop / tablet — en mobile hay una barra sticky abajo) */}
            {hasPrice && (
              <button
                onClick={handleAdd}
                disabled={!inStock}
                className={`hidden sm:block mt-8 w-full py-4 uppercase tracking-[0.2em] text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  justAdded ? 'bg-gold-500 text-black' : 'bg-ink border border-zinc-700 text-bone hover:border-gold-500'
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
              className="mt-4 text-[11px] text-smoke hover:text-bone underline underline-offset-4 decoration-zinc-600 hover:decoration-gold-500 transition-colors cursor-pointer w-fit"
            >
              Consultar por WhatsApp
            </button>

            {justAdded && (
              <button
                onClick={() => setIsOpen(true)}
                className="mt-3 text-[11px] font-bold text-smoke hover:text-gold-400 uppercase tracking-widest w-fit cursor-pointer"
              >
                Ver carrito →
              </button>
            )}

            {/* Detalles desplegables */}
            <div className="mt-10 border-t border-hairline">
              {[
                { key: 'detalles', icon: ShieldCheck, title: 'Detalles del producto', body: 'Pieza de producción limitada. Confeccionada con materiales premium seleccionados para garantizar durabilidad y calidad de caída.' },
                { key: 'talles', icon: Ruler, title: 'Guía de talles', body: 'Las medidas pueden variar levemente según el modelo. Ante la duda entre dos talles, recomendamos elegir el mayor.' },
                { key: 'envios', icon: Truck, title: 'Envíos y devoluciones', body: 'Despachamos de forma inmediata con packaging premium. Coordinamos entrega y cambios directamente por WhatsApp.' },
              ].map(({ key, icon: Icon, title, body }) => (
                <div key={key} id={`section-${key}`} className="border-b border-hairline">
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between py-4 text-left cursor-pointer group"
                  >
                    <span className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest text-bone">
                      <Icon className="w-3.5 h-3.5 text-gold-500" strokeWidth={1.8} />
                      {title}
                    </span>
                    <span className={`text-smoke transition-transform duration-300 ${openSection === key ? 'rotate-45' : ''}`}>
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ease-out ${openSection === key ? 'grid-rows-[1fr] opacity-100 pb-4' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="text-[11px] text-smoke leading-relaxed">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Productos Relacionados ── */}
        {related.length > 0 && (
          <div className="mt-20 pt-10 border-t border-hairline">
            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-bone mb-8">
              También te puede interesar
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map(r => (
                <div
                  key={r.id}
                  onClick={() => router.push(`/producto/${r.id}`)}
                  className="group/rel cursor-pointer"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-surface-raised mb-2.5">
                    {r.image_urls?.[0] ? (
                      <img
                        src={r.image_urls[0]}
                        alt={r.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/rel:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-lg text-zinc-700 font-light tracking-widest">FKUS</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-bone line-clamp-1 mb-0.5">{r.name}</p>
                  {r.price && <p className="text-[11px] text-smoke">{formatMoney(r.price)}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barra sticky de compra (solo mobile) */}
      {hasPrice && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-md border-t border-hairline px-4 py-3 flex items-center gap-3">
          <div className="shrink-0">
            <p className="text-[9px] text-smoke uppercase tracking-widest leading-none mb-0.5">Precio</p>
            <p className="text-sm font-semibold text-bone leading-none">{formatMoney(product.price)}</p>
          </div>
          <button
            onClick={handleAdd}
            disabled={!inStock}
            className={`flex-1 py-3.5 uppercase tracking-[0.2em] text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              justAdded ? 'bg-gold-500 text-black' : 'bg-gold-500 text-black active:bg-gold-400'
            }`}
          >
            {justAdded ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Agregado
              </span>
            ) : inStock ? 'Añadir al carrito' : 'Sin stock'}
          </button>
        </div>
      )}
      <div className="sm:hidden h-20" />

      <Footer />

      <WhatsAppFAB onContact={handleWhatsAppContact} liftForStickyBar={hasPrice} />
    </div>
  )
}
