export default function AdminHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/tadeologo.png" alt="Tadeo Logo" className="w-10 h-10 object-contain" />
          <div>
            <p className="text-base font-extrabold text-gray-900 leading-none">Tadeo Rebozados</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Panel de administración</p>
          </div>
        </div>
        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
          Admin
        </span>
      </div>
    </header>
  )
}
