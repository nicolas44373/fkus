// components/WhatsAppFAB.jsx
import React from 'react'
import { MessageCircle } from 'lucide-react'
import { useCart } from '../context/CartContext'

const WhatsAppFAB = ({ onContact, liftForStickyBar }) => {
  const { count, isOpen } = useCart()
  const hasCartItems = count > 0 && !isOpen

  return (
    <button
      onClick={onContact}
      aria-label="Contactar por WhatsApp"
      className={`fixed right-5 sm:right-6 z-30 w-14 h-14 rounded-full bg-surface border border-hairline shadow-xl flex items-center justify-center text-[#25D366] hover:border-gold-500 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer ${
        hasCartItems ? 'bottom-28' : liftForStickyBar ? 'bottom-24 sm:bottom-6' : 'bottom-6'
      }`}
    >
      <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
    </button>
  )
}

export default WhatsAppFAB
