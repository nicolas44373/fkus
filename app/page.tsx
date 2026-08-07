'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import WhatsAppFAB from './components/WhatsAppFAB'
import Header from './components/Header'
import Footer from './components/Footer'
import { useCart } from './context/CartContext'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { motion } from 'framer-motion'

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
  stock_quantity?: number
  image_urls?: string[] | null
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
  onOpenDetail,
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
  onOpenDetail: () => void
}) => {
  const images = product.image_urls && product.image_urls.length > 0 ? product.image_urls : []
  const [imgIndex, setImgIndex] = useState(0)
  const [justAdded, setJustAdded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const displayIndex = isHovering && images.length > 1 && imgIndex === 0 ? 1 : imgIndex

  const sizeList = product.sizes ? product.sizes.split(',').map(s => s.trim()).filter(Boolean) : []
  const colorList = product.colors ? product.colors.split(',').map(c => c.trim()).filter(Boolean) : []

  const [selectedSize, setSelectedSize] = useState(sizeList[0] || '')
  const [selectedColor, setSelectedColor] = useState(colorList[0] || '')

  const discount = product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price || '0')
    ? Math.round((1 - parseFloat(product.price || '0') / parseFloat(product.compare_at_price)) * 100)
    : 0

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAdd(selectedSize, selectedColor)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1600)
  }

  return (
    <div
      onClick={onOpenDetail}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="group/card relative flex flex-col cursor-pointer"
    >

      {/* Imagen del Producto - Portrait Aspect Ratio */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-surface-raised flex items-center justify-center shrink-0 group/gallery">
        {images.length > 0 ? (
          <img
            src={images[displayIndex]}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover/card:scale-[1.035]"
          />
        ) : (
          <span className="text-2xl text-zinc-700 font-light tracking-widest">FKUS</span>
        )}

        {/* Flechas de navegación (solo si hay más de una imagen) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setImgIndex(i => (i - 1 + images.length) % images.length) }}
              className="absolute left-0 top-0 bottom-0 w-1/4 flex items-center justify-start pl-2 text-white opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-200 z-10 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setImgIndex(i => (i + 1) % images.length) }}
              className="absolute right-0 top-0 bottom-0 w-1/4 flex items-center justify-end pr-2 text-white opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-200 z-10 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" strokeWidth={1.5} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-px transition-all duration-300 ${idx === displayIndex ? 'w-4 bg-white' : 'w-2.5 bg-white/40'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Etiqueta de descuento */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-gold-500 text-black text-[9px] font-black px-2 py-[3px] tracking-[0.15em] uppercase z-10">
            −{discount}%
          </div>
        )}

        {/* Wishlist */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsWishlisted(w => !w) }}
          className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 cursor-pointer ${
            isWishlisted ? 'bg-gold-500 opacity-100' : 'bg-black/40 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 hover:bg-black/60'
          }`}
          title="Guardar en favoritos"
        >
          <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-black stroke-black' : 'fill-none stroke-white'}`} strokeWidth={1.8}>
            <path d="M12 21s-7.5-4.6-10-9C.3 8.3 2 4 6 4c2.2 0 3.8 1.3 6 4 2.2-2.7 3.8-4 6-4 4 0 5.7 4.3 4 8-2.5 4.4-10 9-10 9z" />
          </svg>
        </button>

        {/* Botón agregar al carrito — overlay que aparece al pasar el mouse */}
        {hasPrice && (
          <button
            onClick={handleAdd}
            className={`absolute left-0 right-0 bottom-0 py-3 uppercase tracking-[0.2em] text-[10px] font-semibold text-center cursor-pointer transition-all duration-300 select-none z-10 ${
              justAdded
                ? 'bg-gold-500 text-black translate-y-0'
                : 'bg-ink/90 text-bone translate-y-0 sm:translate-y-full sm:group-hover/card:translate-y-0 hover:bg-ink'
            }`}
          >
            {justAdded ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3 h-3" strokeWidth={2.5} /> Agregado
              </span>
            ) : (
              'Añadir al carrito'
            )}
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 bg-surface/90 backdrop-blur-md border-x border-b border-hairline">

        {/* Marca */}
        {product.marca && (
          <span className="text-[9px] font-medium text-smoke tracking-[0.2em] uppercase mb-1">
            {product.marca}
          </span>
        )}

        {/* Nombre del Producto */}
        <h3 className="text-[11px] text-bone tracking-wide leading-snug line-clamp-2 mb-2 min-h-[28px]" title={product.name}>
          {product.name}
        </h3>

        {/* Precio */}
        <div className="flex items-baseline gap-2 mb-3">
          {product.price && (
            <span className="text-[13px] font-medium text-bone">
              {formatMoney(product.price)}
            </span>
          )}
          {product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price || '0') && (
            <span className="text-[11px] text-smoke line-through font-light">
              {formatMoney(product.compare_at_price)}
            </span>
          )}
        </div>

        {/* Selectores de Talle y Color */}
        <div className="grid grid-cols-2 gap-3 mt-auto pt-3 border-t border-hairline">
          <div className="relative">
            <select
              value={selectedColor}
              onChange={e => setSelectedColor(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="w-full bg-transparent border-b border-hairline hover:border-gold-500 text-[10px] font-medium tracking-wider uppercase pb-1.5 pr-4 text-smoke focus:outline-none focus:border-gold-500 appearance-none cursor-pointer transition-colors"
            >
              {colorList.length > 0 ? (
                colorList.map(c => <option key={c} value={c} className="bg-surface">{c}</option>)
              ) : (
                <option value="">Color único</option>
              )}
            </select>
            <div className="absolute right-0 bottom-1.5 pointer-events-none text-smoke text-[8px]">
              ▾
            </div>
          </div>

          <div className="relative">
            <select
              value={selectedSize}
              onChange={e => setSelectedSize(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="w-full bg-transparent border-b border-hairline hover:border-gold-500 text-[10px] font-medium tracking-wider uppercase pb-1.5 pr-4 text-smoke focus:outline-none focus:border-gold-500 appearance-none cursor-pointer transition-colors"
            >
              {sizeList.length > 0 ? (
                sizeList.map(s => <option key={s} value={s} className="bg-surface">{s}</option>)
              ) : (
                <option value="">Talle único</option>
              )}
            </select>
            <div className="absolute right-0 bottom-1.5 pointer-events-none text-smoke text-[8px]">
              ▾
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CatalogContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const categoryId = searchParams.get('category')
  const { addItem, updateQty, getQty, setIsOpen } = useCart()

  const [products, setProducts]       = useState<ProductRow[]>([])
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const [parentCategoryId, setParentCategoryId] = useState<string | number | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [darkMode, setDarkMode]       = useState(true)
  const [selectedGender, setSelectedGender] = useState<'Todos' | 'Hombre' | 'Mujer'>('Todos')

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
          .select('id, name, price, compare_at_price, sizes, colors, unit, marca, category_id, stock_quantity, image_urls, categories(name)')
          .gt('stock_quantity', 0)
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
              .select('id, name, price, unit, marca, category_id, stock_quantity, image_urls, categories(name)')
              .gt('stock_quantity', 0)
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
    const msg = `Hola! Tengo una consulta sobre productos${cat}.`
    window.open(`https://wa.me/+5493813504756?text=${encodeURIComponent(msg)}`, '_blank')
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
        image_url:    product.image_urls?.[0] ?? undefined,
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
        onOpenDetail={() => router.push(`/producto/${product.id}`)}
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
    if (selectedGender !== 'Todos' && p.unit !== selectedGender) return false
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

  const isDefaultView = !searchTerm && !categoryId

  return (
    <div className={`min-h-screen ${bg}`}>
      <Header />

      {isDefaultView && (
        <section className="relative w-full h-[62vh] sm:h-[82vh] overflow-hidden select-none">
          {/* Mosaico editorial de fondo, tomado del catálogo real */}
          <div className="absolute inset-0 grid grid-cols-3 gap-0.5 opacity-70">
            {[0, 1, 2].map(i => {
              const p = searchedProducts[i]
              const img = p?.image_urls?.[0]
              return (
                <div key={i} className="relative h-full bg-surface-raised overflow-hidden">
                  {img && (
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover scale-105"
                    />
                  )}
                </div>
              )
            })}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
          <div className="absolute inset-0 bg-ink/20" />

          <div className="relative h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-14 sm:pb-20">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-[11px] font-bold uppercase tracking-[0.35em] text-gold-400 mb-4"
            >
              Nueva Temporada
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.05 }}
              className="text-5xl sm:text-7xl font-black text-bone uppercase tracking-tight leading-[0.95] max-w-xl m-0"
            >
              Piezas exclusivas<br />
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
              className="mt-7"
            >
              <button
                onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gold-500 hover:bg-gold-400 text-black font-black uppercase tracking-widest text-xs transition-colors duration-200 cursor-pointer"
              >
                Ver Colección
              </button>
            </motion.div>
          </div>
        </section>
      )}

      <div id="catalogo" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

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

          {/* Heading: gigante solo en categoría/búsqueda; discreto en la vista home (el hero ya trae el H1 real) */}
          {isDefaultView ? (
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.3em] mb-6">
              Colección Completa
            </p>
          ) : (
            <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-widest leading-none mb-6">
              {searchTerm ? searchTerm : (
                categoryName === 'Colección Completa'
                  ? 'Colección Completa'
                  : (categoryName.includes(' - ') ? categoryName.split(' - ')[1].trim() : categoryName)
              )}
            </h1>
          )}

          {/* Pestañas de Género */}
          <div className="flex items-center gap-2 mb-5">
            {(['Todos', 'Hombre', 'Mujer'] as const).map(g => (
              <button
                key={g}
                onClick={() => setSelectedGender(g)}
                className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer border ${
                  selectedGender === g
                    ? 'bg-gold-500 text-black border-gold-500'
                    : 'bg-transparent text-zinc-300 border-zinc-700 hover:border-gold-500 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Filtrar y Ordenar Trigger Link */}
          <div>
            <button
              onClick={() => {
                window.dispatchEvent(new Event('open-menu-drawer'))
              }}
              className="text-xs font-black uppercase tracking-widest text-white border-b border-gold-500 pb-0.5 hover:text-gold-400 hover:border-gold-400 transition-all cursor-pointer bg-transparent border-t-0 border-x-0 outline-none rounded-none"
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
                    <div className="flex items-center gap-3 border-b border-hairline pb-3">
                      <span className="w-1.5 h-6 bg-gold-500 rounded-full" />
                      <h2 className={`text-lg font-black uppercase tracking-[0.15em] ${txt}`}>{catName}</h2>
                      <span className="text-xs text-zinc-300 font-bold">({list.length})</span>
                    </div>
                    <div className="grid gap-x-8 gap-y-16 grid-cols-2 lg:grid-cols-3">
                      {list.map(p => <ProductCardWrapper key={p.id} product={p} />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Filtered category view
              <div className="grid gap-x-8 gap-y-16 grid-cols-2 lg:grid-cols-3">
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
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gold-500 hover:bg-gold-400 text-black font-black uppercase tracking-widest text-xs transition-all duration-200 select-none cursor-pointer"
            >
              Contactar por WhatsApp
            </button>
          </div>
        )}
      </div>

      <Footer />

      <WhatsAppFAB onContact={handleWhatsAppContact} />
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
