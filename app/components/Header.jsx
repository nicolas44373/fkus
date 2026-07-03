'use client'

import { useCart } from '../context/CartContext'
import { useClub } from '../context/ClubContext'
import { Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header() {
  const { count, setIsOpen } = useCart()
  const { user, openClubModal } = useClub()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center">
          <img src="/tadeologo.png" alt="Tadeo" className="h-16 w-auto object-contain" />
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-2.5">
          {/* Badge envío gratis — solo desktop */}
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full">
            <span>🚚</span>
            <span>Envíos gratis</span>
          </div>

          {/* Botón Club Alenort */}
          {user ? (
            <button
              onClick={() => openClubModal('profile')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl font-extrabold text-xs transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="hidden xs:inline">{user.nombre}</span>
              <span className="bg-amber-500 text-white font-black px-1.5 py-0.5 rounded-md text-[9px] shadow-sm">
                {user.points} pts
              </span>
            </button>
          ) : (
            <button
              onClick={() => openClubModal('login')}
              className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-3.5 py-2 rounded-xl font-extrabold text-xs transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Club Alenort</span>
            </button>
          )}

          {/* Botón carrito */}
          <div className="relative">
            {count > 0 && (
              <span className="absolute inset-0 rounded-xl bg-amber-500/30 animate-ping pointer-events-none" style={{ animationDuration: '2s' }} />
            )}
            <motion.button
              key={`header-cart-${count}`}
              animate={count > 0 ? {
                scale: [1, 1.1, 0.95, 1],
                y: [0, -4, 2, 0]
              } : {}}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              onClick={() => setIsOpen(true)}
              className="relative flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer"
            >
              <motion.div
                key={count}
                animate={count > 0 ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
                className="shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
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
    </header>
  )
}
