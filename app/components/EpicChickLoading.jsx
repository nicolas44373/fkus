// components/EpicChickLoading.jsx
'use client'

import React from 'react'

const EpicChickLoading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* Container principal */}
      <div className="text-center z-10 relative px-4">
        {/* Logo animado */}
        <div className="relative mb-6 flex justify-center">
          <div className="relative inline-block animate-pulse duration-1000">
            <img 
              src="/tadeologo.png" 
              alt="Tadeo Logo" 
              className="w-44 h-44 object-contain"
            />
          </div>
        </div>

        {/* Texto con efectos */}
        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">
            Cargando catálogo
          </h2>
          
          {/* Barra de progreso animada */}
          <div className="w-56 h-2 bg-gray-100 rounded-full mx-auto overflow-hidden shadow-inner">
            <div className="h-full bg-amber-500 rounded-full animate-progress shadow-sm"></div>
          </div>
          
          <p className="text-gray-500 text-sm font-medium">
            Preparando los mejores productos para vos...
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