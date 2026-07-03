'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import WhatsAppFAB from '../components/WhatsAppFAB'
import { useCart } from '../context/CartContext'
import { motion, AnimatePresence } from 'framer-motion'

type ProductRow = {
  id: number | string
  name: string
  price: string | null
  unit: string | null
  category_id: number | string
  marca: string | null
  in_stock?: boolean
  image_url?: string | null
  created_at: string
  updated_at: string
}

const formatMoney = (value: string | null) => {
  if (!value) return '—'
  const num = parseFloat(value)
  if (isNaN(num)) return '—'
  return `$ ${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const ProductCard = ({
  product,
  qty,
  hasPrice,
  dm,
  categoryName,
  card,
  txt,
  sub,
  onAdd,
  onUpdateQty,
  onOpenCart,
}: {
  product: ProductRow
  qty: number
  hasPrice: boolean
  dm: boolean
  categoryName: string | null
  card: string
  txt: string
  sub: string
  onAdd: () => void
  onUpdateQty: (qty: number) => void
  onOpenCart: () => void
}) => {
  const [effects, setEffects] = useState<{ id: number }[]>([])

  const triggerEffect = () => {
    const newId = Date.now() + Math.random()
    setEffects(prev => [...prev, { id: newId }])
    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== newId))
    }, 800)
  }

  const handleAdd = () => {
    triggerEffect()
    onAdd()
  }

  const handlePlus = () => {
    triggerEffect()
    onUpdateQty(qty + 1)
  }

  return (
    <div className={`relative rounded-3xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col ${card}`}>
      {/* Absolute floating +1 bubbles */}
      <AnimatePresence>
        {effects.map(eff => {
          const label = '📦 +1'
          return (
            <motion.span
              key={eff.id}
              initial={{ opacity: 0, y: 15, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: -75, scale: [0.8, 1.2, 1, 0.8], rotate: Math.random() * 20 - 10 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-lg border-2 border-white z-20 pointer-events-none select-none flex items-center gap-1 shrink-0"
            >
              {label}
            </motion.span>
          )
        })}
      </AnimatePresence>

      {/* Stripe acento */}
      <div className={`h-1.5 ${qty > 0 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`} />

      {/* Imagen del Producto */}
      {product.image_url && (
        <div className="relative w-full h-40 overflow-hidden bg-gray-100/50 border-b border-gray-100 flex items-center justify-center shrink-0">
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
          />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Nombre */}
        <h3 className={`font-extrabold text-sm sm:text-base leading-snug line-clamp-3 mb-2 min-h-[48px] ${txt}`}>
          {product.name}
        </h3>

        {/* Marca */}
        {product.marca && categoryName !== 'Rebozados' && (
          <span className={`self-start text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-3 shadow-sm ${
            dm ? 'bg-gray-700 text-gray-300' : 'bg-amber-50 text-amber-700 border border-amber-100/80'
          }`}>
            {product.marca}
          </span>
        )}

        {/* Precios */}
        <div className="space-y-2 mb-4">
          {product.price && (
            <div className={`flex flex-col items-start justify-center rounded-2xl px-4 py-2 border transition-all ${
              dm 
                ? 'bg-emerald-950/40 border-emerald-900/40 text-emerald-300' 
                : 'bg-emerald-50/80 border-emerald-100/60 text-emerald-800'
            }`}>
              <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-80 mb-0.5">
                Precio unidad
              </span>
              <span className="font-black text-lg sm:text-xl leading-none whitespace-nowrap">
                {formatMoney(product.price)}
              </span>
            </div>
          )}

        </div>

        {/* Unidad */}
        {product.unit && (
          <p className={`text-xs font-semibold mb-4 flex items-center gap-1 ${sub}`}>
            📏 <span className="opacity-90">{product.unit}</span>
          </p>
        )}

        {/* ── Controles carrito ── */}
        {hasPrice && (
          <div className="mt-auto pt-2">
            {qty === 0 ? (
              <button
                onClick={handleAdd}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 text-white stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                Agregar al pedido
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQty(qty - 1)}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-red-300 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-all font-bold text-lg bg-white shrink-0 cursor-pointer"
                >
                  −
                </button>
                <div className="flex-1 text-center min-w-[30px]">
                  <span className={`font-black text-lg ${txt}`}>{qty}</span>
                </div>
                <button
                  onClick={handlePlus}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 active:scale-90 transition-all font-bold text-lg bg-white shrink-0 cursor-pointer"
                >
                  +
                </button>
                <button
                  onClick={onOpenCart}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition-colors shrink-0 flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                >
                  Ver pedido
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function CatalogContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const categoryId = searchParams.get('category')
  const { addItem, updateQty, getQty, setIsOpen, count } = useCart()

  const [products, setProducts]       = useState<ProductRow[]>([])
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [darkMode, setDarkMode]       = useState(false)
  const [showContactMenu, setShowContactMenu] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved) setDarkMode(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    window.dispatchEvent(new Event('theme-change'))
  }, [darkMode])

  useEffect(() => {
    const load = async () => {
      if (!categoryId) { setError('No se seleccionó ninguna categoría.'); setLoading(false); return }
      try {
        setLoading(true)
        const { data: cat, error: catErr } = await supabase
          .from('categories').select('name').eq('id', categoryId).maybeSingle()
        if (catErr) throw catErr
        if (!cat) { setError('La categoría no existe.'); return }
        setCategoryName((cat as { name: string }).name)

        const { data: prods, error: prodErr } = await supabase
          .from('products')
          .select('id, name, price, unit, marca, category_id, in_stock, image_url')
          .eq('category_id', categoryId)
          .eq('in_stock', true)
          .not('price', 'is', null)
          .order('name')
        if (prodErr) throw prodErr
        setProducts((prods as ProductRow[]) || [])
      } catch (e: any) {
        console.error(e)
        setError('Ocurrió un error al cargar los productos.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [categoryId])

  const handleWhatsAppContact = () => {
    const cat = categoryName ? ` de ${categoryName}` : ''
    const msg = `Hola! Me interesa obtener información sobre productos${cat} por mayor.`
    window.open(`https://wa.me/+5493854021865?text=${encodeURIComponent(msg)}`, '_blank')
    setShowContactMenu(false)
  }

  const groupByBrand = (list: ProductRow[]) => {
    const g: Record<string, ProductRow[]> = {}
    list.forEach(p => { const b = p.marca || 'Sin marca'; if (!g[b]) g[b] = []; g[b].push(p) })
    return g
  }

  const scrollToBrand = (brand: string) => {
    const el = document.getElementById(`brand-${brand}`)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 100, behavior: 'smooth' })
  }

  const dm = darkMode
  const bg   = dm ? 'bg-gray-900' : 'bg-gray-50'
  const card = dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
  const txt  = dm ? 'text-white'  : 'text-gray-900'
  const sub  = dm ? 'text-gray-400' : 'text-gray-500'

  /* ── Product Card Wrapper ── */
  const ProductCardWrapper = ({ product }: { product: ProductRow }) => {
    const qty = getQty(product.id)
    const hasPrice = !!product.price

    const handleAdd = () => {
      addItem({
        id:           product.id,
        name:         product.name,
        price:        product.price ?? '0',
        unit:         product.unit ?? undefined,
        categoryName: categoryName ?? undefined,
      })
    }

    return (
      <ProductCard
        product={product}
        qty={qty}
        hasPrice={hasPrice}
        dm={dm}
        categoryName={categoryName}
        card={card}
        txt={txt}
        sub={sub}
        onAdd={handleAdd}
        onUpdateQty={(newQty) => updateQty(product.id, newQty)}
        onOpenCart={() => setIsOpen(true)}
      />
    )
  }

  /* ── Loading ── */
  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${bg}`}>
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-amber-100" />
          <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xl">🐔</div>
        </div>
        <p className={`font-semibold ${sub}`}>Cargando productos…</p>
      </div>
    </div>
  )

  /* ── Error ── */
  if (error) return (
    <div className={`min-h-screen flex items-center justify-center ${bg}`}>
      <div className="text-center max-w-md px-6">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-500 font-semibold mb-5">{error}</p>
        <button onClick={() => router.back()} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
          ← Volver
        </button>
      </div>
    </div>
  )

  const isRebozados = categoryName === 'Rebozados'
  const grouped = isRebozados ? groupByBrand(products) : null
  const brands = grouped ? Object.keys(grouped).sort() : []

  return (
    <div className={`min-h-screen ${bg}`}>

      {/* ── Header sticky ── */}
      <div className={`sticky top-0 z-20 border-b backdrop-blur-md ${dm ? 'bg-gray-900/90 border-gray-700' : 'bg-white/95 border-gray-200'} shadow-sm`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className={`shrink-0 flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                dm ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <div className={`w-px h-5 shrink-0 ${dm ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <div className="min-w-0">
              <h1 className={`text-lg font-extrabold truncate ${txt}`}>{categoryName ?? 'Catálogo'}</h1>
              {products.length > 0 && (
                <p className={`text-xs ${sub}`}>{products.length} producto{products.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Dark mode */}
            <button
              onClick={() => setDarkMode(!dm)}
              className={`p-2 rounded-xl transition-colors ${dm ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {dm ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Botón carrito */}
            <div className="relative shrink-0">
              {count > 0 && (
                <span className="absolute inset-0 rounded-xl bg-amber-500/30 animate-ping pointer-events-none" style={{ animationDuration: '2s' }} />
              )}
              <motion.button
                key={`catalog-cart-${count}`}
                animate={count > 0 ? {
                  scale: [1, 1.1, 0.95, 1],
                  y: [0, -4, 2, 0]
                } : {}}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                onClick={() => setIsOpen(true)}
                className="relative flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
              >
                <motion.div
                  key={count}
                  animate={count > 0 ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className="shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </motion.div>
                <span className="hidden sm:inline font-extrabold">Mi pedido</span>
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ duration: 0.3, type: 'spring', stiffness: 500, damping: 15 }}
                      className="absolute -top-1.5 -right-1.5 w-5.5 h-5.5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md border border-white"
                    >
                      {count > 99 ? '99+' : count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Banner */}
        <div className={`flex items-center gap-3 rounded-2xl px-5 py-3 mb-7 ${
          dm ? 'bg-emerald-900/30 border border-emerald-800' : 'bg-emerald-50 border border-emerald-200'
        }`}>
          <span className="text-lg">🚚</span>
          <p className={`text-sm font-semibold ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>
            Envíos 100% gratis · Pedidos de 8:30 a 20:00 hs · Reparto al día siguiente
          </p>
        </div>

        {/* Sin productos */}
        {products.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📦</div>
            <p className={`text-lg font-semibold mb-2 ${txt}`}>No hay productos con precio en esta categoría.</p>
            <p className={`text-sm ${sub}`}>Los precios se mostrarán aquí una vez que estén disponibles.</p>
          </div>
        ) : (
          <>
            {/* Filtro de marcas (Rebozados) */}
            {isRebozados && brands.length > 1 && (
              <div className={`mb-7 rounded-2xl p-5 border ${card}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${sub}`}>Ir a marca</p>
                <div className="flex flex-wrap gap-2">
                  {brands.map(brand => (
                    <button
                      key={brand}
                      onClick={() => scrollToBrand(brand)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-150"
                    >
                      {brand}
                      <span className="bg-white/25 rounded-full px-1.5 py-0.5 text-xs">{grouped![brand].length}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grid */}
            {isRebozados && grouped ? (
              <div className="space-y-10">
                {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([brand, list]) => (
                  <div key={brand} id={`brand-${brand}`} className={`rounded-2xl p-6 border scroll-mt-24 ${card}`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
                      <div>
                        <h2 className={`text-xl font-extrabold ${txt}`}>{brand}</h2>
                        <p className={`text-xs ${sub}`}>{list.length} producto{list.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {list.map(p => <ProductCardWrapper key={p.id} product={p} />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map(p => <ProductCardWrapper key={p.id} product={p} />)}
              </div>
            )}
          </>
        )}

        {/* Footer CTA */}
        {products.length > 0 && (
          <div className={`mt-12 rounded-2xl border p-7 text-center ${card}`}>
            <div className="text-3xl mb-3">💬</div>
            <h3 className={`font-bold text-lg mb-1 ${txt}`}>¿Necesitás más información?</h3>
            <p className={`text-sm mb-5 ${sub}`}>
              Consultanos por WhatsApp sobre disponibilidad, cantidades y condiciones.
            </p>
            <button
              onClick={handleWhatsAppContact}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar por WhatsApp
            </button>
          </div>
        )}
      </div>

      <WhatsAppFAB
        showMenu={showContactMenu}
        setShowMenu={setShowContactMenu}
        onContact={handleWhatsAppContact}
      />
    </div>
  )
}

function CatalogLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-amber-100" />
          <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xl">🐔</div>
        </div>
        <p className="text-gray-500 font-semibold">Cargando productos…</p>
      </div>
    </div>
  )
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogLoading />}>
      <CatalogContent />
    </Suspense>
  )
}
