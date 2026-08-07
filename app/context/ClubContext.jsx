'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const ClubContext = createContext(null)

export function ClubProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState('login') // 'login' | 'register' | 'profile'
  const [loading, setLoading] = useState(true)

  // Restaurar sesión del Club desde localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('alenort-logged-user')
      if (savedUser) {
        const parsed = JSON.parse(savedUser)
        setUser(parsed)
        // Opcional: refrescar datos del usuario en segundo plano desde Supabase
        refreshUserData(parsed.dni)
      }
    } catch (e) {
      console.error('Error restaurando sesión del club:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshUserData = async (dni) => {
    try {
      const { data, error } = await supabase
        .from('club_users')
        .select('*')
        .eq('dni', dni)
        .maybeSingle()
      
      if (data && !error) {
        setUser(data)
        localStorage.setItem('alenort-logged-user', JSON.stringify(data))
      }
    } catch {}
  }

  // Generar código de 4 dígitos único
  const generateUniqueCode = async () => {
    let code = ''
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 100) {
      attempts++
      // Generar número aleatorio entre 1000 y 9999
      code = Math.floor(1000 + Math.random() * 9000).toString()
      
      // Validar si existe en la base de datos
      const { data, error } = await supabase
        .from('club_users')
        .select('club_code')
        .eq('club_code', code)
        .maybeSingle()
      
      if (!data && !error) {
        isUnique = true
      }
    }
    return code
  }

  // Iniciar sesión
  const login = useCallback(async (dni, password) => {
    try {
      const cleanDni = dni.trim()
      const { data, error } = await supabase
        .from('club_users')
        .select('*')
        .eq('dni', cleanDni)
        .eq('password', password)
        .maybeSingle()
      
      if (error) throw error
      if (!data) {
        throw new Error('DNI o contraseña incorrectos')
      }

      setUser(data)
      localStorage.setItem('alenort-logged-user', JSON.stringify(data))
      setIsModalOpen(false)
      return { success: true, user: data }
    } catch (error) {
      console.error('Error en login:', error)
      return { success: false, error: error.message || 'Error al iniciar sesión' }
    }
  }, [])

  // Registrarse
  const register = useCallback(async ({ dni, nombre, apellido, celular, gmail, password }) => {
    try {
      const cleanDni = dni.trim()
      
      // Validar si ya existe el DNI
      const { data: existingDni } = await supabase
        .from('club_users')
        .select('dni')
        .eq('dni', cleanDni)
        .maybeSingle()
      
      if (existingDni) {
        throw new Error('El DNI ya se encuentra registrado en el Club FKUS')
      }

      // Generar código de membresía
      const clubCode = await generateUniqueCode()

      const newUserPayload = {
        dni: cleanDni,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        celular: celular.trim(),
        gmail: gmail.trim(),
        password,
        points: 100, // 100 puntos de bienvenida
        club_code: clubCode,
        direccion: '',
        referencia: '',
        lat: null,
        lng: null
      }

      const { error } = await supabase
        .from('club_users')
        .insert([newUserPayload])
      
      if (error) throw error

      setUser(newUserPayload)
      localStorage.setItem('alenort-logged-user', JSON.stringify(newUserPayload))
      setModalTab('profile') // Mostrarle su nuevo perfil y código
      return { success: true, user: newUserPayload }
    } catch (error) {
      console.error('Error en registro:', error)
      return { success: false, error: error.message || 'Error al crear la cuenta' }
    }
  }, [])

  // Cerrar sesión
  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('alenort-logged-user')
    setIsModalOpen(false)
  }, [])

  // Actualizar perfil (dirección, coordenadas, etc.)
  const updateProfile = useCallback(async (updatedData) => {
    if (!user) return { success: false, error: 'No hay sesión activa' }
    try {
      const { error } = await supabase
        .from('club_users')
        .update(updatedData)
        .eq('dni', user.dni)
      
      if (error) throw error

      const updatedUser = { ...user, ...updatedData }
      setUser(updatedUser)
      localStorage.setItem('alenort-logged-user', JSON.stringify(updatedUser))
      return { success: true }
    } catch (error) {
      console.error('Error actualizando perfil:', error)
      return { success: false, error: error.message || 'Error al actualizar perfil' }
    }
  }, [user])

  // Buscar usuario por código de 4 dígitos
  const fetchUserByCode = useCallback(async (code) => {
    try {
      const { data, error } = await supabase
        .from('club_users')
        .select('*')
        .eq('club_code', code.trim())
        .maybeSingle()
      
      if (error) throw error
      return data // Retorna null si no existe
    } catch (error) {
      console.error('Error buscando usuario por código:', error)
      return null
    }
  }, [])

  const openClubModal = useCallback((tab = 'login') => {
    setModalTab(tab)
    setIsModalOpen(true)
  }, [])

  return (
    <ClubContext.Provider value={{
      user,
      isModalOpen,
      setIsModalOpen,
      modalTab,
      setModalTab,
      openClubModal,
      login,
      register,
      logout,
      updateProfile,
      fetchUserByCode,
      refreshUserData: () => user && refreshUserData(user.dni),
      loading
    }}>
      {children}
    </ClubContext.Provider>
  )
}

export const useClub = () => {
  const ctx = useContext(ClubContext)
  if (!ctx) throw new Error('useClub must be used within ClubProvider')
  return ctx
}
