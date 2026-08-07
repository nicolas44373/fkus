'use client'

import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useClub } from '../context/ClubContext'
import { Trophy, Menu, X, ChevronRight, Info, Shirt } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

export default function Header() {
  const { count, setIsOpen } = useCart()
  const { user, openClubModal } = useClub()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMegaOpen, setIsMegaOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [categories, setCategories] = useState([])
  const [headerSearch, setHeaderSearch] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCategoryId = searchParams.get('category')

  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [])

  useEffect(() => {
    setHeaderSearch(searchParams.get('search') || '')
  }, [searchParams])

  useEffect(() => {
    const handleOpen = () => setIsMenuOpen(true)
    window.addEventListener('open-menu-drawer', handleOpen)
    return () => window.removeEventListener('open-menu-drawer', handleOpen)
  }, [])

  // Auto-expandir el grupo padre de la subcategoría activa al abrir el menú
  useEffect(() => {
    if (!isMenuOpen || !activeCategoryId) return
    const activeCat = categories.find(c => String(c.id) === activeCategoryId)
    if (activeCat && activeCat.name.includes(' - ')) {
      setExpandedCategory(activeCat.name.split(' - ')[0].trim())
    }
  }, [isMenuOpen, activeCategoryId, categories])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (headerSearch.trim()) {
      router.push(`/?search=${encodeURIComponent(headerSearch.trim())}`)
    } else {
      router.push('/')
    }
  }

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent('Hola 𝗙𝗞🇺𝗦! Quería consultar sobre el catálogo.')
    window.open(`https://wa.me/5493813504756?text=${text}`, '_blank')
  }

  const getCatIdByName = (name) => {
    const found = categories.find((c) => c.name.toLowerCase().includes(name.toLowerCase()))
    return found ? found.id : ''
  }

  const handleMegaClick = (categoryName, searchTerm = '') => {
    const catId = getCatIdByName(categoryName)
    let url = '/'
    if (catId && searchTerm) {
      url = `/?category=${catId}&search=${encodeURIComponent(searchTerm)}`
    } else if (catId) {
      url = `/?category=${catId}`
    } else if (searchTerm) {
      url = `/?search=${encodeURIComponent(searchTerm)}`
    }
    router.push(url)
    setIsMegaOpen(false)
  }

  // Resolver categorías padres (aquellas que no tienen " - ") y subcategorías
  const parentCategories = categories.filter(c => !c.name.includes(' - '))

  // Si hay subcategorías cuyo padre aún no existe como objeto principal en parentCategories, las incluimos como padres sintéticos
  const subCategoryParentNames = Array.from(new Set(
    categories
      .filter(c => c.name.includes(' - '))
      .map(c => c.name.split(' - ')[0].trim())
  ))

  const allParentNames = Array.from(new Set([
    ...parentCategories.map(c => c.name.trim()),
    ...subCategoryParentNames
  ]))

  const getSubcategoriesOf = (parentName) => {
    return categories
      .filter(c => c.name.includes(' - ') && c.name.split(' - ')[0].trim().toLowerCase() === parentName.toLowerCase())
      .map(c => ({
        id: c.id,
        name: c.name.split(' - ')[1].trim(),
        fullName: c.name
      }))
  }

  const hasMegaCategories = categories.length > 0

  return (
    <>
      <header
        onMouseLeave={() => setIsMegaOpen(false)}
        className="bg-surface/90 backdrop-blur-md border-b border-hairline sticky top-0 z-20 w-full px-4 sm:px-6"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 h-16 sm:h-[68px]">

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center shrink-0">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl text-smoke hover:text-bone transition-colors cursor-pointer"
              title="Menú"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
          </div>

          {/* Logo (Izquierda, con presencia propia) */}
          <span
            onClick={() => {
              router.push('/')
              setHeaderSearch('')
            }}
            className="font-sans text-xl sm:text-2xl font-black tracking-[0.3em] text-bone select-none cursor-pointer hover:text-gold-400 transition-colors shrink-0"
          >
            FKUS
          </span>

          {/* Nav Central (Desktop) */}
          <nav className="hidden md:flex items-center gap-9 text-[11px] font-bold uppercase tracking-[0.2em] text-smoke select-none">
            <button
              onClick={() => {
                router.push('/')
                setHeaderSearch('')
              }}
              className="hover:text-bone transition-colors cursor-pointer"
            >
              Inicio
            </button>
            <div
              onMouseEnter={() => { if (hasMegaCategories) setIsMegaOpen(true) }}
              className="relative"
            >
              <button
                onClick={() => setIsMenuOpen(true)}
                className={`transition-colors cursor-pointer py-1 block relative ${isMegaOpen ? 'text-bone' : 'hover:text-bone'}`}
              >
                Prendas
                <span className={`absolute -bottom-0.5 left-0 h-px bg-gold-500 transition-all duration-300 ${isMegaOpen ? 'w-full' : 'w-0'}`} />
              </button>
            </div>
            <button
              onClick={handleWhatsAppContact}
              className="hover:text-bone transition-colors cursor-pointer"
            >
              Contacto
            </button>
          </nav>

          {/* Buscador (Desktop) */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center gap-2 border-b border-hairline focus-within:border-gold-500 pb-1 max-w-[160px] w-full transition-colors">
            <input
              type="text"
              placeholder="Buscar"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className="bg-transparent text-[11px] text-bone placeholder-smoke focus:outline-none w-full font-medium"
            />
          </form>

          {/* Club & Carrito (Derecha) */}
          <div className="flex items-center gap-5 sm:gap-6 shrink-0">
            {user ? (
              <button
                onClick={() => openClubModal('profile')}
                className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.2em] text-smoke hover:text-gold-400 transition-colors cursor-pointer"
              >
                Mi Cuenta
              </button>
            ) : (
              <button
                onClick={() => openClubModal('login')}
                className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.2em] text-smoke hover:text-gold-400 transition-colors cursor-pointer"
              >
                Club FKUS
              </button>
            )}

            <button
              onClick={() => setIsOpen(true)}
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-bone transition-all cursor-pointer flex items-center gap-2 group"
            >
              <span className="hidden sm:inline">Carrito</span>
              <span className="bg-gold-500 text-black text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                {count}
              </span>
            </button>
          </div>

        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {isMegaOpen && hasMegaCategories && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute top-full left-0 right-0 bg-surface/98 backdrop-blur-md border-b border-hairline shadow-2xl py-8 px-8 z-35 hidden md:block"
            >
              <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-6 select-none items-start">
                {allParentNames.map((pName) => {
                  const parentObj = parentCategories.find(c => c.name.toLowerCase().trim() === pName.toLowerCase())
                  const subs = getSubcategoriesOf(pName)

                  return (
                    <div key={pName} className="flex flex-col text-left">
                      <button
                        onClick={() => {
                          handleMegaClick(parentObj ? parentObj.name : pName)
                          setIsMegaOpen(false)
                        }}
                        className="font-black text-bone hover:text-gold-400 uppercase tracking-widest text-[11px] block text-left transition-colors cursor-pointer mb-2 border-b border-hairline pb-1"
                      >
                        {pName}
                      </button>
                      {subs.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            router.push(`/?category=${sub.id}`)
                            setIsMegaOpen(false)
                          }}
                          className="font-semibold text-smoke hover:text-bone text-[11px] block text-left transition-colors pl-1 cursor-pointer py-0.5"
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Menú Lateral */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black z-45"
            />

            {/* Menu Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-surface/98 backdrop-blur-md border-r border-hairline text-bone z-50 p-6 flex flex-col gap-6 shadow-2xl overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-hairline pb-4 shrink-0">
                <span className="font-sans text-xl font-black tracking-[0.3em] text-bone select-none">FKUS</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-lg text-smoke hover:text-bone hover:bg-surface-raised transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Categorías (Prendas) */}
              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] font-black text-smoke uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <Shirt className="h-3.5 w-3.5 text-smoke" /> Prendas / Categorías
                </h3>
                <button
                  onClick={() => {
                    router.push('/')
                    setIsMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-left transition-colors ${
                    !activeCategoryId ? 'bg-gold-500 text-black' : 'text-smoke hover:bg-surface-raised hover:text-bone'
                  }`}
                >
                  <span>Colección Completa</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                </button>
                {allParentNames.map((pName) => {
                  const parentObj = parentCategories.find(c => c.name.toLowerCase().trim() === pName.toLowerCase())
                  const subs = getSubcategoriesOf(pName)
                  const isExpanded = expandedCategory === pName
                  const isActiveParent = parentObj && activeCategoryId === String(parentObj.id)
                  const hasActiveSub = subs.some(s => activeCategoryId === String(s.id))

                  return (
                    <div key={pName}>
                      <button
                        onClick={() => {
                          if (subs.length > 0) {
                            setExpandedCategory(isExpanded ? null : pName)
                          } else if (parentObj) {
                            router.push(`/?category=${parentObj.id}`)
                            setIsMenuOpen(false)
                          }
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left cursor-pointer transition-colors ${
                          isActiveParent ? 'bg-gold-500 text-black' : hasActiveSub ? 'bg-surface-raised text-gold-400' : 'text-smoke hover:bg-surface-raised hover:text-bone'
                        }`}
                      >
                        <span className="min-w-0 truncate font-bold text-xs uppercase tracking-wider">{pName}</span>
                        {subs.length > 0 ? (
                          <ChevronRight className={`h-3.5 w-3.5 opacity-60 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        )}
                      </button>

                      {subs.length > 0 && (
                        <div className={`grid transition-all duration-300 ease-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
                          <div className="overflow-hidden flex flex-col gap-0.5 pl-3 border-l border-hairline ml-3">
                            {subs.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  router.push(`/?category=${sub.id}`)
                                  setIsMenuOpen(false)
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg font-semibold text-[11px] uppercase tracking-wider truncate cursor-pointer transition-colors ${
                                  activeCategoryId === String(sub.id) ? 'bg-gold-500 text-black' : 'text-smoke hover:bg-surface-raised hover:text-bone'
                                }`}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Toda la Info */}
              <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-hairline shrink-0">
                <h3 className="text-[10px] font-black text-smoke uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Info className="h-3.5 w-3.5 text-smoke" /> Toda la Info
                </h3>
                <div className="bg-surface-raised/60 border border-hairline p-4 rounded-2xl flex flex-col gap-3.5 text-[11px] text-smoke">
                  <div>
                    <p className="font-extrabold text-bone mb-0.5">🚚 Envíos Premium</p>
                    <p className="text-smoke leading-normal">Despachamos de forma inmediata con packaging y cuidado premium.</p>
                  </div>
                  <div className="w-full h-px bg-hairline" />
                  <div>
                    <p className="font-extrabold text-bone mb-0.5">💎 Ropa Ultra Exclusiva</p>
                    <p className="text-smoke leading-normal">FKUS produce piezas limitadas por cada artículo, garantizando exclusividad absoluta.</p>
                  </div>
                  <div className="w-full h-px bg-hairline" />
                  <div>
                    <p className="font-extrabold text-bone mb-0.5">💳 Medios de Pago</p>
                    <p className="text-smoke leading-normal">Efectivo, transferencia bancaria y todas las tarjetas habilitadas.</p>
                  </div>
                  <div className="w-full h-px bg-hairline" />
                  <div>
                    <p className="font-extrabold text-bone mb-0.5">📲 Pedidos WhatsApp</p>
                    <p className="text-smoke leading-normal">Armás el carrito en la web y finalizás enviando el pedido a nuestro WhatsApp: **+54 9 3813 50-4756**.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
