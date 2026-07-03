import { useState } from 'react'
import { Edit2, Trash2, Package, ArrowUp, ArrowDown, ArrowUpDown, Check, X, Pencil } from 'lucide-react'

const fmt = (price) => {
  if (price === null || price === undefined || price === '') return '—'
  const n = parseFloat(price)
  if (isNaN(n)) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}

export default function ProductsTable({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sortField,
  sortDirection,
  onToggleSort,
  onEdit,
  onDelete,
  onToggleStock,
  onUpdatePriceInline,
  submitting,
  editingId
}) {
  const [editingPriceId, setEditingPriceId] = useState(null)
  const [tempPrice, setTempPrice] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)

  const allSelected = products.length > 0 && products.every(p => selectedIds.includes(p.id))
  const partialSelected = products.length > 0 && !allSelected && products.some(p => selectedIds.includes(p.id))

  const handleStartEditPrice = (product) => {
    setEditingPriceId(product.id)
    setTempPrice(product.price || '')
  }

  const handleSavePrice = async (id) => {
    setSavingPrice(true)
    try {
      await onUpdatePriceInline(id, tempPrice)
      setEditingPriceId(null)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingPrice(false)
    }
  }

  const renderSortHeader = (field, label, alignment = 'text-left') => {
    const isSorted = sortField === field
    return (
      <th 
        onClick={() => onToggleSort(field)}
        className={`px-3 sm:px-5 py-2.5 sm:py-3 text-xs font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition-colors select-none ${alignment}`}
      >
        <span className="inline-flex items-center">
          {label}
          {isSorted ? (
            sortDirection === 'asc' 
              ? <ArrowUp className="ml-1 h-3.5 w-3.5 text-amber-500 shrink-0" />
              : <ArrowDown className="ml-1 h-3.5 w-3.5 text-amber-500 shrink-0" />
          ) : (
            <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-30 text-gray-400 shrink-0" />
          )}
        </span>
      </th>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <h3 className="font-extrabold text-gray-900 text-base">
          Productos
        </h3>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <span className="text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full animate-pulse">
              {selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
            {products.length} resultado{products.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-semibold text-sm">No se encontraron productos</p>
          <p className="text-gray-400 text-xs mt-1">Probá con otro filtro o buscador</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 select-none">
                {/* Checkbox column */}
                <th className="px-5 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = partialSelected
                    }}
                    onChange={onToggleSelectAll}
                    className="w-4.5 h-4.5 rounded border-gray-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                </th>
                {renderSortHeader('name', 'Producto')}
                {renderSortHeader('category', 'Categoría', 'text-left hidden sm:table-cell')}
                {renderSortHeader('marca', 'Marca', 'text-left hidden md:table-cell')}
                {renderSortHeader('in_stock', 'Stock', 'text-center w-28')}
                {renderSortHeader('price', 'Precio', 'text-right pr-8')}
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => {
                const isEditing = editingId === product.id
                const isSelected = selectedIds.includes(product.id)
                const isInlineEditingPrice = editingPriceId === product.id

                return (
                  <tr
                    key={product.id}
                    className={`transition-colors ${
                      isEditing ? 'bg-amber-50/70' : isSelected ? 'bg-amber-50/30' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Row checkbox */}
                    <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(product.id)}
                        className="w-4.5 h-4.5 rounded border-gray-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                      />
                    </td>

                    {/* Producto */}
                    <td className="px-3 sm:px-5 py-2.5 sm:py-3.5">
                      <div className="flex items-center gap-2.5">
                        {isEditing && (
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500" />
                        )}
                        {/* Thumbnail */}
                        <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-semibold ${isEditing ? 'text-amber-800' : 'text-gray-800'} whitespace-normal max-w-xs sm:max-w-md`}>
                            {product.name}
                          </span>
                          {product.unit && (
                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap mt-0.5">({product.unit})</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 hidden sm:table-cell">
                      <span className="inline-block text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        {product.category_name || 'Sin categoría'}
                      </span>
                    </td>

                    {/* Marca */}
                    <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 hidden md:table-cell">
                      {product.marca ? (
                        <span className="inline-block text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-0.5 rounded-full">
                          {product.marca}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Stock status toggle button */}
                    <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-center">
                      <button
                        onClick={() => onToggleStock(product.id, product.in_stock)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer select-none ${
                          product.in_stock
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/80 active:scale-95'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100/80 active:scale-95'
                        }`}
                        title="Hacé clic para cambiar el stock"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${product.in_stock ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {product.in_stock ? 'Con Stock' : 'Sin Stock'}
                      </button>
                    </td>

                    {/* Precio (con edición rápida inline) */}
                    <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-right pr-8">
                      {isInlineEditingPrice ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-gray-400 font-bold text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={tempPrice}
                            disabled={savingPrice}
                            onChange={e => setTempPrice(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSavePrice(product.id)
                              if (e.key === 'Escape') setEditingPriceId(null)
                            }}
                            className="w-24 px-2 py-1 border border-amber-400 rounded-lg text-right font-extrabold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePrice(product.id)}
                            disabled={savingPrice}
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            disabled={savingPrice}
                            className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 transition-colors cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => handleStartEditPrice(product)}
                          className="group inline-flex items-center justify-end gap-1.5 cursor-pointer hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors text-right"
                          title="Hacé doble clic o clic para editar el precio rápido"
                        >
                          <span className="font-bold text-emerald-700 whitespace-nowrap text-sm sm:text-base">
                            {fmt(product.price)}
                          </span>
                          <Pencil className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:text-amber-500" />
                        </div>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-3 sm:px-5 py-2.5 sm:py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEdit(product)}
                          disabled={submitting}
                          title="Editar producto completo"
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(product)}
                          disabled={submitting}
                          title="Eliminar producto"
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
