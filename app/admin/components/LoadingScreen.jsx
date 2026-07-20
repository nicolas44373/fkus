import { Loader2 } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-lg p-8 border border-slate-200 text-center max-w-xs w-full animate-in zoom-in-95">
        <Loader2 className="h-10 w-10 text-slate-800 animate-spin mx-auto mb-4" />
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Cargando Panel</h2>
        <p className="text-xs text-slate-400 font-medium mt-1">Conectando con el catálogo FKUS…</p>
      </div>
    </div>
  )
}