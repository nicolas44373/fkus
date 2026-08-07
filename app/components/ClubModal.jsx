'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useClub } from '../context/ClubContext'
import MapInput from './MapInput'
import { 
  X, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  Check, 
  LogOut, 
  MapPin, 
  Gift, 
  Trophy, 
  Star, 
  FileText,
  Loader2,
  LockKeyhole
} from 'lucide-react'

export default function ClubModal() {
  const { 
    user, 
    isModalOpen, 
    setIsModalOpen, 
    modalTab, 
    setModalTab, 
    login, 
    register, 
    logout, 
    updateProfile 
  } = useClub()

  // Form states
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [celular, setCelular] = useState('')
  const [gmail, setGmail] = useState('')

  // Profile fields state
  const [direccion, setDireccion] = useState('')
  const [referencia, setReferencia] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)

  // Status states
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)
  const modalBodyRef = useRef(null)

  // Sincronizar datos del perfil cuando el usuario cambia
  useEffect(() => {
    if (user) {
      setDireccion(user.direccion || '')
      setReferencia(user.referencia || '')
      setLat(user.lat || null)
      setLng(user.lng || null)
    } else {
      setDni('')
      setPassword('')
      setNombre('')
      setApellido('')
      setCelular('')
      setGmail('')
      setDireccion('')
      setReferencia('')
      setLat(null)
      setLng(null)
    }
    setFormError('')
    setSaveSuccess(false)
  }, [user, modalTab])

  if (!isModalOpen) return null

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!dni.trim() || !password.trim()) {
      setFormError('Por favor completa todos los campos')
      return
    }
    setSubmitting(true)
    setFormError('')
    
    const res = await login(dni, password)
    setSubmitting(false)
    if (!res.success) {
      setFormError(res.error)
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (!dni.trim() || !nombre.trim() || !apellido.trim() || !celular.trim() || !gmail.trim() || !password.trim()) {
      setFormError('Por favor completa todos los campos obligatorios')
      return
    }
    setSubmitting(true)
    setFormError('')

    const res = await register({
      dni,
      nombre,
      apellido,
      celular,
      gmail,
      password
    })
    setSubmitting(false)
    if (!res.success) {
      setFormError(res.error)
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!direccion.trim()) {
      setFormError('La dirección es obligatoria')
      if (modalBodyRef.current) modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSubmitting(true)
    setFormError('')
    setSaveSuccess(false)

    let currentLat = lat
    let currentLng = lng

    // Fallback: Si no hay coordenadas (porque el usuario escribió a mano y no seleccionó sugerencia)
    if (!currentLat || !currentLng) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}&countrycodes=ar&limit=1`,
          { headers: { 'Accept-Language': 'es' } }
        )
        const data = await response.json()
        if (data && data[0]) {
          currentLat = parseFloat(data[0].lat)
          currentLng = parseFloat(data[0].lon)
          setLat(currentLat)
          setLng(currentLng)
        } else {
          setSubmitting(false)
          setFormError('No pudimos ubicar tu dirección en el mapa. Escribe otra calle y selecciona una sugerencia o mueve el pin.')
          if (modalBodyRef.current) modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
      } catch (err) {
        setSubmitting(false)
        setFormError('Error de red al ubicar la dirección. Por favor selecciona una sugerencia.')
        if (modalBodyRef.current) modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }
    
    const res = await updateProfile({
      direccion: direccion.trim(),
      referencia: referencia.trim(),
      lat: currentLat,
      lng: currentLng
    })
    setSubmitting(false)
    if (res.success) {
      setShowSuccessOverlay(true)
      setTimeout(() => {
        setShowSuccessOverlay(false)
        setIsModalOpen(false)
      }, 1500)
    } else {
      setFormError(res.error)
      if (modalBodyRef.current) modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative bg-surface-raised rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header del Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-hairline shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold-500" />
            <h3 className="font-extrabold text-bone text-base">
              {user ? 'Mi Perfil Club FKUS' : 'Club FKUS'}
            </h3>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 text-smoke hover:text-bone hover:bg-surface-raised rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div ref={modalBodyRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3.5 rounded-xl leading-relaxed">
              ⚠️ {formError}
            </div>
          )}

          {saveSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold p-3.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
              <Check className="h-4 w-4 shrink-0 stroke-[3]" />
              ¡Datos de envío actualizados en tu cuenta Club FKUS!
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* VISTA LOGIN */}
            {!user && modalTab === 'login' && (
              <motion.form 
                key="login-form"
                onSubmit={handleLoginSubmit} 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-400 mx-auto mb-3">
                    <LockKeyhole className="h-6 w-6" />
                  </div>
                  <h4 className="font-extrabold text-bone text-lg">Iniciá sesión en el Club</h4>
                  <p className="text-xs text-smoke mt-1 max-w-xs mx-auto">
                    Accedé a tus beneficios y autocompletá tus direcciones de entrega.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-smoke uppercase tracking-wide mb-1.5">Número de DNI</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={dni}
                        onChange={e => setDni(e.target.value)}
                        placeholder="Ingresá tu DNI"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-surface"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-smoke">
                        <FileText className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-smoke uppercase tracking-wide mb-1.5">Contraseña</label>
                    <div className="relative">
                      <input 
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Contraseña elegida"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-surface"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-smoke">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gold-500 hover:bg-gold-400 text-black font-extrabold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-98"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ingresar al Club'}
                  </button>

                  <div className="text-center pt-2 border-t border-hairline">
                    <p className="text-xs text-smoke">
                      ¿Aún no tenés cuenta?{' '}
                      <button 
                        type="button"
                        onClick={() => setModalTab('register')}
                        className="text-gold-400 font-extrabold hover:underline"
                      >
                        Creá tu cuenta FKUS
                      </button>
                    </p>
                  </div>
                </div>
              </motion.form>
            )}

            {/* VISTA REGISTRO */}
            {!user && modalTab === 'register' && (
              <motion.form 
                key="register-form"
                onSubmit={handleRegisterSubmit} 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="bg-gradient-to-r from-surface-raised to-surface-raised border border-hairline p-4 rounded-2xl shadow-sm text-center">
                  <Gift className="h-6 w-6 text-gold-500 mx-auto mb-1 animate-bounce" />
                  <h4 className="font-extrabold text-gold-300 text-sm">🎁 ¡Regalo de Bienvenida!</h4>
                  <p className="text-[11px] text-gold-400 mt-0.5 leading-relaxed">
                    Registrá tu cuenta FKUS hoy y sumá **100 puntos gratis** para canjear en tus próximas compras.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-smoke uppercase tracking-wide mb-1.5">Nombre</label>
                      <input 
                        type="text"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        placeholder="Ej: Juan"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-smoke uppercase tracking-wide mb-1.5">Apellido</label>
                      <input 
                        type="text"
                        value={apellido}
                        onChange={e => setApellido(e.target.value)}
                        placeholder="Ej: Pérez"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-surface"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-smoke uppercase tracking-wide mb-1.5">Número de DNI</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={dni}
                        onChange={e => setDni(e.target.value)}
                        placeholder="Sin puntos ni espacios"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-surface"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-smoke">
                        <FileText className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-smoke uppercase tracking-wide mb-1.5">Celular de contacto</label>
                    <div className="relative">
                      <input 
                        type="tel"
                        value={celular}
                        onChange={e => setCelular(e.target.value)}
                        placeholder="Ej: 3811234567"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-surface"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-smoke">
                        <Phone className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-smoke uppercase tracking-wide mb-1.5">Correo Electrónico (Gmail)</label>
                    <div className="relative">
                      <input 
                        type="email"
                        value={gmail}
                        onChange={e => setGmail(e.target.value)}
                        placeholder="Ej: juan.perez@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-surface"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-smoke">
                        <Mail className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-smoke uppercase tracking-wide mb-1.5">Contraseña elegida</label>
                    <div className="relative">
                      <input 
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Elegí tu contraseña de acceso"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-surface"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-smoke">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gold-500 hover:bg-gold-400 text-black font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-98"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrarme y Ganar 100 Puntos'}
                  </button>

                  <div className="text-center pt-2 border-t border-hairline">
                    <p className="text-xs text-smoke">
                      ¿Ya tenés una cuenta?{' '}
                      <button 
                        type="button"
                        onClick={() => setModalTab('login')}
                        className="text-gold-400 font-extrabold hover:underline"
                      >
                        Iniciá sesión
                      </button>
                    </p>
                  </div>
                </div>
              </motion.form>
            )}

            {/* VISTA PERFIL LOGUEADO */}
            {user && modalTab === 'profile' && (
              <motion.div 
                key="profile-view"
                className="space-y-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {/* Membresía FKUS Digital */}
                <div className="relative bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-3xl p-5 text-white shadow-xl overflow-hidden border border-zinc-800">
                  {/* Círculos decorativos de fondo */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl -translate-y-6 translate-x-6"></div>
                  <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-gold-500/10 rounded-full blur-xl"></div>

                  <div className="relative flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-gold-500 text-black px-2 py-0.5 rounded-full">
                        Socio Club FKUS
                      </span>
                      <h4 className="font-extrabold text-xl mt-3 tracking-tight text-white">
                        {user.nombre.toUpperCase()} {user.apellido.toUpperCase()}
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-medium mt-1">DNI: {user.dni}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/10 flex flex-col items-center shadow-inner">
                      <Star className="h-6 w-6 text-gold-400 fill-gold-400 animate-pulse" />
                    </div>
                  </div>

                  <div className="mt-7 flex items-end justify-between">
                    <div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider leading-none">Código Único</p>
                      <p className="text-2xl font-black tracking-widest font-mono mt-1 select-all bg-white/10 text-white px-2 py-0.5 rounded-lg border border-white/10">
                        #{user.club_code}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider leading-none">Mis Puntos</p>
                      <p className="text-2xl font-black tracking-tight mt-1 flex items-center justify-end gap-1.5 text-gold-400">
                        <Trophy className="h-5 w-5 text-gold-400 shrink-0" />
                        {user.points} <span className="text-xs font-bold text-white/90">pts</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Explicativo del club */}
                <div className="bg-surface-raised border border-hairline rounded-2xl p-3.5 text-center">
                  <p className="text-[11px] text-gold-300 font-semibold leading-relaxed">
                    🌟 <span className="font-extrabold">Beneficio:</span> Con tu código <span className="font-black text-gold-300">#{user.club_code}</span> sumás **1 punto cada $10.000** en todas tus compras confirmadas y accedés a regalos del Club.
                  </p>
                </div>

                {/* Formulario Dirección de Envío */}
                <form onSubmit={handleSaveProfile} className="space-y-4 pt-1 border-t border-hairline">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-gold-500" />
                    <h5 className="font-extrabold text-bone text-sm">Dirección de entrega predeterminada</h5>
                  </div>

                  <MapInput
                    address={direccion}
                    onChangeAddress={setDireccion}
                    lat={lat}
                    lng={lng}
                    onChangeCoords={(la, ln) => {
                      setLat(la)
                      setLng(ln)
                    }}
                  />

                  {/* Referencias */}
                  <div>
                    <label className="block text-xs font-bold text-smoke uppercase tracking-wide mb-1.5">
                      Referencias (piso, dpto, indicaciones)
                    </label>
                    <input
                      type="text"
                      value={referencia}
                      onChange={e => setReferencia(e.target.value)}
                      placeholder="Ej: Portón azul, timbre 3A"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-hairline text-sm text-bone placeholder-smoke focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-surface shadow-sm"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gold-500 hover:bg-gold-400 text-black font-extrabold py-3 rounded-xl shadow-sm hover:shadow transition-all text-xs disabled:opacity-50 active:scale-98"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Guardar Datos de Entrega'}
                    </button>
                    <button
                      type="button"
                      onClick={logout}
                      className="px-4 py-3 rounded-xl border border-hairline text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center font-bold text-xs"
                      title="Cerrar Sesión"
                    >
                      <LogOut className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Overlay de Éxito en Guardado */}
        <AnimatePresence>
          {showSuccessOverlay && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface/95 z-50 flex flex-col items-center justify-center text-center p-6"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-md">
                <Check className="h-8 w-8 stroke-[3] animate-bounce" />
              </div>
              <h4 className="text-xl font-black text-bone">¡Datos Actualizados!</h4>
              <p className="text-xs text-smoke mt-2 max-w-xs leading-relaxed">
                Tu dirección y pin de entrega se guardaron con éxito en tu cuenta de Club FKUS.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
