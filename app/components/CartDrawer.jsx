'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useClub } from '../context/ClubContext'
import { supabase } from '@/lib/supabase'
import MapInput from './MapInput'
import { 
  ShoppingCart, 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft, 
  MapPin, 
  User, 
  Phone, 
  FileText, 
  Check, 
  Truck,
  CheckCircle2,
  Trophy,
  Loader2,
  Lock
} from 'lucide-react'

const fmt = (value) => {
  const n = parseFloat(value || 0)
  return `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function CartDrawer() {
  const { 
    items, 
    removeItem, 
    updateQty, 
    clearCart, 
    count, 
    total, 
    isOpen, 
    setIsOpen, 
    customer, 
    updateCustomer 
  } = useCart()

  const { 
    user, 
    openClubModal, 
    fetchUserByCode, 
    updateProfile 
  } = useClub()

  const [step, setStep] = useState(1) // 1: Carrito, 2: Envío, 3: Confirmación, 4: Pedido Listo
  const [isMovingForward, setIsMovingForward] = useState(true)
  const [errors, setErrors] = useState({})
  
  // States para el código del club
  const [clubCodeInput, setClubCodeInput] = useState('')
  const [codeSearchStatus, setCodeSearchStatus] = useState(null) // 'searching' | 'found' | 'not-found' | null
  const [loadedFromCodeUser, setLoadedFromCodeUser] = useState(null)
  
  const [submittingOrder, setSubmittingOrder] = useState(false)

  // States para la confirmación robusta de pedidos
  const [generatedOrderId, setGeneratedOrderId] = useState(null)
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [copied, setCopied] = useState(false)

  // Auto-rellenar si el usuario está logueado
  useEffect(() => {
    if (user && isOpen) {
      updateCustomer('nombre', `${user.nombre} ${user.apellido}`)
      updateCustomer('celular', user.celular)
      updateCustomer('direccion', user.direccion || '')
      updateCustomer('referencia', user.referencia || '')
      if (user.lat) updateCustomer('lat', parseFloat(user.lat))
      if (user.lng) updateCustomer('lng', parseFloat(user.lng))
    }
  }, [user, isOpen, updateCustomer])

  // Buscar usuario del club por código de 4 dígitos
  const handleCodeLookup = async () => {
    const code = clubCodeInput.trim()
    if (!code || code.length !== 4) return
    
    setCodeSearchStatus('searching')
    const found = await fetchUserByCode(code)
    
    if (found) {
      setLoadedFromCodeUser(found)
      updateCustomer('nombre', `${found.nombre} ${found.apellido}`)
      updateCustomer('celular', found.celular)
      updateCustomer('direccion', found.direccion || '')
      updateCustomer('referencia', found.referencia || '')
      if (found.lat) updateCustomer('lat', parseFloat(found.lat))
      if (found.lng) updateCustomer('lng', parseFloat(found.lng))
      setCodeSearchStatus('found')
      setErrors({})
    } else {
      setCodeSearchStatus('not-found')
      setLoadedFromCodeUser(null)
    }
  }

  // ── Validación ──
  const validateForm = () => {
    const e = {}
    if (!customer.nombre.trim()) e.nombre = 'El nombre es requerido'
    if (!customer.celular.trim()) e.celular = 'El celular es requerido'
    if (!customer.direccion.trim() || customer.direccion.length < 5) {
      e.direccion = 'Ingresá una dirección de entrega válida'
    }
    if (!customer.lat || !customer.lng) {
      e.direccion = 'Por favor, selecciona una ubicación en el buscador o el mapa'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNextStep = () => {
    if (step === 1) {
      setIsMovingForward(true)
      setStep(2)
    } else if (step === 2) {
      if (validateForm()) {
        setIsMovingForward(true)
        setStep(3)
      }
    }
  }

  const handlePrevStep = () => {
    setIsMovingForward(false)
    setStep(prev => prev - 1)
  }

  const handleFieldChange = (field, value) => {
    updateCustomer(field, value)
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  // ── Confirmar y Registrar Pedido ──
  const confirmAndRegisterOrder = async () => {
    if (items.length === 0) return
    if (!validateForm()) return

    setSubmittingOrder(true)
    let orderId = null
    const activeDni = user?.dni || loadedFromCodeUser?.dni

    // Si el usuario está logueado, actualizamos sus datos en su perfil para la próxima
    if (user) {
      try {
        await updateProfile({
          direccion: customer.direccion,
          referencia: customer.referencia,
          lat: customer.lat,
          lng: customer.lng,
          celular: customer.celular
        })
      } catch (err) {
        console.error('Error al actualizar perfil del socio:', err)
      }
    }

    // Registrar pedido en la base de datos de club_orders de forma universal
    try {
      const orderPayload = {
        user_dni: activeDni || null,
        items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price, selectedSize: i.selectedSize || null, selectedColor: i.selectedColor || null, unit: i.unit })),
        total: total,
        status: 'Pendiente',
        points_awarded: false,
        customer_name: customer.nombre,
        customer_phone: customer.celular,
        customer_address: customer.direccion,
        customer_lat: String(customer.lat || ''),
        customer_lng: String(customer.lng || '')
      }
      
      const { data, error } = await supabase
        .from('club_orders')
        .insert([orderPayload])
        .select()
      
      if (error) throw error
      orderId = data?.[0]?.id
      setGeneratedOrderId(orderId)
    } catch (e) {
      console.error('Error al registrar pedido en Supabase:', e)
    }

    // Descontar stock de cada producto comprado (no bloquea el checkout si falla)
    try {
      await Promise.all(
        items.map(item =>
          supabase.rpc('decrement_stock', { product_id: item.id, qty: item.quantity })
        )
      )
    } catch (e) {
      console.error('Error al descontar stock:', e)
    }

    const date = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    
    // Lista de ítems formateada de manera muy clara con talle y color
    const lines = items.map(item => {
      const sub = parseFloat(item.price || 0) * item.quantity
      const unit = item.unit ? ` (${item.unit})` : ''
      const variantText = (item.selectedSize || item.selectedColor) ? ` [${[item.selectedColor, item.selectedSize].filter(Boolean).join(', ')}]` : ''
      return `  • *${item.quantity}* × ${item.name}${variantText}${unit}\n    Subtotal: *${fmt(sub.toString())}*`
    })

    // Crear link de Google Maps con las coordenadas precisas
    const gmapsLink = `https://www.google.com/maps?q=${customer.lat},${customer.lng}`
    const clubCode = user?.club_code || loadedFromCodeUser?.club_code

    const message = [
      '🛒 *NUEVO PEDIDO — FKUS*',
      `📅 Fecha: ${date}`,
      orderId ? `🆔 *ID Pedido Club:* #${orderId}` : null,
      clubCode ? `⭐ *Socio Club FKUS:* #${clubCode}` : null,
      '',
      '━━━━━━━━━━━━━━━━━━━━━',
      '👤 *DATOS DE ENTREGA:*',
      `  • *Nombre:* ${customer.nombre}`,
      `  • *Celular:* ${customer.celular}`,
      `  • *Dirección:* ${customer.direccion}`,
      customer.referencia.trim() ? `  • *Referencia:* ${customer.referencia}` : null,
      `  • *Ubicación del Pin (GPS):* ${gmapsLink}`,
      '',
      '━━━━━━━━━━━━━━━━━━━━━',
      '📦 *DETALLE DE PRODUCTOS:*',
      '',
      ...lines,
      '',
      '━━━━━━━━━━━━━━━━━━━━━',
      `💰 *TOTAL ESTIMADO: ${fmt(total.toString())}*`,
      '━━━━━━━━━━━━━━━━━━━━━',
      '',
      '🚚 Envíos Premium FKUS',
      clubCode ? '🎁 Este pedido sumará puntos Club FKUS al confirmarse.' : null,
      '',
      'Por favor confirmen disponibilidad y costo final de los productos.',
      '¡Muchas gracias! 🙌',
    ].filter(l => l !== null).join('\n')

    setWhatsappMessage(message)
    setStep(4)
    setSubmittingOrder(false)
  }

  const handleFinalizeWhatsApp = () => {
    window.open(`https://wa.me/+5493813504756?text=${encodeURIComponent(whatsappMessage)}`, '_blank')
    clearCart()
    setIsOpen(false)
  }

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2050)
  }

  // Reset del step al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1)
        setClubCodeInput('')
        setCodeSearchStatus(null)
        setLoadedFromCodeUser(null)
        setGeneratedOrderId(null)
        setWhatsappMessage('')
        setCopied(false)
      }, 300)
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop con Blur */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/50 backdrop-blur-md z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer: bottom sheet en mobile, panel lateral en desktop */}
      <div className={`fixed inset-x-0 bottom-0 sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-auto h-[92vh] sm:h-full w-full sm:w-[480px] bg-surface-raised shadow-2xl z-50 flex flex-col overflow-hidden rounded-t-3xl sm:rounded-none transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-y-0 translate-x-0' : 'translate-y-full sm:translate-y-0 translate-x-0 sm:translate-x-full'
      }`}>

        {/* Handle de arrastre (solo mobile) */}
        <div className="sm:hidden flex items-center justify-center pt-2.5 pb-1 shrink-0" onClick={() => setIsOpen(false)}>
          <div className="w-10 h-1 rounded-full bg-hairline" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-surface border-b border-hairline shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center text-black shadow-md">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-bone text-base leading-none">Mi Pedido</h2>
              <p className="text-[10px] text-smoke font-medium mt-1 font-semibold">Club FKUS Integrado</p>
            </div>
            {count > 0 && (
              <span className="bg-gold-500 text-black text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm ml-1">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-smoke hover:text-bone hover:bg-surface-raised rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Indicator */}
        {items.length > 0 && step <= 3 && (
          <div className="bg-surface border-b border-hairline px-5 py-4 shrink-0 flex flex-col items-center gap-3">
            {/* Circles Row */}
            <div className="flex items-center justify-center w-full max-w-[240px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs shadow-sm transition-all shrink-0 ${
                step >= 1 ? 'bg-gold-500 text-black ring-4 ring-gold-500/20' : 'bg-surface-raised text-smoke'
              }`}>
                {step > 1 ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <div className={`flex-1 h-1 transition-colors mx-1 ${step >= 2 ? 'bg-gold-500' : 'bg-surface-raised'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs shadow-sm transition-all shrink-0 ${
                step >= 2 ? 'bg-gold-500 text-black ring-4 ring-gold-500/20' : 'bg-surface-raised text-smoke'
              }`}>
                {step > 2 ? <Check className="h-4 w-4" /> : '2'}
              </div>
              <div className={`flex-1 h-1 transition-colors mx-1 ${step >= 3 ? 'bg-gold-500' : 'bg-surface-raised'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs shadow-sm transition-all shrink-0 ${
                step >= 3 ? 'bg-gold-500 text-black ring-4 ring-gold-500/20' : 'bg-surface-raised text-smoke'
              }`}>
                3
              </div>
            </div>
            {/* Active Step Label */}
            <span className="text-xs font-black text-bone uppercase tracking-widest leading-none mt-0.5">
              {step === 1 && '1. Resumen de tu pedido'}
              {step === 2 && '2. Datos de envío y mapa'}
              {step === 3 && '3. Confirmar pedido'}
            </span>
          </div>
        )}

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-full bg-surface-raised flex items-center justify-center text-gold-500 mb-6 border border-hairline">
              <ShoppingCart className="h-10 w-10 animate-bounce" />
            </div>
            <p className="font-extrabold text-bone text-lg mb-1.5">Tu pedido está vacío</p>
            <p className="text-smoke text-sm max-w-xs mb-8 leading-relaxed">
              Explorá el catálogo de FKUS y agrega productos para armar tu pedido.
            </p>
            <button
              onClick={() => setIsOpen(false)}
              className="px-6 py-3.5 bg-gold-500 hover:bg-gold-400 text-black font-extrabold rounded-2xl transition-all text-sm shadow-md hover:shadow-lg active:scale-95"
            >
              Explorar Catálogo →
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: isMovingForward ? 30 : -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isMovingForward ? -30 : 30 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-smoke uppercase tracking-widest">Productos seleccionados</span>
                      <button 
                        onClick={clearCart}
                        className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 cursor-pointer shadow-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Limpiar
                      </button>
                    </div>

                    <div className="space-y-3">
                      {items.map(item => {
                        const subtotal = parseFloat(item.price || 0) * item.quantity
                        const itemKey = item.cartItemId || String(item.id)
                        return (
                          <div key={itemKey} className="bg-surface rounded-2xl p-4 border border-hairline shadow-sm flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex gap-3 min-w-0 flex-1">
                                {/* Thumbnail */}
                                <div className="w-12 h-16 bg-surface-raised rounded-lg overflow-hidden shrink-0 border border-hairline flex items-center justify-center">
                                  {item.image_url ? (
                                    <img src={item.image_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xl">🧥</span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-bone text-sm leading-snug line-clamp-2">{item.name}</p>
                                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    {item.categoryName && (
                                      <span className="text-[9px] font-black uppercase bg-surface-raised text-smoke border border-hairline px-1.5 py-0.5 rounded">
                                        {item.categoryName}
                                      </span>
                                    )}
                                    {item.selectedColor && (
                                      <span className="text-[9px] font-black uppercase bg-surface-raised text-smoke border border-hairline px-1.5 py-0.5 rounded">
                                        {item.selectedColor}
                                      </span>
                                    )}
                                    {item.selectedSize && (
                                      <span className="text-[9px] font-black uppercase bg-surface-raised text-smoke border border-hairline px-1.5 py-0.5 rounded">
                                        {item.selectedSize}
                                      </span>
                                    )}
                                    <span className="text-xs font-semibold text-smoke">
                                      {fmt(item.price)} c/u
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => removeItem(itemKey)}
                                className="shrink-0 p-1.5 text-smoke hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all animate-none"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between border-t border-hairline pt-3">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-1 bg-surface-raised rounded-xl p-1 border border-hairline">
                                <button
                                  onClick={() => updateQty(itemKey, item.quantity - 1)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-smoke hover:bg-surface active:scale-90 transition-all font-bold text-sm"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-9 text-center font-extrabold text-bone text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateQty(itemKey, item.quantity + 1)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-smoke hover:bg-surface active:scale-90 transition-all font-bold text-sm"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <p className="font-black text-gold-400 text-base">{fmt(subtotal.toString())}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: isMovingForward ? 30 : -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isMovingForward ? -30 : 30 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* SECCIÓN CLUB FKUS */}
                    {user ? (
                      /* Socio Logueado */
                      <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-hairline rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest bg-gold-500 text-black px-2 py-0.5 rounded-full">
                            Socio Club FKUS
                          </span>
                          <h4 className="font-extrabold text-sm mt-2 text-bone">{user.nombre} {user.apellido}</h4>
                          <p className="text-[10px] text-smoke font-bold mt-0.5">
                            Socio #{user.club_code} | Puntos: {user.points} pts
                          </p>
                        </div>
                        <Trophy className="h-8 w-8 text-gold-400 animate-pulse shrink-0" />
                      </div>
                    ) : (
                      /* No Logueado: Promoción e Input Código */
                      <div className="bg-gradient-to-br from-surface-raised to-surface-raised border border-hairline rounded-2xl p-4 shadow-sm space-y-3">
                        <p className="text-xs font-bold text-gold-300 uppercase tracking-wide flex items-center gap-1.5 leading-none">
                          <Trophy className="h-4 w-4 text-gold-500 shrink-0" /> ¿Sos socio del Club FKUS?
                        </p>
                        <p className="text-[11px] text-smoke leading-relaxed">
                          Iniciá sesión para sumar puntos o ingresá tu código de 4 dígitos para cargar tus datos de entrega anteriores.
                        </p>
                        
                        {/* Buscador de código de 4 dígitos */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={4}
                            value={clubCodeInput}
                            onChange={e => { setClubCodeInput(e.target.value.replace(/\D/g, '')); setCodeSearchStatus(null) }}
                            placeholder="Tu código de 4 dígitos"
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-hairline bg-surface text-xs font-mono font-bold tracking-widest text-center text-bone placeholder-smoke focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={handleCodeLookup}
                            disabled={codeSearchStatus === 'searching'}
                            className="shrink-0 px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-black font-extrabold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1"
                          >
                            {codeSearchStatus === 'searching' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cargar'}
                          </button>
                        </div>

                        {codeSearchStatus === 'found' && loadedFromCodeUser && (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold animate-in fade-in">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            ¡Cargado! Socio #{loadedFromCodeUser.club_code} ({loadedFromCodeUser.nombre})
                          </div>
                        )}
                        {codeSearchStatus === 'not-found' && (
                          <p className="text-red-400 text-[10px] font-bold">⚠️ Código no encontrado.</p>
                        )}

                        <div className="flex items-center justify-between pt-2.5 border-t border-hairline text-xs">
                          <button
                            type="button"
                            onClick={() => openClubModal('login')}
                            className="font-bold text-gold-400 hover:underline"
                          >
                            Iniciá sesión con DNI
                          </button>
                          <button
                            type="button"
                            onClick={() => openClubModal('register')}
                            className="font-black text-gold-400 hover:underline"
                          >
                            Creá tu cuenta gratis
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Formulario Datos Básicos */}
                    <div className="bg-surface rounded-2xl border border-hairline p-4 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 pb-2 border-b border-hairline">
                        <User className="h-4 w-4 text-gold-500" />
                        <p className="text-xs font-black uppercase tracking-wider text-smoke">Datos personales</p>
                      </div>

                      {/* Nombre */}
                      <div>
                        <label className="block text-xs font-bold text-smoke uppercase tracking-wide mb-1.5">
                          Nombre Completo <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={customer.nombre}
                            onChange={(e) => handleFieldChange('nombre', e.target.value)}
                            placeholder="Ej: Juan Pérez"
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-bone placeholder-smoke focus:outline-none focus:ring-2 transition-all ${
                              errors.nombre 
                                ? 'border-red-500/40 focus:ring-red-500/20 bg-red-500/10'
                                : 'border-hairline focus:ring-gold-500 focus:border-gold-500 bg-surface'
                            }`}
                          />
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-smoke">
                            <User className="h-4 w-4" />
                          </div>
                        </div>
                        {errors.nombre && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.nombre}</p>}
                      </div>

                      {/* Celular */}
                      <div>
                        <label className="block text-xs font-bold text-smoke uppercase tracking-wide mb-1.5">
                          Celular de contacto <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={customer.celular}
                            onChange={(e) => handleFieldChange('celular', e.target.value)}
                            placeholder="Ej: 381 123-4567"
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-bone placeholder-smoke focus:outline-none focus:ring-2 transition-all ${
                              errors.celular 
                                ? 'border-red-500/40 focus:ring-red-500/20 bg-red-500/10'
                                : 'border-hairline focus:ring-gold-500 focus:border-gold-500 bg-surface'
                            }`}
                          />
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-smoke">
                            <Phone className="h-4 w-4" />
                          </div>
                        </div>
                        {errors.celular && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.celular}</p>}
                      </div>
                    </div>

                    {/* Componente del Mapa y Dirección */}
                    <div className="bg-surface rounded-2xl border border-hairline p-4 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 pb-2 border-b border-hairline">
                        <MapPin className="h-4 w-4 text-gold-500" />
                        <p className="text-xs font-black uppercase tracking-wider text-smoke">Ubicación de entrega</p>
                      </div>

                      <MapInput
                        address={customer.direccion}
                        onChangeAddress={(val) => handleFieldChange('direccion', val)}
                        lat={customer.lat}
                        lng={customer.lng}
                        onChangeCoords={(la, ln) => {
                          updateCustomer('lat', la)
                          updateCustomer('lng', ln)
                          if (errors.direccion) {
                            setErrors(prev => ({ ...prev, direccion: null }))
                          }
                        }}
                      />
                      {errors.direccion && <p className="text-red-400 text-xs font-semibold">{errors.direccion}</p>}

                      {/* Referencia */}
                      <div>
                        <label className="block text-xs font-bold text-smoke uppercase tracking-wide mb-1.5">
                          Referencia de entrega (Opcional)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={customer.referencia}
                            onChange={(e) => updateCustomer('referencia', e.target.value)}
                            placeholder="Ej: Portón verde, entre San Martín y Chacabuco"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-sm text-bone placeholder-smoke focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-surface transition-all"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-smoke">
                            <FileText className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: isMovingForward ? 30 : -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isMovingForward ? -30 : 30 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-xs font-extrabold text-smoke uppercase tracking-widest">Resumen de Entrega</p>
                    
                    {/* Resumen datos envío */}
                    <div className="bg-surface rounded-2xl border border-hairline p-4 space-y-3.5 shadow-sm">
                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-surface-raised border border-hairline flex items-center justify-center text-gold-500 shrink-0">
                          <User className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-smoke uppercase tracking-wide leading-none mb-1">Destinatario</p>
                          <p className="font-extrabold text-bone">{customer.nombre}</p>
                          <p className="text-xs font-medium text-smoke mt-0.5">{customer.celular}</p>
                          {(user || loadedFromCodeUser) && (
                            <span className="inline-block bg-gold-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-md mt-1.5">
                              ⭐ Socio Club FKUS: #{user?.club_code || loadedFromCodeUser?.club_code}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full h-px bg-surface-raised" />

                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-surface-raised border border-hairline flex items-center justify-center text-gold-500 shrink-0">
                          <MapPin className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-smoke uppercase tracking-wide leading-none mb-1">Dirección Seleccionada</p>
                          <p className="font-extrabold text-bone">{customer.direccion}</p>
                          {customer.referencia.trim() && (
                            <p className="text-xs font-medium text-smoke mt-1 bg-surface-raised p-2 rounded-lg border border-hairline">
                              🏠 <span className="font-bold text-smoke">Ref:</span> {customer.referencia}
                            </p>
                          )}
                          <p className="text-[10px] text-gold-400 font-bold mt-1.5 flex items-center gap-1">
                            📍 Pin GPS asignado ({customer.lat.toFixed(5)}, {customer.lng.toFixed(5)})
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs font-extrabold text-smoke uppercase tracking-widest mt-2">Productos ({count})</p>

                    {/* Resumen productos */}
                    <div className="bg-surface rounded-2xl border border-hairline p-4 divide-y divide-hairline shadow-sm max-h-56 overflow-y-auto">
                      {items.map(item => (
                        <div key={item.cartItemId || String(item.id)} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-bone truncate">{item.name}</p>
                            <p className="text-[10px] text-smoke mt-0.5">
                              {item.quantity} × {fmt(item.price)} {item.unit ? `(${item.unit})` : ''}
                              {(item.selectedSize || item.selectedColor) && (
                                <span className="ml-1 font-bold text-smoke">
                                  [{[item.selectedColor, item.selectedSize].filter(Boolean).join(', ')}]
                                </span>
                              )}
                            </p>
                          </div>
                          <p className="font-extrabold text-bone shrink-0">
                            {fmt((parseFloat(item.price || 0) * item.quantity).toString())}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Disclaimer de puntos */}
                    <div className="bg-surface-raised border border-hairline rounded-xl p-3.5">
                      <p className="text-[11px] text-smoke font-medium leading-relaxed">
                        {user || loadedFromCodeUser ? (
                          `🎁 ¡Sumás puntos! Al confirmar tu compra, se acreditarán ${Math.floor(total / 10000)} puntos en tu cuenta Club FKUS (1 punto cada $10.000).`
                        ) : (
                          '💡 Tu pedido se enviará por WhatsApp. Si tuvieras cuenta Club FKUS, podrías sumar puntos con este pedido.'
                        )}
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center text-center py-10 px-2 space-y-6 animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="w-20 h-20 rounded-full bg-surface-raised border border-hairline flex items-center justify-center text-gold-500 animate-bounce">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-extrabold text-bone animate-pulse">¡Pedido Registrado!</h3>
                      <p className="text-sm text-smoke max-w-xs leading-relaxed mx-auto font-medium">
                        Tu compra ha sido cargada con éxito en nuestro sistema de reparto.
                      </p>
                    </div>

                    {generatedOrderId && (
                      <div className="inline-flex items-center gap-1.5 bg-surface-raised border border-hairline text-gold-400 text-xs font-black px-4 py-2 rounded-2xl font-mono shadow-sm">
                        🆔 Pedido Nro: #{generatedOrderId}
                      </div>
                    )}

                    <div className="bg-surface border border-hairline rounded-3xl p-5 shadow-sm space-y-4 max-w-xs w-full">
                      <p className="text-xs text-smoke leading-normal font-semibold">
                        Para coordinar el pago y la entrega, envía el detalle del pedido a nuestro WhatsApp haciendo clic abajo.
                      </p>
                      
                      <button
                        onClick={handleFinalizeWhatsApp}
                        className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-sm cursor-pointer"
                      >
                        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Enviar a WhatsApp
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 w-full max-w-xs">
                      <button
                        type="button"
                        onClick={handleCopyMessage}
                        className="text-xs font-bold text-smoke hover:text-gold-500 transition-colors flex items-center justify-center gap-1 bg-surface-raised hover:bg-surface-raised border border-hairline/60 py-2.5 rounded-xl cursor-pointer"
                      >
                        {copied ? '¡Copiado con éxito! ✓' : '📋 Copiar detalle del pedido'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          clearCart()
                          setIsOpen(false)
                        }}
                        className="text-xs font-bold text-smoke hover:text-bone transition-colors py-2 cursor-pointer"
                      >
                        Volver al Catálogo sin enviar
                      </button>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer con cálculo de importes y acciones */}
            {step <= 3 && (
              <div className="border-t border-hairline bg-surface px-5 py-4 space-y-3 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                {/* Resumen Financiero */}
                <div className="space-y-1.5 text-xs font-semibold text-smoke bg-surface-raised border border-hairline rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <p>Subtotal de productos</p>
                    <p className="text-bone font-bold">{fmt(total.toString())}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1 text-gold-400 font-bold">
                      <Truck className="h-3.5 w-3.5" /> Envío de entrega
                    </p>
                    <p className="text-gold-400 font-bold uppercase">Gratis</p>
                  </div>
                  <div className="h-px bg-hairline my-2" />
                  <div className="flex items-center justify-between text-sm text-bone font-black">
                    <p>Total Estimado</p>
                    <p className="text-lg text-gold-400 tracking-tight font-extrabold">{fmt(total.toString())}</p>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={submittingOrder}
                      className="px-4 py-3.5 rounded-2xl border border-hairline hover:border-zinc-500 text-smoke font-extrabold flex items-center justify-center transition-all bg-surface hover:bg-surface-raised active:scale-95 shadow-sm disabled:opacity-50"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1 bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-black font-extrabold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm active:scale-98 animate-none"
                    >
                      Continuar
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={confirmAndRegisterOrder}
                      disabled={submittingOrder}
                      className="flex-1 bg-gold-500 hover:bg-gold-400 text-black font-black py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 text-base active:scale-[0.97] hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
                    >
                      {submittingOrder ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5 shrink-0" />
                          Confirmar Pedido
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
