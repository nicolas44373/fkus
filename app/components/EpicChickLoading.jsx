// components/EpicChickLoading.jsx
'use client'

import React from 'react'

const EpicChickLoading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 relative overflow-hidden">
      {/* Container principal */}
      <div className="text-center z-10 relative px-4">
        {/* Logo animado */}
        <div className="relative mb-8 flex justify-center">
          <div className="relative inline-block animate-pulse duration-1500">
            <span className="font-sans text-5xl font-black text-white select-none">
              F K U S
            </span>
          </div>
        </div>

        {/* Texto con efectos */}
        <div className="space-y-5">
          <h2 className="text-sm font-black text-zinc-200 tracking-[0.25em] uppercase">
            Cargando Colección Exclusiva
          </h2>
          
          {/* Barra de progreso animada */}
          <div className="w-48 h-1 bg-zinc-900 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-white rounded-full animate-progress shadow-sm"></div>
          </div>
          
          <p className="text-zinc-450 text-[10px] uppercase tracking-widest font-semibold">
            Cargando experiencia F K U S...
          </p>
        </div>
      </div>

      {/* Estilos CSS personalizados */}
      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        
        .animate-progress {
          animation: progress 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default EpicChickLoading;