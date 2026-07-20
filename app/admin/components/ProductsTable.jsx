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
        className={`px-3 sm:px-5 py-3 text-xs font-black text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-200/60 transition-colors select-none ${alignment}`}
      >
        <span className="inline-flex items-center">
          {label}
          {isSorted ? (
            sortDirection === 'asc' 
              ? <ArrowUp className="ml-1 h-3.5 w-3.5 text-slate-800 shrink-0" />
              : <ArrowDown className="ml-1 h-3.5 w-3.5 text-slate-800 shrink-0" />
          ) : (
            <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40 text-slate-400 shrink-0" />
          )}
        </span>
      </th>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
        <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">
          Catálogo de Productos
        </h3>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <span className="text-[10px] font-black bg-slate-900 text-white border border-slate-800 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
              {selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">
            {products.length} resultado{products.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-slate-600 font-bold text-sm">No se encontraron productos</p>
          <p className="text-slate-400 text-xs mt-1 font-medium">Probá con otro filtro o buscador</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 select-none">
                {/* Checkbox column */}
                <th className="px-5 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = partialSelected
                    }}
                    onChange={onToggleSelectAll}
                    className="w-4.5 h-4.5 rounded border-slate-300 bg-white text-slate-900 focus:ring-slate-400 cursor-pointer accent-slate-900"
                  />
                </th>
                {renderSortHeader('name', 'Producto')}
                {renderSortHeader('category', 'Categoría', 'text-left hidden sm:table-cell')}
                {renderSortHeader('marca', 'Marca', 'text-left hidden md:table-cell')}
                {renderSortHeader('in_stock', 'Stock', 'text-center w-28')}
                {renderSortHeader('price', 'Precio', 'text-right pr-8')}
                <th className="px-5 py-3 text-xs font-black text-slate-600 uppercase tracking-wider text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {products.map(product => {
                const isEditing = editingId === product.id
                const isSelected = selectedIds.includes(product.id)
                const isInlineEditingPrice = editingPriceId === product.id

                return (
                  <tr
                    key={product.id}
                    className={`transition-colors ${
                      isEditing ? 'bg-amber-50/60' : isSelected ? 'bg-slate-100/70' : 'hover:bg-slate-50/90'
                    }`}
                  >
                    {/* Row checkbox */}
                    <td className="px-3 sm:px-5 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(product.id)}
                        className="w-4.5 h-4.5 rounded border-slate-300 bg-white text-slate-900 focus:ring-slate-400 cursor-pointer accent-slate-900"
                      />
                    </td>

                    {/* Producto */}
                    <td className="px-3 sm:px-5 py-3">
                      <div className="flex items-center gap-3">
                        {isEditing && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-amber-500" />
                        )}
                        {/* Thumbnail */}
                        <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-bold ${isEditing ? 'text-slate-900 font-black' : 'text-slate-900'} whitespace-normal max-w-xs sm:max-w-md`}>
                            {product.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {product.unit && (
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border whitespace-nowrap ${
                                product.unit === 'Hombre'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : product.unit === 'Mujer'
                                  ? 'bg-pink-50 text-pink-700 border-pink-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                👥 {product.unit}
                              </span>
                            )}
                            {product.sizes && (
                              <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200" title="Talles disponibles">
                                📏 {product.sizes}
                              </span>
                            )}
                            {product.colors && (
                              <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200" title="Colores disponibles">
                                🎨 {product.colors}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-3 sm:px-5 py-3 hidden sm:table-cell">
                      {product.category_name?.includes(' - ') ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap shadow-2xs">
                          <span className="text-slate-500 font-bold">{product.category_name.split(' - ')[0]}</span>
                          <span className="text-slate-400 font-bold">➔</span>
                          <span className="text-slate-900 font-black">{product.category_name.split(' - ')[1]}</span>
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                          {product.category_name || 'Sin categoría'}
                        </span>
                      )}
                    </td>

                    {/* Marca */}
                    <td className="px-3 sm:px-5 py-3 hidden md:table-cell">
                      {product.marca ? (
                        <span className="inline-block text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                          {product.marca}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-semibold">—</span>
                      )}
                    </td>

                    {/* Stock status toggle button */}
                    <td className="px-3 sm:px-5 py-3 text-center">
                      <button
                        onClick={() => onToggleStock(product.id, product.in_stock)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer select-none ${
                          product.in_stock
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:scale-95'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 active:scale-95'
                        }`}
                        title="Hacé clic para cambiar el stock"
                      >
                        <span className={`w-2 h-2 rounded-full ${product.in_stock ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {product.in_stock ? 'Con Stock' : 'Sin Stock'}
                      </button>
                    </td>

                    {/* Precio (con edición rápida inline) */}
                    <td className="px-3 sm:px-5 py-3 text-right pr-8">
                      {isInlineEditingPrice ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-400 font-bold text-xs">$</span>
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
                            className="w-24 px-2 py-1 border border-slate-300 rounded-lg text-right font-black text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePrice(product.id)}
                            disabled={savingPrice}
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            disabled={savingPrice}
                            className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <div 
                            onClick={() => handleStartEditPrice(product)}
                            className="group inline-flex items-center justify-end gap-1.5 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors text-right"
                            title="Hacé clic para editar el precio rápido"
                          >
                            <span className="font-black text-slate-900 whitespace-nowrap text-sm sm:text-base">
                              {fmt(product.price)}
                            </span>
                            <Pencil className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-800" />
                          </div>
                          {product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price || '0') && (
                            <span className="text-[10px] text-slate-400 line-through pr-1.5 font-semibold">
                              {fmt(product.compare_at_price)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-3 sm:px-5 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEdit(product)}
                          disabled={submitting}
                          title="Editar producto completo"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(product)}
                          disabled={submitting}
                          title="Eliminar producto"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 transition-colors cursor-pointer"
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
