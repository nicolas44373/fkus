export default function AdminHeader() {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-sans text-3xl font-black text-slate-900 select-none tracking-widest">F K U S</span>
          <div className="hidden xs:block border-l border-slate-200 h-6 shrink-0 pl-1.5" />
          <div className="hidden xs:block">
            <p className="text-sm font-black text-slate-900 leading-none">F K U S</p>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mt-0.5">Control Panel</p>
          </div>
        </div>
        <span className="text-xs font-black text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full">
          Admin Panel
        </span>
      </div>
    </header>
  )
}
