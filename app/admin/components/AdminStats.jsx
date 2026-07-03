export default function AdminStats({ products, categories, filteredProducts }) {
  const stats = [
    { label: 'Total productos', value: products.length,         icon: '📦', ring: 'border-blue-100   bg-blue-50'   },
    { label: 'Categorías',      value: categories.length,       icon: '🗂️', ring: 'border-purple-100 bg-purple-50' },
    { label: 'Filtrados',       value: filteredProducts.length, icon: '🔍', ring: 'border-amber-100  bg-amber-50'  },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {stats.map(s => (
        <div key={s.label} className={`bg-white border rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm ${s.ring}`}>
          <span className="text-2xl sm:text-3xl shrink-0">{s.icon}</span>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none">{s.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
