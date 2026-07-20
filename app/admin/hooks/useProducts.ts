// hooks/useProducts.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type ProductPayload = {
  name: string
  price: string
  compare_at_price?: string | null
  sizes?: string | null
  colors?: string | null
  unit?: string
  category_id: string
  marca?: string | null
  in_stock?: boolean
  image_url?: string | null
}

export type Product = {
  id: number
  name: string
  price: string | null
  compare_at_price: string | null
  sizes: string | null
  colors: string | null
  unit: string | null
  category_id: number
  marca: string | null
  in_stock: boolean
  image_url?: string | null
  category_name: string
}

export function applyRounding(price: number, rule: string): number {
  switch (rule) {
    case 'integer':
      return Math.round(price)
    case '10':
      return Math.round(price / 10) * 10
    case '50':
      return Math.round(price / 50) * 50
    case '100':
      return Math.round(price / 100) * 100
    case 'none':
    default:
      return Math.round(price * 100) / 100
  }
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadAll = async () => {
    try {
      setLoading(true)
      let productsData = null
      let categoriesData = null

      const [{ data: pData, error: pErr }, { data: cData, error: cErr }] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, price, compare_at_price, sizes, colors, unit, category_id, marca, in_stock, image_url, categories(name)')
          .order('name'),
        supabase.from('categories').select('id, name, image_url').order('name')
      ])

      if (pErr) {
        if (pErr.code === '42703' || (pErr.message && pErr.message.includes('compare_at_price'))) {
          console.warn('Supabase admin: Las columnas de indumentaria no existen todavía. Ejecutando fallback.')
          const [{ data: fallbackP, error: fallbackPErr }, { data: fallbackC, error: fallbackCErr }] = await Promise.all([
            supabase
              .from('products')
              .select('id, name, price, unit, category_id, marca, in_stock, image_url, categories(name)')
              .order('name'),
            supabase.from('categories').select('id, name, image_url').order('name')
          ])
          if (fallbackPErr) throw fallbackPErr
          productsData = fallbackP
          categoriesData = fallbackC
        } else {
          throw pErr
        }
      } else {
        productsData = pData
        categoriesData = cData
      }

      if (productsData) {
        setProducts(
          productsData.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            compare_at_price: p.compare_at_price || null,
            sizes: p.sizes || null,
            colors: p.colors || null,
            unit: p.unit,
            category_id: p.category_id,
            marca: p.marca,
            in_stock: p.in_stock !== false, // default to true if null
            image_url: p.image_url || '',
            category_name: p.categories?.name || ''
          }))
        )
      }
      if (categoriesData) setCategories(categoriesData)
    } catch (e) {
      console.error('Error cargando productos/categorías', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const addProduct = async (payload: ProductPayload) => {
    try {
      setSubmitting(true)
      const insertData: any = {
        name: payload.name,
        price: payload.price !== '' ? payload.price : null,
        compare_at_price: payload.compare_at_price !== '' && payload.compare_at_price ? payload.compare_at_price : null,
        sizes: payload.sizes || null,
        colors: payload.colors || null,
        unit: payload.unit || null,
        category_id: Number(payload.category_id),
        marca: payload.marca || null,
        in_stock: payload.in_stock !== false,
        image_url: payload.image_url || null
      }

      const { error } = await supabase.from('products').insert([insertData])
      if (error) throw error
      await loadAll()
      return { success: true }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message || 'Error' }
    } finally {
      setSubmitting(false)
    }
  }

  const updateProduct = async (id: number | string, payload: ProductPayload) => {
    try {
      setSubmitting(true)
      const updateData: any = {
        name: payload.name,
        price: payload.price !== '' ? payload.price : null,
        compare_at_price: payload.compare_at_price !== '' && payload.compare_at_price ? payload.compare_at_price : null,
        sizes: payload.sizes || null,
        colors: payload.colors || null,
        unit: payload.unit || null,
        category_id: Number(payload.category_id),
        marca: payload.marca || null,
        in_stock: payload.in_stock !== false,
        image_url: payload.image_url || null
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
      if (error) throw error
      await loadAll()
      return { success: true }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message || 'Error' }
    } finally {
      setSubmitting(false)
    }
  }

  const toggleStock = async (id: number | string, currentStock: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ in_stock: !currentStock })
        .eq('id', id)
      if (error) throw error

      setProducts(prev =>
        prev.map(p => (p.id === id ? { ...p, in_stock: !currentStock } : p))
      )
      return { success: true }
    } catch (error: any) {
      console.error('Error toggling stock:', error)
      return { success: false, error: error.message || 'Error al cambiar stock' }
    }
  }

  const bulkUpdatePrices = async (productIds: number[], percentage: number, roundingRule: string) => {
    try {
      setSubmitting(true)
      const selectedProducts = products.filter(p => productIds.includes(p.id))

      const updates = selectedProducts
        .map(p => {
          if (!p.price) return null
          const currentPrice = parseFloat(p.price)
          if (isNaN(currentPrice)) return null

          const factor = 1 + percentage / 100
          const newPrice = applyRounding(currentPrice * factor, roundingRule)

          return {
            id: p.id,
            price: String(newPrice)
          }
        })
        .filter(Boolean) as { id: number; price: string }[]

      const chunkSize = 15
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize)
        await Promise.all(
          chunk.map(item =>
            supabase
              .from('products')
              .update({ price: item.price })
              .eq('id', item.id)
          )
        )
      }

      await loadAll()
      return { success: true, updatedCount: updates.length }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message || 'Error en actualización masiva' }
    } finally {
      setSubmitting(false)
    }
  }

  const deleteProduct = async (id: number | string) => {
    try {
      setSubmitting(true)
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      await loadAll()
      return { success: true }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message || 'Error' }
    } finally {
      setSubmitting(false)
    }
  }

  const updateCategory = async (id: number | string, payload: { name?: string; image_url: string | null }) => {
    try {
      setSubmitting(true)
      const updateData: any = {
        image_url: payload.image_url
      }
      if (payload.name) {
        updateData.name = payload.name
      }
      const { error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
      if (error) throw error
      await loadAll()
      return { success: true }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message || 'Error al actualizar categoría' }
    } finally {
      setSubmitting(false)
    }
  }

  const addCategory = async (payload: { name: string; image_url?: string | null }) => {
    try {
      setSubmitting(true)
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: payload.name, image_url: payload.image_url || null }])
        .select()
      if (error) throw error
      await loadAll()
      return { success: true, category: data[0] }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message || 'Error al agregar categoría' }
    } finally {
      setSubmitting(false)
    }
  }

  const deleteCategory = async (id: number | string) => {
    try {
      setSubmitting(true)
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
      if (error) throw error
      await loadAll()
      return { success: true }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message || 'Error al eliminar categoría' }
    } finally {
      setSubmitting(false)
    }
  }

  const seedFkusCategories = async () => {
    const fkusCategories = [
      'Pantalones',
      'Pantalones - Bermudas',
      'Pantalones - Cargos',
      'Pantalones - Jeans',
      'Pantalones - Joggers',
      'Pantalones - Sastreros',
      'Remeras',
      'Remeras - Boxy',
      'Remeras - Chombas',
      'Remeras - Musculosa',
      'Remeras - Oversize',
      'Remeras - Regulares',
      'Remeras - Tejidas',
      'Buzos',
      'Buzos - Boxy',
      'Camperas',
      'Chalecos',
      'Conjuntos',
      'Camisacos',
      'Camisas',
      'Accesorios',
      'Sweaters',
      'Zapatillas',
      'Mallas',
      'Importados',
    ]

    try {
      setSubmitting(true)
      const existingNames = categories.map((c: any) => c.name.toLowerCase().trim())
      const newToInsert = fkusCategories
        .filter(name => !existingNames.includes(name.toLowerCase().trim()))
        .map(name => ({ name, image_url: null }))

      if (newToInsert.length === 0) {
        return { success: true, count: 0, message: 'Todas las categorías FKUS ya están creadas.' }
      }

      const { error } = await supabase.from('categories').insert(newToInsert)
      if (error) throw error
      await loadAll()
      return { success: true, count: newToInsert.length, message: `Se agregaron ${newToInsert.length} rubros/subcategorías de FKUS.` }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message || 'Error al cargar rubros FKUS' }
    } finally {
      setSubmitting(false)
    }
  }

  return {
    products,
    categories,
    loading,
    submitting,
    addProduct,
    updateProduct,
    toggleStock,
    bulkUpdatePrices,
    deleteProduct,
    updateCategory,
    addCategory,
    deleteCategory,
    seedFkusCategories
  }
}
