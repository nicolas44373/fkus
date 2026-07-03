'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import EpicChickLoading from './components/EpicChickLoading'
import Header from './components/Header'
import WhatsAppFAB from './components/WhatsAppFAB'

export default function MainPage() {
  const [categories, setCategories] = useState([])
  const [productCounts, setProductCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [showContactMenu, setShowContactMenu] = useState(false)
  const router = useRouter()

  const categoryConfig = {
    'Pata Muslo':              { imageSrc: '/tadeologo.png', emoji: '🍗', description: 'Cajón de Pata Muslo' },
    Filet:                     { imageSrc: '/tadeologo.png', emoji: '🥩', description: 'Filet de Pechuga' },
    'Cajon de Pollo':          { imageSrc: '/tadeologo.png', emoji: '📦', description: 'Cajones x20kg' },
    Ofertas:                   { imageSrc: '/tadeologo.png', emoji: '🔥', description: 'Promociones Especiales' },
    Pescados:                  { imageSrc: '/tadeologo.png', emoji: '🐟', description: 'Merluza, Atún y más' },
    Rebozados:                 { imageSrc: '/tadeologo.png', emoji: '🍞', description: 'Productos Elaborados' },
    'Carne Mecanizada (Molida)': { imageSrc: '/tadeologo.png', emoji: '🥩', description: 'Carne Molida' },
    Otros:                     { imageSrc: '/tadeologo.png', emoji: '🥚', description: 'Huevos y Pan Rallado' },
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories').select('*').order('name')
        if (categoriesError) throw categoriesError

        const { data: productsData, error: productsError } = await supabase
          .from('products').select('category_id, price')
        if (productsError) throw productsError

        const counts = {}
        productsData?.forEach(p => {
          if (p.price) counts[p.category_id] = (counts[p.category_id] || 0) + 1
        })

        const targetCategories = [
          'Pata Muslo','Filet','Cajon de Pollo','Ofertas',
          'Pescados','Rebozados','Carne Mecanizada (Molida)','Otros',
        ]
        const filteredCategories = categoriesData?.filter(c =>
          targetCategories.includes(c.name) && counts[c.id] > 0
        ) || []

        setCategories(filteredCategories)
        setProductCounts(counts)
      } catch (err) {
        console.error('Error cargando datos:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleCategoryClick = id => router.push(`/catalog?category=${id}`)

  const handleWhatsAppContact = () => {
    const url = `https://wa.me/+5493854021865?text=${encodeURIComponent('Hola! Me interesa obtener información sobre sus productos por mayor.')}`
    window.open(url, '_blank')
    setShowContactMenu(false)
  }

  if (loading) return <EpicChickLoading />

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* ── HERO ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            <span>⭐</span> Venta Mayorista
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Catálogo de Productos
          </h1>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            Elegí una categoría para ver todos los precios por mayor
          </p>
        </div>
      </div>

      {/* ── BANNER ENVÍO GRATIS ── */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚚</span>
              <div>
                <p className="text-white font-extrabold text-lg leading-tight">Envíos 100% GRATIS</p>
                <p className="text-emerald-200 text-sm">En todos los pedidos, sin monto mínimo</p>
              </div>
            </div>
            <div className="hidden sm:block h-10 w-px bg-white/25 rounded-full" />
            <div className="flex items-center gap-3">
              <span className="text-3xl">🕗</span>
              <div>
                <p className="text-white font-extrabold text-lg leading-tight">Pedidos: 8:30 a 20:00 hs</p>
                <p className="text-emerald-200 text-sm">Reparto al día siguiente · 9:00 a 15:00 hs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* ── GRID DE CATEGORÍAS ── */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {categories.map(category => {
              const cfg = categoryConfig[category.name] || {
                imageSrc: '/default-category.jpg',
                emoji: '📦',
                description: 'Productos disponibles',
              }
              const count = productCounts[category.id] || 0

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-amber-200 transition-all duration-300 hover:-translate-y-1 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-amber-400 text-left"
                >
                  {/* Imagen */}
                  <div className="relative w-full h-40 sm:h-48 overflow-hidden bg-gray-100">
                    <Image
                      src={category.image_url || cfg.imageSrc}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {/* Badge count */}
                    <div className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {count} items
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug truncate">
                          {category.name}
                        </h3>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{cfg.description}</p>
                      </div>
                      <span className="text-xl shrink-0">{cfg.emoji}</span>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-amber-600">
                      <span className="text-xs font-bold uppercase tracking-wide">Ver precios</span>
                      <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Borde inferior de acento al hover */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="text-6xl mb-5">🐔</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No hay categorías disponibles</h3>
            <p className="text-gray-400 text-sm">Los productos aparecerán aquí una vez que tengan precios asignados.</p>
          </div>
        )}

        {/* ── SECCIÓN DE INFORMACIÓN ── */}
        <div className="mt-16 space-y-5">

          {/* Tres columnas de info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl shrink-0 border border-emerald-100">
                🚚
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Envío Gratis</p>
                <p className="text-gray-400 text-xs mt-0.5">Sin costo en todos los pedidos</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl shrink-0 border border-amber-100">
                🕗
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Horario de Pedidos</p>
                <p className="text-gray-400 text-xs mt-0.5">8:30 a 20:00 hs</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0 border border-blue-100">
                📅
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Reparto</p>
                <p className="text-gray-400 text-xs mt-0.5">Al día siguiente · 9:00 a 15:00 hs</p>
              </div>
            </div>
          </div>

          {/* Medios de pago */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Medios de pago</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-base border border-emerald-100">💵</div>
                <span className="text-sm font-semibold text-gray-700">Efectivo</span>
              </div>
              <div className="w-px h-5 bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-base border border-blue-100">🏦</div>
                <span className="text-sm font-semibold text-gray-700">Transferencia</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <WhatsAppFAB
        showMenu={showContactMenu}
        setShowMenu={setShowContactMenu}
        onContact={handleWhatsAppContact}
      />
    </div>
  )
}
