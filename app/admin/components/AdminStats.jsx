export default function AdminStats({ products, categories, filteredProducts }) {
  const stats = [
    { label: 'Total productos', value: products.length,         icon: '📦', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Categorías',      value: categories.length,       icon: '🗂️', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { label: 'Filtrados',       value: filteredProducts.length, icon: '🔍', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {stats.map(s => (
        <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${s.color}`}>
            {s.icon}
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">{s.value}</p>
            <p className="text-xs text-slate-500 font-extrabold uppercase tracking-widest mt-1.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
