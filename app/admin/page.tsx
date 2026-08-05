'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useProducts } from './hooks/useProducts'
import { useProductFilters } from './hooks/useProductFilters'
import AdminHeader from './components/AdminHeader'
import AdminStats from './components/AdminStats'
import ProductFilters from './components/ProductFilters'
import ProductForm from './components/ProductForm'
import ProductsTable from './components/ProductsTable'
import LoadingScreen from './components/LoadingScreen'
import PriceListModal from './components/PriceListModal'
import BulkPriceUpdateModal from './components/BulkPriceUpdateModal'
import CategoryModal from './components/CategoryModal'
import { Trophy, Check, X, Search, Edit2, Loader2, ArrowUpRight, Percent, Trash2, Plus } from 'lucide-react'

type Toast = { message: string; type: 'success' | 'error' } | null
type ConfirmDel = { id: number | string; name: string } | null

const emptyForm = { name: '', price: '', compare_at_price: '', sizes: '', colors: '', unit: '', category_id: '', marca: '', stock_quantity: 0, image_urls: [] as string[] }

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'members' | 'categories'>('products')
  
  // Productos states
  const [showAddForm, setShowAddForm]     = useState(false)
  const [editingProduct, setEditingProduct] = useState<number | string | null>(null)
  const [editFormData, setEditFormData]   = useState<any>({ ...emptyForm })
  const [toast, setToast]                 = useState<Toast>(null)
  const [confirmDel, setConfirmDel]       = useState<ConfirmDel>(null)
  const [showPriceList, setShowPriceList] = useState(false)

  // Club Alenort Admin states
  const [clubOrders, setClubOrders]       = useState<any[]>([])
  const [clubUsers, setClubUsers]         = useState<any[]>([])
  const [loadingClub, setLoadingClub]     = useState(false)
  const [searchMember, setSearchMember]   = useState('')
  const [editingMemberPoints, setEditingMemberPoints] = useState<any>(null)
  const [newPointsInput, setNewPointsInput] = useState('')

  // Categorías states
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [presetParentName, setPresetParentName] = useState('')
  const [confirmDelCategory, setConfirmDelCategory] = useState<{ id: number | string; name: string } | null>(null)

  const { products, categories, loading, submitting, addProduct, updateProduct, updateStock, bulkUpdatePrices, deleteProduct, updateCategory, addCategory, deleteCategory, seedFkusCategories } = useProducts()
  const { 
    selectedCategory, 
    setSelectedCategory, 
    searchTerm, 
    setSearchTerm, 
    sortField, 
    sortDirection, 
    toggleSort, 
    filteredProducts 
  } = useProductFilters(products)

  // Selección múltiple y modal de ajuste masivo
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false)

  const handleToggleSelect = (id: number) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAll = () => {
    const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.includes(p.id))
    if (allFilteredSelected) {
      const filteredIds = filteredProducts.map(p => p.id)
      setSelectedProductIds(prev => prev.filter(id => !filteredIds.includes(id)))
    } else {
      const filteredIds = filteredProducts.map(p => p.id)
      setSelectedProductIds(prev => {
        const next = [...prev]
        filteredIds.forEach(id => {
          if (!next.includes(id)) next.push(id)
        })
        return next
      })
    }
  }

  // Desmarcar selecciones cuando cambian los filtros principales
  useEffect(() => {
    setSelectedProductIds([])
  }, [selectedCategory, searchTerm])

  const handleUpdateStock = async (id: number, quantity: number) => {
    const res = await updateStock(id, quantity)
    if (res.success) notify('Stock del producto actualizado', 'success')
    else notify(`Error: ${res.error}`, 'error')
  }

  const handleUpdatePriceInline = async (id: number, price: string) => {
    const product = products.find(p => p.id === id)
    if (!product) return { success: false, error: 'Producto no encontrado' }
    const payload = {
      name: product.name,
      price: price !== '' ? price : null,
      unit: product.unit || undefined,
      category_id: String(product.category_id),
      marca: product.marca || undefined,
      stock_quantity: product.stock_quantity
    }
    const res = await updateProduct(id, payload)
    if (res.success) notify('Precio actualizado', 'success')
    else notify(`Error: ${res.error}`, 'error')
    return res
  }

  const handleApplyBulkPriceUpdate = async (params: {
    percentage: number
    roundingRule: string
    scope: 'all' | 'category' | 'brand' | 'selection'
    targetValue: string
  }) => {
    let targetIds: number[] = []
    if (params.scope === 'selection') {
      targetIds = selectedProductIds
    } else if (params.scope === 'all') {
      targetIds = products.map(p => p.id)
    } else if (params.scope === 'category') {
      targetIds = products
        .filter(p => String(p.category_id) === String(params.targetValue))
        .map(p => p.id)
    } else if (params.scope === 'brand') {
      targetIds = products
        .filter(p => p.marca === params.targetValue)
        .map(p => p.id)
    }

    if (targetIds.length === 0) {
      return { success: false, error: 'No hay productos que coincidan con la selección.' }
    }

    const res = await bulkUpdatePrices(targetIds, params.percentage, params.roundingRule)
    if (res.success) {
      setSelectedProductIds([])
    }
    return { success: res.success, count: res.updatedCount, error: res.error }
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const notify = (message: string, type: 'success' | 'error') => setToast({ message, type })

  // Cargar Pedidos y Socios del Club
  const loadClubData = async () => {
    setLoadingClub(true)
    try {
      const [{ data: orders, error: ordersErr }, { data: users, error: usersErr }] = await Promise.all([
        supabase
          .from('club_orders')
          .select('*, club_users(nombre, apellido, club_code, celular)')
          .order('created_at', { ascending: false }),
        supabase
          .from('club_users')
          .select('*')
          .order('points', { ascending: false })
      ])

      if (ordersErr) throw ordersErr
      if (usersErr) throw usersErr

      if (orders) setClubOrders(orders)
      if (users) setClubUsers(users)
    } catch (err) {
      console.error('Error cargando datos del Club:', err)
      notify('Error al cargar datos del club de fidelización', 'error')
    } finally {
      setLoadingClub(false)
    }
  }

  // Confirmar Pedido de Club y Sumar Puntos
  const handleConfirmOrder = async (order: any) => {
    try {
      // 1. Calcular puntos a sumar (1 punto cada $10.000 de compra)
      const pointsToAdd = Math.floor(parseFloat(order.total) / 10000)

      // 2. Sumar puntos al usuario si no fueron ya sumados
      if (pointsToAdd > 0 && !order.points_awarded) {
        // Traer puntos actuales
        const { data: userProfile } = await supabase
          .from('club_users')
          .select('points')
          .eq('dni', order.user_dni)
          .maybeSingle()

        if (userProfile) {
          const currentPoints = userProfile.points || 0
          const updatedPoints = currentPoints + pointsToAdd
          
          const { error: userErr } = await supabase
            .from('club_users')
            .update({ points: updatedPoints })
            .eq('dni', order.user_dni)
          
          if (userErr) throw userErr
        }
      }

      // 3. Confirmar pedido y marcar puntos sumados
      const { error: orderErr } = await supabase
        .from('club_orders')
        .update({ status: 'Confirmado', points_awarded: true })
        .eq('id', order.id)

      if (orderErr) throw orderErr

      notify(`Pedido confirmado. Se sumaron ${pointsToAdd} puntos al cliente.`, 'success')
      await loadClubData()
    } catch (err: any) {
      console.error(err)
      notify(`Error al confirmar pedido: ${err.message || 'Error'}`, 'error')
    }
  }

  // Cancelar Pedido de Club
  const handleCancelOrder = async (orderId: number | string) => {
    try {
      const { error } = await supabase
        .from('club_orders')
        .update({ status: 'Cancelado' })
        .eq('id', orderId)

      if (error) throw error
      notify('Pedido cancelado en el sistema', 'success')
      await loadClubData()
    } catch (err: any) {
      console.error(err)
      notify(`Error al cancelar pedido: ${err.message || 'Error'}`, 'error')
    }
  }

  // Modificar puntos manualmente
  const handleSavePoints = async () => {
    if (!editingMemberPoints) return
    const pts = parseInt(newPointsInput)
    if (isNaN(pts)) {
      notify('Por favor, ingresá un número de puntos válido', 'error')
      return
    }

    try {
      const { error } = await supabase
        .from('club_users')
        .update({ points: pts })
        .eq('dni', editingMemberPoints.dni)

      if (error) throw error
      notify('Puntos actualizados correctamente', 'success')
      setEditingMemberPoints(null)
      await loadClubData()
    } catch (err: any) {
      console.error(err)
      notify(`Error al actualizar puntos: ${err.message || 'Error'}`, 'error')
    }
  }

  const handleShowAdd = () => {
    setShowAddForm(true)
    setEditingProduct(null)
    setEditFormData({ ...emptyForm })
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product.id)
    setEditFormData({
      name: product.name || '',
      price: product.price ?? '',
      compare_at_price: product.compare_at_price ?? '',
      sizes: product.sizes || '',
      colors: product.colors || '',
      unit: product.unit || '',
      category_id: product.category_id ? String(product.category_id) : '',
      marca: product.marca || '',
      stock_quantity: product.stock_quantity ?? 0,
      image_urls: product.image_urls || [],
    })
    setShowAddForm(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCategorySubmit = async (formData: any) => {
    if (editingCategory) {
      const res = await updateCategory(editingCategory.id, formData)
      if (res.success) { notify('Categoría actualizada', 'success'); setShowCategoryModal(false) }
      else notify(`Error: ${res.error}`, 'error')
    } else {
      const res = await addCategory(formData)
      if (res.success) { notify('Categoría creada', 'success'); setShowCategoryModal(false) }
      else notify(`Error: ${res.error}`, 'error')
    }
  }

  const handleDeleteCategoryConfirm = async () => {
    if (!confirmDelCategory) return
    const res = await deleteCategory(confirmDelCategory.id)
    setConfirmDelCategory(null)
    if (res.success) notify('Categoría eliminada', 'success')
    else notify(`Error: ${res.error}`, 'error')
  }

  const handleSubmit = async (formData: any) => {
    if (editingProduct) {
      const r = await updateProduct(editingProduct, formData)
      if (r.success) { notify('Producto actualizado correctamente', 'success'); handleCancel() }
      else notify(`Error: ${r.error}`, 'error')
      return r
    } else {
      const r = await addProduct(formData)
      if (r.success) { notify('Producto agregado correctamente', 'success'); handleCancel() }
      else notify(`Error: ${r.error}`, 'error')
      return r
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingProduct(null)
    setEditFormData({ ...emptyForm })
  }

  const handleDeleteRequest = (product: any) => setConfirmDel({ id: product.id, name: product.name })

  const handleDeleteConfirm = async () => {
    if (!confirmDel) return
    const r = await deleteProduct(confirmDel.id)
    setConfirmDel(null)
    if (r.success) notify('Producto eliminado', 'success')
    else notify('Error al eliminar el producto', 'error')
  }

  // Filtrado de miembros del club
  const filteredUsers = clubUsers.filter(u => 
    u.dni.includes(searchMember) || 
    u.nombre.toLowerCase().includes(searchMember.toLowerCase()) ||
    u.apellido.toLowerCase().includes(searchMember.toLowerCase()) ||
    u.club_code.includes(searchMember)
  )

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Toast ── */}
      <div className={`fixed top-5 right-5 z-50 transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-semibold min-w-[240px] ${
          toast?.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          <span className="text-base">{toast?.type === 'success' ? '✓' : '✕'}</span>
          {toast?.message}
        </div>
      </div>

      {/* ── Modal confirmar eliminación ── */}
      {confirmDel && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full animate-in zoom-in-95 duration-150">
            <div className="text-4xl mb-4 text-center">🗑️</div>
            <h3 className="font-extrabold text-gray-900 text-lg mb-2 text-center">¿Eliminar producto?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Vas a eliminar <strong className="text-gray-800">"{confirmDel.name}"</strong>.<br />Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDel(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminación categoría ── */}
      {confirmDelCategory && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full animate-in zoom-in-95 duration-150">
            <div className="text-4xl mb-4 text-center">🗑️</div>
            <h3 className="font-extrabold text-gray-900 text-lg mb-2 text-center">¿Eliminar categoría?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Vas a eliminar <strong className="text-gray-800">"{confirmDelCategory.name}"</strong>.<br />
              <span className="text-red-500 font-bold block mt-2">¡Atención! Se eliminarán de forma permanente todos los productos asociados a esta categoría.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelCategory(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCategoryConfirm}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submitting ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Ajustar Puntos de Socio ── */}
      {editingMemberPoints && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-150">
            <div className="text-3xl mb-3 text-center">⭐</div>
            <h3 className="font-extrabold text-gray-900 text-base mb-2 text-center">Ajustar Puntos</h3>
            <p className="text-xs text-gray-500 text-center mb-4">
              Modificando puntos de <strong className="text-gray-800">{editingMemberPoints.nombre} {editingMemberPoints.apellido}</strong> (Socio #{editingMemberPoints.club_code})
            </p>
            
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Puntos Totales</label>
              <input
                type="number"
                value={newPointsInput}
                onChange={e => setNewPointsInput(e.target.value)}
                placeholder="Puntos actuales"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingMemberPoints(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePoints}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-sm transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── NAVEGACIÓN POR PESTAÑAS ── */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row border border-slate-200 bg-white p-2 rounded-2xl shadow-xs gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            📦 Productos
          </button>
          <button
            onClick={() => { setActiveTab('orders'); loadClubData() }}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            📋 Pedidos Club
            {clubOrders.filter(o => o.status === 'Pendiente').length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-xs animate-pulse">
                {clubOrders.filter(o => o.status === 'Pendiente').length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('members'); loadClubData() }}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            👥 Miembros Club
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'categories'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            🖼️ Categorías
          </button>
        </div>

        {/* ── CONTENIDO: PRODUCTOS (VISTA ORIGINAL) ── */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <AdminStats
              products={products}
              categories={categories}
              filteredProducts={filteredProducts}
            />

            {/* Formulario */}
            <ProductForm
              isVisible={showAddForm || !!editingProduct}
              isEditing={!!editingProduct}
              categories={categories}
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              initialData={editFormData}
              onOpenCategoryModal={() => { setEditingCategory(null); setPresetParentName(''); setShowCategoryModal(true) }}
            />

            {/* Barra de herramientas */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <ProductFilters
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  categories={categories}
                />
              </div>
              <button
                onClick={() => setShowBulkPriceModal(true)}
                className="shrink-0 flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
              >
                <Percent className="w-4 h-4 text-slate-500" />
                Ajuste Masivo
              </button>
              <button
                onClick={() => setShowPriceList(true)}
                className="shrink-0 flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Lista de Precios
              </button>
              <button
                onClick={handleShowAdd}
                disabled={submitting}
                className="shrink-0 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xs transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Producto
              </button>
            </div>

            <ProductsTable
              products={filteredProducts}
              selectedIds={selectedProductIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              sortField={sortField}
              sortDirection={sortDirection}
              onToggleSort={toggleSort}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onUpdateStock={handleUpdateStock}
              onUpdatePriceInline={handleUpdatePriceInline}
              submitting={submitting}
              editingId={editingProduct}
            />
          </div>
        )}

        {/* ── CONTENIDO: PEDIDOS DEL CLUB ── */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Pedidos Club FKUS</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Confirma las compras de WhatsApp aquí para asignar los puntos correspondientes a los socios.
                </p>
              </div>
              <button 
                onClick={loadClubData} 
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                title="Actualizar datos"
              >
                {loadingClub ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : '🔄'}
              </button>
            </div>

            {loadingClub ? (
              <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                <p className="text-xs font-semibold">Cargando pedidos del club...</p>
              </div>
            ) : clubOrders.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <p className="text-sm">No hay pedidos registrados en el Club FKUS.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">ID Pedido</th>
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4">Cliente / Socio</th>
                      <th className="px-6 py-4">Celular</th>
                      <th className="px-6 py-4">Dirección de Entrega</th>
                      <th className="px-6 py-4">Detalle del Pedido</th>
                      <th className="px-6 py-4 text-right">Total</th>
                      <th className="px-6 py-4 text-center">Puntos a Sumar</th>
                      <th className="px-6 py-4 text-center">Estado</th>
                      <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {clubOrders.map((order) => {
                      const points = Math.floor(parseFloat(order.total) / 10000)
                      const dateStr = new Date(order.created_at).toLocaleString('es-AR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                      })
                      const itemsDetail = order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ') || '—'

                      return (
                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-gray-700">#{order.id}</td>
                          <td className="px-6 py-4 text-xs font-medium text-gray-500">{dateStr}</td>
                          <td className="px-6 py-4">
                            {order.club_users ? (
                              <div>
                                <p className="font-bold text-gray-800">
                                  {order.club_users.nombre} {order.club_users.apellido}
                                </p>
                                <p className="text-[10px] text-amber-600 font-extrabold font-mono leading-none mt-1">
                                  #{order.club_users.club_code}
                                </p>
                              </div>
                            ) : order.customer_name ? (
                              <div>
                                <p className="font-bold text-gray-800">
                                  {order.customer_name}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mt-1">
                                  👤 Cliente Invitado
                                </p>
                              </div>
                            ) : (
                              <span className="text-red-500 text-xs">Socio Eliminado ({order.user_dni})</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-gray-600">
                            {order.club_users?.celular || order.customer_phone || '—'}
                          </td>
                          <td className="px-6 py-4 max-w-[200px] truncate text-xs text-gray-500 font-semibold" title={order.customer_address || 'Sin registrar'}>
                            {order.customer_address ? (
                              <div className="flex items-center gap-1.5">
                                <span>📍</span>
                                <span className="truncate">{order.customer_address}</span>
                                {order.customer_lat && order.customer_lng && (
                                  <a
                                    href={`https://www.google.com/maps?q=${order.customer_lat},${order.customer_lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-amber-500 hover:text-amber-700 font-bold hover:scale-110 transition-transform ml-0.5"
                                    title="Ver mapa GPS"
                                  >
                                    🗺️
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-300 italic">No registrada</span>
                            )}
                          </td>
                          <td className="px-6 py-4 max-w-[200px] truncate text-xs text-gray-500 font-semibold" title={itemsDetail}>
                            {itemsDetail}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-gray-900">
                            $ {parseFloat(order.total).toLocaleString('es-AR')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-black px-2.5 py-1 rounded-lg">
                              ⭐ +{points}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                              order.status === 'Confirmado' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : order.status === 'Cancelado'
                                ? 'bg-red-50 text-red-700 border border-red-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {order.status === 'Pendiente' ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleConfirmOrder(order)}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5" /> Confirmar
                                </button>
                                <button
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-500 text-gray-600 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5" /> Cancelar
                                </button>
                              </div>
                            ) : (
                              <p className="text-center text-xs text-gray-400 font-bold italic">
                                {order.points_awarded ? 'Puntos Sumados ✓' : 'Procesado'}
                              </p>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── CONTENIDO: MIEMBROS DEL CLUB ── */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            {/* Buscador de socios */}
            <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={searchMember}
                  onChange={e => setSearchMember(e.target.value)}
                  placeholder="Buscar socios por nombre, DNI o código..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Search className="h-4 w-4" />
                </div>
              </div>
              <button 
                onClick={loadClubData} 
                className="shrink-0 p-2.5 bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                title="Actualizar datos"
              >
                {loadingClub ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : '🔄 Actualizar'}
              </button>
            </div>

            {/* Tabla de socios */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-extrabold text-gray-900 text-base">Socios Club FKUS</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Listado de clientes registrados en el club con su código único de membresía y puntaje.
                </p>
              </div>

              {loadingClub ? (
                <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                  <p className="text-xs font-semibold">Cargando socios del club...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-16 text-center text-gray-400">
                  <p className="text-sm">No se encontraron socios que coincidan con la búsqueda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4">Código</th>
                        <th className="px-6 py-4">Nombre y Apellido</th>
                        <th className="px-6 py-4">DNI</th>
                        <th className="px-6 py-4">Celular</th>
                        <th className="px-6 py-4">Email (Gmail)</th>
                        <th className="px-6 py-4">Dirección Predeterminada</th>
                        <th className="px-6 py-4 text-center">Puntos Totales</th>
                        <th className="px-6 py-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredUsers.map((user) => (
                        <tr key={user.dni} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="bg-amber-100 text-amber-800 font-black text-xs px-2.5 py-1 rounded-lg font-mono">
                              #{user.club_code}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-800">
                            {user.nombre} {user.apellido}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-600">{user.dni}</td>
                          <td className="px-6 py-4 text-xs font-medium text-gray-600">{user.celular}</td>
                          <td className="px-6 py-4 text-xs text-gray-500 font-semibold">{user.gmail}</td>
                          <td className="px-6 py-4 text-xs text-gray-500 font-semibold">
                            {user.direccion ? (
                              <div className="flex items-center gap-1">
                                <span className="text-emerald-600">📍</span>
                                <span className="max-w-[150px] truncate" title={user.direccion}>
                                  {user.direccion}
                                </span>
                                {user.lat && user.lng && (
                                  <a 
                                    href={`https://www.google.com/maps?q=${user.lat},${user.lng}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-amber-500 hover:text-amber-700 transition-colors"
                                    title="Ver coordenadas GPS"
                                  >
                                    <ArrowUpRight className="h-3.5 w-3.5 stroke-[3]" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-300 italic">No registrada</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-lg shadow-sm">
                              🏆 {user.points} pts
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setEditingMemberPoints(user)
                                setNewPointsInput(String(user.points))
                              }}
                              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" /> Ajustar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CONTENIDO: CATEGORÍAS ── */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Gestión de Categorías y Subcategorías</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Crea, edita y administra los rubros principales y subcategorías de tu catálogo FKUS.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={async () => {
                    const res = await seedFkusCategories()
                    if (res.success) notify(res.message, 'success')
                    else notify(res.error, 'error')
                  }}
                  disabled={submitting}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  title="Genera automáticamente los rubros por defecto de FKUS (Remeras, Pantalones, Cargos, etc.)"
                >
                  ⚡ Cargar Rubros FKUS
                </button>
                <button
                  onClick={() => { setEditingCategory(null); setPresetParentName(''); setShowCategoryModal(true) }}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Categoría
                </button>
              </div>
            </div>

            <div className="p-6">
              {(() => {
                const mainParents = categories.filter((c: any) => !c.name.includes(' - '))
                const subsByParent: Record<string, any[]> = {}
                categories.forEach((c: any) => {
                  if (c.name.includes(' - ')) {
                    const pName = c.name.split(' - ')[0].trim()
                    if (!subsByParent[pName]) subsByParent[pName] = []
                    subsByParent[pName].push(c)
                  }
                })

                const orphanSubCategories = categories.filter((c: any) => 
                  c.name.includes(' - ') && !mainParents.some(p => p.name.toLowerCase().trim() === c.name.split(' - ')[0].toLowerCase().trim())
                )

                return (
                  <div className="space-y-6 select-none">
                    {mainParents.length === 0 && categories.length === 0 && (
                      <div className="text-center py-12 text-slate-500 font-semibold text-sm bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8">
                        <p className="mb-3">No hay categorías ni subcategorías creadas todavía.</p>
                        <button
                          onClick={async () => {
                            const res = await seedFkusCategories()
                            if (res.success) notify(res.message, 'success')
                            else notify(res.error, 'error')
                          }}
                          disabled={submitting}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
                        >
                          ⚡ Cargar Rubros FKUS Automáticamente
                        </button>
                      </div>
                    )}

                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                      {mainParents.map((parent) => {
                        const subs = subsByParent[parent.name] || []
                        return (
                          <div key={parent.id} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:bg-white transition-all flex flex-col justify-between shadow-2xs">
                            <div>
                              {/* Header of main category */}
                              <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative w-12 h-12 bg-white border border-slate-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                                    {parent.image_url ? (
                                      <img src={parent.image_url} alt={parent.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-lg">📁</span>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-black text-slate-900 text-base uppercase tracking-wider">
                                      {parent.name}
                                    </h4>
                                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                                      {subs.length} subcategoría{subs.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => { setEditingCategory(parent); setPresetParentName(''); setShowCategoryModal(true) }}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Editar categoría principal"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelCategory({ id: parent.id, name: parent.name })}
                                    className="p-2 rounded-xl border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Eliminar categoría principal"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Subcategories pill list */}
                              <div className="mt-4 pt-3 border-t border-slate-200">
                                <div className="flex items-center justify-between mb-2.5">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Subcategorías
                                  </span>
                                  <button
                                    onClick={() => { setEditingCategory(null); setPresetParentName(parent.name); setShowCategoryModal(true) }}
                                    className="text-[10px] font-black text-slate-900 hover:text-slate-600 uppercase tracking-wider cursor-pointer underline"
                                  >
                                    + Agregar Subcategoría
                                  </button>
                                </div>

                                {subs.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {subs.map(sub => {
                                      const subTitle = sub.name.split(' - ')[1] || sub.name
                                      return (
                                        <div key={sub.id} className="group flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
                                          <span className="font-bold text-slate-900">{subTitle}</span>
                                          <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5">
                                            <button
                                              onClick={() => { setEditingCategory(sub); setPresetParentName(parent.name); setShowCategoryModal(true) }}
                                              className="text-slate-400 hover:text-slate-800 cursor-pointer"
                                              title="Editar subcategoría"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => setConfirmDelCategory({ id: sub.id, name: sub.name })}
                                              className="text-slate-400 hover:text-red-600 cursor-pointer"
                                              title="Eliminar subcategoría"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400 font-semibold italic">
                                    No hay subcategorías cargadas aún para {parent.name}.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Orphan subcategories if any */}
                    {orphanSubCategories.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-slate-200">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Otras Subcategorías</h4>
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          {orphanSubCategories.map(sub => (
                            <div key={sub.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                              <span className="text-xs font-bold text-slate-900">{sub.name}</span>
                              <div className="flex items-center gap-1">
                                <button onClick={() => { setEditingCategory(sub); setPresetParentName(''); setShowCategoryModal(true) }} className="p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setConfirmDelCategory({ id: sub.id, name: sub.name })} className="p-1.5 text-slate-500 hover:text-red-600 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </main>

      {showPriceList && (
        <PriceListModal
          products={products}
          onClose={() => setShowPriceList(false)}
        />
      )}

      <BulkPriceUpdateModal
        isOpen={showBulkPriceModal}
        onClose={() => setShowBulkPriceModal(false)}
        products={products}
        categories={categories}
        selectedIds={selectedProductIds}
        onApply={handleApplyBulkPriceUpdate}
      />

      {/* Floating Action Bar for multi-select */}
      {selectedProductIds.length > 0 && activeTab === 'products' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-xl bg-gray-900/90 text-white px-6 py-4 rounded-3xl backdrop-blur-md shadow-2xl border border-gray-800 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white">
              {selectedProductIds.length}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-gray-250">
              Seleccionado{selectedProductIds.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkPriceModal(true)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow active:scale-95 cursor-pointer"
            >
              <Percent className="w-3.5 h-3.5" />
              Editar Precios
            </button>
            <button
              onClick={() => setSelectedProductIds([])}
              className="bg-transparent hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setEditingCategory(null); setPresetParentName('') }}
        category={editingCategory}
        onSubmit={handleCategorySubmit}
        submitting={submitting}
        categories={categories}
        presetParentName={presetParentName}
      />
    </div>
  )
}
