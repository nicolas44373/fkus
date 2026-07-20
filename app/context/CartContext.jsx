'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext(null)

const emptyCustomer = { nombre: '', celular: '', direccion: '', referencia: '', lat: null, lng: null }

export function CartProvider({ children }) {
  const [items, setItems]       = useState([])
  const [isOpen, setIsOpen]     = useState(false)
  const [customer, setCustomer] = useState(emptyCustomer)

  // Restaurar desde localStorage
  useEffect(() => {
    try {
      const savedItems    = localStorage.getItem('alenort-cart')
      const savedCustomer = localStorage.getItem('alenort-customer')
      if (savedItems)    setItems(JSON.parse(savedItems))
      if (savedCustomer) setCustomer(JSON.parse(savedCustomer))
    } catch {}
  }, [])

  useEffect(() => { localStorage.setItem('alenort-cart', JSON.stringify(items)) }, [items])
  useEffect(() => { localStorage.setItem('alenort-customer', JSON.stringify(customer)) }, [customer])

  const addItem = useCallback((product) => {
    const key = product.cartItemId || String(product.id)
    setItems(prev => {
      const existing = prev.find(i => (i.cartItemId || String(i.id)) === key)
      if (existing) return prev.map(i => (i.cartItemId || String(i.id)) === key ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...product, cartItemId: key, quantity: 1 }]
    })
  }, [])

  const removeItem  = useCallback((key) => setItems(prev => prev.filter(i => (i.cartItemId || String(i.id)) !== String(key))), [])

  const updateQty   = useCallback((key, qty) => {
    const sKey = String(key)
    if (qty <= 0) setItems(prev => prev.filter(i => (i.cartItemId || String(i.id)) !== sKey))
    else          setItems(prev => prev.map(i => (i.cartItemId || String(i.id)) === sKey ? { ...i, quantity: qty } : i))
  }, [])

  const clearCart   = useCallback(() => setItems([]), [])

  const getQty      = useCallback((key) => items.find(i => (i.cartItemId || String(i.id)) === String(key))?.quantity ?? 0, [items])

  const updateCustomer = useCallback((field, value) => {
    setCustomer(prev => ({ ...prev, [field]: value }))
  }, [])

  const count = items.reduce((s, i) => s + i.quantity, 0)
  const total = items.reduce((s, i) => s + (parseFloat(i.price || 0) * i.quantity), 0)

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, clearCart, getQty,
      count, total,
      isOpen, setIsOpen,
      customer, updateCustomer,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
