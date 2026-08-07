'use client'

import { useRouter } from 'next/navigation'

export default function Footer() {
  const router = useRouter()

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent('Hola 𝗙𝗞🇺𝗦! Quería consultar sobre el catálogo.')
    window.open(`https://wa.me/5493813504756?text=${text}`, '_blank')
  }

  return (
    <footer className="bg-surface border-t border-hairline mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 sm:gap-8">

          {/* Marca */}
          <div className="col-span-2 md:col-span-1">
            <span className="font-sans text-xl font-black tracking-[0.3em] text-bone select-none">FKUS</span>
            <p className="text-[11px] text-smoke leading-relaxed mt-4 max-w-[220px]">
              Piezas de producción limitada. Diseño contemporáneo, materiales premium, exclusividad real.
            </p>
          </div>

          {/* Navegación */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-500 mb-4">Navegación</h4>
            <ul className="space-y-2.5 text-[12px] text-smoke">
              <li><button onClick={() => router.push('/')} className="hover:text-bone transition-colors cursor-pointer">Inicio</button></li>
              <li><button onClick={() => window.dispatchEvent(new Event('open-menu-drawer'))} className="hover:text-bone transition-colors cursor-pointer">Prendas</button></li>
              <li><button onClick={handleWhatsAppContact} className="hover:text-bone transition-colors cursor-pointer">Contacto</button></li>
            </ul>
          </div>

          {/* Servicio */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-500 mb-4">Servicio</h4>
            <ul className="space-y-2.5 text-[12px] text-smoke">
              <li>Envíos con packaging premium</li>
              <li>Cambios coordinados por WhatsApp</li>
              <li>Efectivo, transferencia y tarjetas</li>
            </ul>
          </div>

          {/* Club */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-500 mb-4">Club FKUS</h4>
            <p className="text-[12px] text-smoke leading-relaxed mb-3">
              Sumá puntos en cada compra y accedé a beneficios exclusivos de socios.
            </p>
            <button
              onClick={handleWhatsAppContact}
              className="text-[11px] font-bold text-gold-400 hover:text-gold-300 uppercase tracking-widest border-b border-gold-500 pb-0.5 transition-colors cursor-pointer"
            >
              Consultar por WhatsApp
            </button>
          </div>

        </div>

        <div className="mt-14 pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-smoke tracking-wide">
            © {new Date().getFullYear()} FKUS. Todos los derechos reservados.
          </p>
          <p className="text-[10px] text-smoke tracking-wide">
            Producción limitada · Diseño contemporáneo
          </p>
        </div>
      </div>
    </footer>
  )
}
