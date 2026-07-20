import { Search } from 'lucide-react'

export default function ProductFilters({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, categories }) {
  return (
    <div className="flex gap-3">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar productos…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 shadow-xs transition-all font-medium"
        />
      </div>
      <select
        value={selectedCategory}
        onChange={e => setSelectedCategory(e.target.value)}
        className="shrink-0 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all min-w-[150px] sm:min-w-[180px] cursor-pointer shadow-xs"
      >
        <option value="all" className="bg-white text-slate-900">Todas las categorías</option>
        {(() => {
          const mainParents = categories.filter((c) => !c.name.includes(' - '))
          const subsByParent = {}
          categories.forEach(c => {
            if (c.name.includes(' - ')) {
              const pName = c.name.split(' - ')[0].trim()
              if (!subsByParent[pName]) subsByParent[pName] = []
              subsByParent[pName].push(c)
            }
          })
          return mainParents.map(parent => {
            const subs = subsByParent[parent.name] || []
            if (subs.length > 0) {
              return (
                <optgroup key={parent.id} label={parent.name.toUpperCase()} className="bg-white font-bold text-slate-900">
                  <option value={parent.id.toString()} className="bg-white text-slate-900 font-semibold">
                    {parent.name} (Todo)
                  </option>
                  {subs.map(sub => (
                    <option key={sub.id} value={sub.id.toString()} className="bg-white text-slate-700 font-normal">
                      ↳ {sub.name.split(' - ')[1]}
                    </option>
                  ))}
                </optgroup>
              )
            }
            return (
              <option key={parent.id} value={parent.id.toString()} className="bg-white text-slate-900">
                {parent.name}
              </option>
            )
          })
        })()}
      </select>
    </div>
  )
}
