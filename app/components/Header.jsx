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
    window.open(`https://wa.me/5493854021865?text=${text}`, '_blank')
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
        className="bg-neutral-950/85 backdrop-blur-md border-b border-zinc-850 sticky top-0 z-20 w-full px-4 sm:px-6 py-5"
      >
        <div className="max-w-6xl mx-auto flex flex-col gap-5">
          
          {/* Fila 1: Buscador | Logo | Club & Carrito */}
          <div className="flex items-center justify-between gap-4">
            
            {/* Buscador (Izquierda) */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 border-b border-zinc-800 pb-1.5 max-w-[200px] w-full hidden md:flex">
              <input
                type="text"
                placeholder="¿Qué estás buscando?"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-zinc-555 focus:outline-none w-full font-medium"
              />
              <button type="submit" className="text-[10px] font-black text-zinc-300 hover:text-white uppercase tracking-wider cursor-pointer transition-colors">
                Buscar
              </button>
            </form>

            {/* Mobile Hamburger (solo mobile, abre drawer) */}
            <div className="md:hidden flex items-center shrink-0">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -ml-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Menú"
              >
                <Menu className="h-5.5 w-5.5" />
              </button>
            </div>

            {/* Logo Central (Huge & Bold) */}
            <div className="flex justify-center flex-1">
              <span 
                onClick={() => {
                  router.push('/')
                  setHeaderSearch('')
                }} 
                className="font-sans text-4xl sm:text-5xl font-black tracking-[0.25em] text-white select-none pl-[0.25em] cursor-pointer hover:opacity-90 transition-opacity"
              >
                F K U S
              </span>
            </div>

            {/* Club & Carrito (Derecha) */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0 justify-end min-w-[120px] sm:min-w-[180px]">
              {/* Club Button */}
              {user ? (
                <button
                  onClick={() => openClubModal('profile')}
                  className="text-xs font-black uppercase tracking-widest text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  Mi Cuenta
                </button>
              ) : (
                <button
                  onClick={() => openClubModal('login')}
                  className="text-xs font-black uppercase tracking-widest text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  Club FKUS
                </button>
              )}

              {/* Cart Button */}
              <button
                onClick={() => setIsOpen(true)}
                className="text-xs font-black uppercase tracking-widest text-white transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Carrito</span>
                <span className="bg-white text-black text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0">
                  {count}
                </span>
              </button>
            </div>

          </div>

          {/* Fila 2: Enlaces de Navegación Centrados */}
          <div className="flex justify-center items-center gap-8 border-t border-zinc-900/40 pt-4 text-xs font-black uppercase tracking-[0.25em] text-zinc-300 select-none">
            <button 
              onClick={() => {
                router.push('/')
                setHeaderSearch('')
              }} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Inicio
            </button>
            <div 
              onMouseEnter={() => { if (hasMegaCategories) setIsMegaOpen(true) }}
              className="relative"
            >
              <button 
                onClick={() => setIsMenuOpen(true)} 
                className="hover:text-white transition-colors cursor-pointer py-1 block"
              >
                Prendas
              </button>
            </div>
            <button 
              onClick={handleWhatsAppContact} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contacto
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
              className="absolute top-full left-0 right-0 bg-neutral-950/98 backdrop-blur-md border-b border-zinc-800 shadow-2xl py-8 px-8 z-35 hidden md:block"
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
                        className="font-black text-white hover:text-zinc-300 uppercase tracking-widest text-[11px] block text-left transition-colors cursor-pointer mb-2 border-b border-zinc-850 pb-1"
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
                          className="font-semibold text-zinc-400 hover:text-white text-[11px] block text-left transition-colors pl-1 cursor-pointer py-0.5"
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
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-zinc-950/98 backdrop-blur-md border-r border-zinc-800 text-white z-50 p-6 flex flex-col gap-6 shadow-2xl overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 shrink-0">
                <span className="font-sans text-2xl font-black text-white select-none">F K U S</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Categorías (Prendas) */}
              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <Shirt className="h-3.5 w-3.5 text-zinc-300" /> Prendas / Categorías
                </h3>
                <button
                  onClick={() => {
                    router.push('/')
                    setIsMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-left transition-colors ${
                    !activeCategoryId ? 'bg-white text-black' : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <span>Colección Completa</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      router.push(`/?category=${cat.id}`)
                      setIsMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-left transition-colors ${
                      activeCategoryId === String(cat.id) ? 'bg-white text-black' : 'text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  </button>
                ))}
              </div>

              {/* Toda la Info */}
              <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-zinc-850 shrink-0">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Info className="h-3.5 w-3.5 text-zinc-300" /> Toda la Info
                </h3>
                <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl flex flex-col gap-3.5 text-[11px] text-zinc-300">
                  <div>
                    <p className="font-extrabold text-white mb-0.5">🚚 Envíos Premium</p>
                    <p className="text-zinc-300 leading-normal">Despachamos de forma inmediata con packaging y cuidado premium.</p>
                  </div>
                  <div className="w-full h-px bg-zinc-850" />
                  <div>
                    <p className="font-extrabold text-white mb-0.5">💎 Ropa Ultra Exclusiva</p>
                    <p className="text-zinc-300 leading-normal">FKUS produce piezas limitadas por cada artículo, garantizando exclusividad absoluta.</p>
                  </div>
                  <div className="w-full h-px bg-zinc-850" />
                  <div>
                    <p className="font-extrabold text-white mb-0.5">💳 Medios de Pago</p>
                    <p className="text-zinc-300 leading-normal">Efectivo, transferencia bancaria y todas las tarjetas habilitadas.</p>
                  </div>
                  <div className="w-full h-px bg-zinc-850" />
                  <div>
                    <p className="font-extrabold text-white mb-0.5">📲 Pedidos WhatsApp</p>
                    <p className="text-zinc-300 leading-normal">Armás el carrito en la web y finalizás enviando el pedido a nuestro WhatsApp: **+54 9 3854 02-1865**.</p>
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
