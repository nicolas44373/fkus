'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import WhatsAppFAB from './components/WhatsAppFAB'
import Header from './components/Header'
import { useCart } from './context/CartContext'
import { motion, AnimatePresence } from 'framer-motion'

type ProductRow = {
  id: number | string
  name: string
  price: string | null
  compare_at_price?: string | null
  sizes?: string | null
  colors?: string | null
  unit: string | null
  category_id: number | string
  marca: string | null
  in_stock?: boolean
  image_url?: string | null
  created_at: string
  updated_at: string
  categories?: {
    name: string
  } | null
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
  onAdd: (size: string, color: string) => void
  onUpdateQty: (qty: number) => void
  onOpenCart: () => void
}) => {
  const [effects, setEffects] = useState<{ id: number }[]>([])

  const sizeList = product.sizes ? product.sizes.split(',').map(s => s.trim()).filter(Boolean) : []
  const colorList = product.colors ? product.colors.split(',').map(c => c.trim()).filter(Boolean) : []

  const [selectedSize, setSelectedSize] = useState(sizeList[0] || '')
  const [selectedColor, setSelectedColor] = useState(colorList[0] || '')

  const discount = product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price || '0')
    ? Math.round((1 - parseFloat(product.price || '0') / parseFloat(product.compare_at_price)) * 100)
    : 0

  const triggerEffect = () => {
    const newId = Date.now() + Math.random()
    setEffects(prev => [...prev, { id: newId }])
    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== newId))
    }, 800)
  }

  const handleAdd = () => {
    triggerEffect()
    onAdd(selectedSize, selectedColor)
  }

  return (
    <div className={`relative rounded-[2rem] border shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col ${card}`}>
      {/* Absolute floating +1 bubbles */}
      <AnimatePresence>
        {effects.map(eff => {
          const label = '🛍️ +1'
          return (
            <motion.span
              key={eff.id}
              initial={{ opacity: 0, y: 15, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: -75, scale: [0.8, 1.2, 1, 0.8], rotate: Math.random() * 20 - 10 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black font-black text-[10px] px-3 py-1.5 rounded-full shadow-lg border-2 border-black z-20 pointer-events-none select-none flex items-center gap-1 shrink-0 uppercase tracking-widest"
            >
              {label}
            </motion.span>
          )
        })}
      </AnimatePresence>

      {/* Imagen del Producto - Portrait Aspect Ratio */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-zinc-900 border-b border-zinc-800 flex items-center justify-center shrink-0">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
          />
        ) : (
          <span className="text-3xl text-zinc-700">🧥</span>
        )}
        
        {/* Badge 30% OFF */}
        {discount > 0 && (
          <div className="absolute top-3.5 left-3.5 bg-black text-white text-[9px] font-black px-2.5 py-1 tracking-widest uppercase z-10 border border-zinc-800/80 shadow-md">
            {discount}% OFF
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 bg-zinc-900/40 backdrop-blur-sm">
        
        {/* Selectores de Talle y Color */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="block text-[9px] font-black text-zinc-350 uppercase tracking-wider mb-1">
              Color
            </label>
            <div className="relative">
              <select
                value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-[11px] font-bold px-2.5 py-2 rounded-xl text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600 appearance-none cursor-pointer"
              >
                {colorList.length > 0 ? (
                  colorList.map(c => <option key={c} value={c}>{c}</option>)
                ) : (
                  <option value="">Único</option>
                )}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-300 text-[9px]">
                ▼
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-black text-zinc-350 uppercase tracking-wider mb-1">
              Talle
            </label>
            <div className="relative">
              <select
                value={selectedSize}
                onChange={e => setSelectedSize(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-[11px] font-bold px-2.5 py-2 rounded-xl text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600 appearance-none cursor-pointer"
              >
                {sizeList.length > 0 ? (
                  sizeList.map(s => <option key={s} value={s}>{s}</option>)
                ) : (
                  <option value="">Único</option>
                )}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-300 text-[9px]">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Botón AGREGAR AL CARRITO con línea arriba y abajo */}
        {hasPrice && (
          <button
            onClick={handleAdd}
            className="w-full border-y border-zinc-800 hover:border-zinc-600 hover:bg-white hover:text-black py-2.5 uppercase tracking-[0.2em] text-[10px] font-black text-center cursor-pointer transition-all duration-300 text-zinc-200 mb-4 select-none"
          >
            Agregar al carrito
          </button>
        )}

        {/* Nombre del Producto */}
        <h3 className="font-extrabold text-xs text-zinc-100 uppercase tracking-wide leading-snug line-clamp-2 mb-2 min-h-[32px]" title={product.name}>
          {product.name}
        </h3>

        {/* Marca y Precios */}
        <div className="mt-auto pt-2 border-t border-zinc-800/40 flex items-center justify-between gap-2">
          {product.price && (
            <div className="flex items-baseline gap-2">
              <span className="font-black text-sm sm:text-base text-white">
                {formatMoney(product.price)}
              </span>
              {product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price || '0') && (
                <span className="text-[11px] text-zinc-550 line-through font-medium">
                  {formatMoney(product.compare_at_price)}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col items-end shrink-0">
            {product.marca && (
              <span className="text-[9px] font-black text-zinc-350 tracking-wider uppercase">
                {product.marca}
              </span>
            )}
            {product.unit && (
              <span className="text-[8px] font-extrabold text-zinc-250 tracking-widest uppercase mt-0.5">
                {product.unit}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CatalogContent() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')
  const { addItem, updateQty, getQty, setIsOpen } = useCart()

  const [products, setProducts]       = useState<ProductRow[]>([])
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const [parentCategoryId, setParentCategoryId] = useState<string | number | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [darkMode, setDarkMode]       = useState(true)
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
      try {
        setLoading(true)
        
        let catName = 'Colección Completa'
        let parentIdVal: string | number | null = null
        let categoryIdsToFetch: any[] = []
        if (categoryId) {
          const { data: cat, error: catErr } = await supabase
            .from('categories').select('id, name').eq('id', categoryId).maybeSingle()
          if (catErr) throw catErr
          if (cat) {
            catName = cat.name
            if (catName.includes(' - ')) {
              const parentName = catName.split(' - ')[0].trim()
              const { data: parentCat } = await supabase
                .from('categories').select('id').eq('name', parentName).maybeSingle()
              if (parentCat) parentIdVal = parentCat.id
              categoryIdsToFetch = [cat.id]
            } else {
              const { data: relatedCats } = await supabase
                .from('categories')
                .select('id')
                .like('name', `${catName} - %`)
              const relatedIds = (relatedCats || []).map((c: any) => c.id)
              categoryIdsToFetch = [cat.id, ...relatedIds]
            }
          }
        }
        setCategoryName(catName)
        setParentCategoryId(parentIdVal)

        let prods = null
        let query = supabase
          .from('products')
          .select('id, name, price, compare_at_price, sizes, colors, unit, marca, category_id, in_stock, image_url, categories(name)')
          .eq('in_stock', true)
          .not('price', 'is', null)
          .order('name')

        if (categoryId && categoryIdsToFetch.length > 0) {
          query = query.in('category_id', categoryIdsToFetch)
        }

        const { data: prodsData, error: prodErr } = await query

        if (prodErr) {
          if (prodErr.code === '42703') {
            console.warn('Supabase: Las columnas de indumentaria no existen todavía. Ejecutando fallback.')
            let fallbackQuery = supabase
              .from('products')
              .select('id, name, price, unit, marca, category_id, in_stock, image_url, categories(name)')
              .eq('in_stock', true)
              .not('price', 'is', null)
              .order('name')

            if (categoryId && categoryIdsToFetch.length > 0) {
              fallbackQuery = fallbackQuery.in('category_id', categoryIdsToFetch)
            }

            const { data: fallbackData, error: fallbackErr } = await fallbackQuery
            if (fallbackErr) throw fallbackErr
            prods = fallbackData
          } else {
            throw prodErr
          }
        } else {
          prods = prodsData
        }
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
    const cat = categoryId && categoryName ? ` de ${categoryName}` : ''
    const msg = `Hola! Me interesa obtener información sobre productos${cat} por mayor.`
    window.open(`https://wa.me/+5493854021865?text=${encodeURIComponent(msg)}`, '_blank')
    setShowContactMenu(false)
  }

  const dm = darkMode
  const bg   = dm ? 'bg-transparent' : 'bg-zinc-100'
  const card = dm ? 'bg-zinc-900/60 backdrop-blur-sm border-zinc-800' : 'bg-white border-zinc-200'
  const txt  = dm ? 'text-white'  : 'text-zinc-900'
  const sub  = dm ? 'text-zinc-300' : 'text-zinc-500'

  /* ── Product Card Wrapper ── */
  const ProductCardWrapper = ({ product }: { product: ProductRow }) => {
    const qty = getQty(product.cartItemId || product.id)
    const hasPrice = !!product.price

    const handleAdd = (size: string, color: string) => {
      const cartItemId = `${product.id}-${size || ''}-${color || ''}`
      addItem({
        id:           product.id,
        cartItemId,
        name:         product.name,
        price:        product.price ?? '0',
        selectedSize: size || undefined,
        selectedColor: color || undefined,
        unit:         product.unit ?? undefined,
        categoryName: product.categories?.name ?? undefined,
        image_url:    product.image_url ?? undefined,
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
        onUpdateQty={(newQty) => updateQty(product.cartItemId || product.id, newQty)}
        onOpenCart={() => setIsOpen(true)}
      />
    )
  }

  /* ── Loading ── */
  if (loading) return (
    <div className={`min-h-screen flex flex-col ${bg}`}>
      <Header />
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-zinc-850" />
            <div className="absolute inset-0 rounded-full border-4 border-t-white animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">FKUS</div>
          </div>
          <p className="font-extrabold text-zinc-200 tracking-wider text-xs uppercase">Cargando colección…</p>
        </div>
      </div>
    </div>
  )

  /* ── Error ── */
  if (error) return (
    <div className={`min-h-screen flex flex-col ${bg}`}>
      <Header />
      <div className="flex-1 flex items-center justify-center py-20 text-center max-w-md px-6 mx-auto">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-500 font-semibold mb-5">{error}</p>
      </div>
    </div>
  )

  const searchTerm = searchParams.get('search') || ''
  const searchedProducts = products.filter(p => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      p.name.toLowerCase().includes(term) ||
      (p.marca && p.marca.toLowerCase().includes(term)) ||
      (p.categories?.name && p.categories.name.toLowerCase().includes(term))
    )
  })

  // Group products by category
  const productsByCategory: Record<string, ProductRow[]> = {}
  searchedProducts.forEach(p => {
    const catName = p.categories?.name || 'Otros'
    if (!productsByCategory[catName]) {
      productsByCategory[catName] = []
    }
    productsByCategory[catName].push(p)
  })

  return (
    <div className={`min-h-screen ${bg}`}>
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Breadcrumbs & Huge Title Section */}
        <div className="mb-12 select-none">
          {/* Breadcrumbs */}
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <span className="hover:text-white cursor-pointer" onClick={() => router.push('/')}>Inicio</span>
            {categoryName && categoryName !== 'Colección Completa' && (
              <>
                <span>|</span>
                {categoryName.includes(' - ') ? (
                  <>
                    <span 
                      className="hover:text-white cursor-pointer" 
                      onClick={() => {
                        if (parentCategoryId) router.push(`/?category=${parentCategoryId}`)
                        else router.push('/')
                      }}
                    >
                      {categoryName.split(' - ')[0].trim()}
                    </span>
                    <span>|</span>
                    <span className="text-white">{categoryName.split(' - ')[1].trim()}</span>
                  </>
                ) : (
                  <span className="hover:text-white cursor-pointer" onClick={() => router.push(`/?category=${categoryId}`)}>{categoryName}</span>
                )}
              </>
            )}
            {searchTerm && (
              <>
                <span>|</span>
                <span className="text-white">{searchTerm}</span>
              </>
            )}
          </div>

          {/* Huge Heading */}
          <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-widest leading-none mb-6">
            {searchTerm ? searchTerm : (
              categoryName === 'Colección Completa' 
                ? 'Colección Completa' 
                : (categoryName.includes(' - ') ? categoryName.split(' - ')[1].trim() : categoryName)
            )}
          </h1>

          {/* Filtrar y Ordenar Trigger Link */}
          <div>
            <button
              onClick={() => {
                window.dispatchEvent(new Event('open-menu-drawer'))
              }}
              className="text-xs font-black uppercase tracking-widest text-white border-b border-white pb-0.5 hover:text-zinc-300 hover:border-zinc-300 transition-all cursor-pointer bg-transparent border-t-0 border-x-0 outline-none rounded-none"
            >
              Filtrar y ordenar
            </button>
          </div>
        </div>

        {/* Sin productos */}
        {searchedProducts.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📦</div>
            <p className={`text-lg font-semibold mb-2 ${txt}`}>No hay productos disponibles.</p>
            <p className={`text-sm ${sub}`}>Los productos aparecerán aquí una vez cargados.</p>
          </div>
        ) : (
          <>
            {/* If no category is selected, render grouped by category */}
            {!categoryId ? (
              <div className="space-y-12">
                {Object.entries(productsByCategory).map(([catName, list]) => (
                  <div key={catName} className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-850 pb-3">
                      <span className="w-1.5 h-6 bg-white rounded-full" />
                      <h2 className={`text-lg font-black uppercase tracking-[0.15em] ${txt}`}>{catName}</h2>
                      <span className="text-xs text-zinc-300 font-bold">({list.length})</span>
                    </div>
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {list.map(p => <ProductCardWrapper key={p.id} product={p} />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Filtered category view
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {searchedProducts.map(p => <ProductCardWrapper key={p.id} product={p} />)}
              </div>
            )}
          </>
        )}

        {/* Footer CTA */}
        {searchedProducts.length > 0 && (
          <div className={`mt-16 rounded-[2rem] border p-8 text-center ${card}`}>
            <div className="text-3xl mb-3">💬</div>
            <h3 className={`font-black text-base uppercase tracking-widest mb-1 ${txt}`}>¿Necesitás más información?</h3>
            <p className={`text-xs ${sub} mb-6 leading-relaxed max-w-sm mx-auto`}>
              Consultanos por WhatsApp sobre disponibilidad, talles especiales o envíos premium.
            </p>
            <button
              onClick={handleWhatsAppContact}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-md transition-all duration-200 select-none cursor-pointer"
            >
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-850" />
          <div className="absolute inset-0 rounded-full border-4 border-t-white animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">FKUS</div>
        </div>
        <p className="font-extrabold text-zinc-350 tracking-wider text-xs uppercase">Cargando colección…</p>
      </div>
    </div>
  )
}

export default function MainPage() {
  return (
    <Suspense fallback={<CatalogLoading />}>
      <CatalogContent />
    </Suspense>
  )
}
