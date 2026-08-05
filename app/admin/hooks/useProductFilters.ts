// hooks/useProductFilters.ts
'use client'

import { useMemo, useState } from 'react'
import { Product } from './useProducts'

export type SortField = 'name' | 'category' | 'marca' | 'price' | 'stock_quantity'
export type SortDirection = 'asc' | 'desc'

export function useProductFilters(products: Product[]) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredProducts = useMemo(() => {
    // 1. Filtrar
    const filtered = products.filter((p) => {
      const matchesCategory =
        !selectedCategory || selectedCategory === 'all' || String(p.category_id) === String(selectedCategory)
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.marca && p.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category_name && p.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesCategory && matchesSearch
    })

    // 2. Ordenar
    return [...filtered].sort((a, b) => {
      let comparison = 0

      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name, 'es')
      } else if (sortField === 'category') {
        comparison = (a.category_name || '').localeCompare(b.category_name || '', 'es')
      } else if (sortField === 'marca') {
        comparison = (a.marca || '').localeCompare(b.marca || '', 'es')
      } else if (sortField === 'price') {
        const priceA = parseFloat(a.price || '0')
        const priceB = parseFloat(b.price || '0')
        comparison = priceA - priceB
      } else if (sortField === 'stock_quantity') {
        comparison = (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0)
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [products, selectedCategory, searchTerm, sortField, sortDirection])

  return {
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm,
    sortField,
    sortDirection,
    toggleSort,
    filteredProducts
  }
}
