'use client'

import React from 'react'
import { X, Download, FileText } from 'lucide-react'
import type { Product } from '../hooks/useProducts'

type Props = {
  products: Product[]
  onClose: () => void
}

const fmt = (price: string | null) => {
  if (!price) return '—'
  const n = parseFloat(price)
  if (isNaN(n)) return '—'
  return `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function PriceListModal({ products, onClose }: Props) {
  const available = products.filter(p => p.price && (p.stock_quantity ?? 0) > 0)

  const grouped = available.reduce((acc, p) => {
    const cat = p.category_name || 'Sin categoría'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {} as Record<string, Product[]>)

  const sortedCategories = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'es'))

  const today = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  // ── PDF export ────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    const win = window.open('', '_blank', 'width=960,height=720')
    if (!win) return

    const categoriesHtml = sortedCategories.map(cat => {
      const items = [...grouped[cat]].sort((a, b) => a.name.localeCompare(b.name, 'es'))
      const isRebozados = cat.toLowerCase() === 'rebozados'

      let bodyHtml = ''

      if (isRebozados) {
        const byBrand: Record<string, Product[]> = {}
        items.forEach(p => {
          const b = p.marca || 'Sin marca'
          if (!byBrand[b]) byBrand[b] = []
          byBrand[b].push(p)
        })
        const sortedBrands = Object.keys(byBrand).sort((a, b) => a.localeCompare(b, 'es'))

        bodyHtml = sortedBrands.map(brand => {
          const brandItems = byBrand[brand]
          const rows = brandItems.map(p => `
            <tr>
              <td class="name" style="padding-left:20px">${p.name}${p.unit ? ` <span class="unit">(${p.unit})</span>` : ''}</td>
              <td class="price">${fmt(p.price)}</td>
              <td class="desc">—</td>
            </tr>
          `).join('')
          return `
            <tr class="brand-row">
              <td colspan="3" class="brand-header">${brand} <span class="brand-count">${brandItems.length} producto${brandItems.length !== 1 ? 's' : ''}</span></td>
            </tr>
            ${rows}
          `
        }).join('')
      } else {
        bodyHtml = items.map(p => `
          <tr>
            <td class="name">${p.name}${p.unit ? ` <span class="unit">(${p.unit})</span>` : ''}</td>
            <td class="price">${fmt(p.price)}</td>
            <td class="desc">${p.marca || '—'}</td>
          </tr>
        `).join('')
      }

      return `
        <div class="cat-block">
          <div class="cat-header">${cat} <span class="cat-count">${items.length} producto${items.length !== 1 ? 's' : ''}</span></div>
          <table>
            <thead>
              <tr>
                <th class="th-name">Producto</th>
                <th class="th-price">Precio</th>
                <th class="th-desc">${isRebozados ? '' : 'Descripción'}</th>
              </tr>
            </thead>
            <tbody>${bodyHtml}</tbody>
          </table>
        </div>
      `
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Lista de Precios — FKUS</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; background: #fff; }
  .page { padding: 20px 28px; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 14px; border-bottom: 3px solid #18181b; margin-bottom: 22px; }
  .header-left h1 { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #111; }
  .header-left p { color: #6b7280; font-size: 10.5px; margin-top: 3px; }
  .header-right { text-align: right; color: #9ca3af; font-size: 10px; }
  .cat-block { margin-bottom: 22px; page-break-inside: avoid; }
  .cat-header { background: #f4f4f5; color: #18181b; font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; padding: 7px 12px; border-left: 4px solid #18181b; display: flex; justify-content: space-between; align-items: center; }
  .cat-count { font-weight: 500; font-size: 10px; color: #71717a; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #f9fafb; }
  th { padding: 7px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
  .th-price { text-align: right; }
  td { padding: 7px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
  td.name { color: #111; font-weight: 600; }
  td.price { text-align: right; color: #18181b; font-weight: 700; white-space: nowrap; }
  td.desc { color: #6b7280; font-size: 10px; }
  .unit { color: #9ca3af; font-size: 9.5px; font-weight: 400; }
  tr:nth-child(even) td { background: #f9fafb; }
  .brand-header { background: #eff6ff; color: #1e40af; font-weight: 800; font-size: 10.5px; padding: 6px 12px 6px 14px; border-left: 3px solid #3b82f6; letter-spacing: 0.3px; }
  .brand-count { font-weight: 400; font-size: 9.5px; color: #6b7280; margin-left: 6px; }
  .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 9.5px; }
  @page { margin: 15mm; size: A4; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>FKUS</h1>
      <p>Lista de Precios — Actualizado al ${today}</p>
    </div>
    <div class="header-right">Precios en pesos argentinos (ARS)<br>${available.length} productos · ${sortedCategories.length} categorías</div>
  </div>
  ${categoriesHtml}
  <div class="footer">Lista generada automáticamente · FKUS · ${today}</div>
</div>
<script>setTimeout(() => { window.print(); }, 250);</script>
</body>
</html>`

    win.document.open()
    win.document.write(html)
    win.document.close()
  }

  // ── Vista previa ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4 overflow-hidden">

        {/* Barra superior */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900 text-base">Lista de Precios</h2>
              <p className="text-xs text-gray-400">
                {available.length} productos · {sortedCategories.length} categorías · {today}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">

          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium">
            <span>📋</span>
            Productos con precio · Sin stock excluidos · Rebozados agrupados por marca
          </div>

          {sortedCategories.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📦</p>
              <p className="font-semibold">No hay productos con precio cargado</p>
            </div>
          ) : (
            sortedCategories.map(cat => {
              const items = [...grouped[cat]].sort((a, b) => a.name.localeCompare(b.name, 'es'))
              const isRebozados = cat.toLowerCase() === 'rebozados'

              const byBrand: Record<string, Product[]> = {}
              if (isRebozados) {
                items.forEach(p => {
                  const b = p.marca || 'Sin marca'
                  if (!byBrand[b]) byBrand[b] = []
                  byBrand[b].push(p)
                })
              }
              const sortedBrands = Object.keys(byBrand).sort((a, b) => a.localeCompare(b, 'es'))

              return (
                <div key={cat} className="rounded-xl border border-gray-200 overflow-hidden">
                  {/* Categoría header */}
                  <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex items-center gap-2">
                    <div className="w-1 h-5 bg-amber-500 rounded-full" />
                    <h3 className="font-extrabold text-amber-800 text-sm uppercase tracking-wide">{cat}</h3>
                    <span className="ml-auto text-xs text-amber-600 font-semibold">
                      {items.length} producto{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Producto</th>
                          <th className="text-right px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Precio</th>
                          {!isRebozados && (
                            <th className="text-left px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Descripción</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {isRebozados ? (
                          sortedBrands.map(brand => (
                            <React.Fragment key={brand}>
                              <tr className="bg-blue-50">
                                <td
                                  colSpan={2}
                                  className="px-5 py-2 text-xs font-extrabold text-blue-700 uppercase tracking-wide border-l-2 border-blue-400"
                                >
                                  {brand}
                                  <span className="ml-2 font-normal text-gray-400 normal-case">
                                    {byBrand[brand].length} producto{byBrand[brand].length !== 1 ? 's' : ''}
                                  </span>
                                </td>
                              </tr>
                              {byBrand[brand].map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-5 py-3 pl-8">
                                    <span className="font-semibold text-gray-800">{p.name}</span>
                                    {p.unit && <span className="text-xs text-gray-400 ml-1.5">({p.unit})</span>}
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    <span className="font-bold text-emerald-700">{fmt(p.price)}</span>
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))
                        ) : (
                          items.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3">
                                <span className="font-semibold text-gray-800">{p.name}</span>
                                {p.unit && <span className="text-xs text-gray-400 ml-1.5">({p.unit})</span>}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <span className="font-bold text-emerald-700">{fmt(p.price)}</span>
                              </td>
                              <td className="px-5 py-3 text-gray-500 text-xs">{p.marca || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
