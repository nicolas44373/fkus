// components/ProductCard.jsx
import React from 'react'
import { Package } from 'lucide-react'

const ProductCard = ({ product, formatPrice, selectedSaleType }) => {
  return (
    <div className="group relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-yellow-100 hover:border-yellow-300 overflow-hidden transform hover:-translate-y-2">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/80 via-transparent to-amber-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative p-6 space-y-4">
        {/* Product header */}
        <div className="flex items-start space-x-3">
          <div className="p-3 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl shadow-md group-hover:shadow-lg transition-shadow duration-300">
            <Package className="h-7 w-7 text-yellow-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-yellow-800 transition-colors duration-200 leading-tight">
              {product.name}
            </h3>
          </div>
        </div>

        {/* Price section - Conditional rendering based on sale type */}
        <div className="space-y-3">
          <div className={`flex items-center justify-center p-4 rounded-2xl border ${
            selectedSaleType === 'mayor' 
              ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200' 
              : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
          }`}>
            <div className="text-center">
              {selectedSaleType === 'mayor' ? (
                <>
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1 flex items-center justify-center">
                    📦 Precio por Caja
                  </p>
                  <p className="text-3xl font-bold text-blue-800">{formatPrice(product.price)}</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1 flex items-center justify-center">
                    ⚖️ Precio por Kg
                  </p>
                  <p className="text-3xl font-bold text-green-800">{formatPrice(product.price)}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hover effect border */}
      <div className={`absolute inset-0 rounded-3xl border-2 border-transparent transition-colors duration-300 pointer-events-none ${
        selectedSaleType === 'mayor' 
          ? 'group-hover:border-blue-300/50' 
          : 'group-hover:border-green-300/50'
      }`}></div>
    </div>
  )
}

export default ProductCard