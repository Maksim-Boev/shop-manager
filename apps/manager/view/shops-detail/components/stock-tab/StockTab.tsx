'use client'

import { useState, useMemo } from 'react'
import { PackageIcon } from 'lucide-react'
import { cn } from '@pkg/ui/cn'
import { StockFilter } from './StockFilter'
import type { IStockTabProps } from './types'

const UNIT_LABELS: Record<string, string> = {
  PIECE: 'шт.', KG: 'кг', GRAM: 'г', LITER: 'л',
  MILLILITER: 'мл', METER: 'м', PACK: 'уп.',
}

const StockTab = ({ items }: IStockTabProps) => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)

  const categories = useMemo(
    () => [...new Set(items.map(i => i.category))].sort(),
    [items],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(i => {
      if (q && !i.name.toLowerCase().includes(q) && !i.sku.toLowerCase().includes(q))
        return false
      if (category && i.category !== category) return false
      if (onlyLow && i.stock >= 10) return false
      return true
    })
  }, [items, search, category, onlyLow])

  const totalValue = filtered.reduce((s, i) => s + i.stock * i.effectivePrice, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      <StockFilter
        search={search} category={category} onlyLow={onlyLow} categories={categories}
        onSearch={setSearch} onCategory={setCategory} onOnlyLow={setOnlyLow}
      />

      {/* Summary bar */}
      <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Показано {filtered.length} з {items.length} SKU</span>
        <span>
          Вартість залишків:{' '}
          <span className="font-semibold text-slate-700 tabular-nums">
            ₴ {totalValue.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}
          </span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60">
            <tr>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Товар</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Категорія</th>
              <th className="px-5 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Залишок</th>
              <th className="px-5 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ціна</th>
              <th className="px-5 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(item => (
              <tr
                key={item.productId}
                className={cn(
                  'hover:bg-slate-50/60',
                  item.stock === 0 && 'bg-rose-50/30',
                )}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <PackageIcon className="size-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span className="font-mono">{item.sku}</span>
                        <span>·</span>
                        <span>{UNIT_LABELS[item.unit] ?? item.unit}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-600">{item.category}</td>
                <td
                  className={cn(
                    'px-5 py-3 text-right font-semibold tabular-nums',
                    item.stock === 0
                      ? 'text-rose-600'
                      : item.stock < 10
                        ? 'text-amber-600'
                        : 'text-slate-900',
                  )}
                >
                  {item.stock} {UNIT_LABELS[item.unit] ?? 'шт.'}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-900 font-medium">
                  ₴ {item.effectivePrice.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3 text-center">
                  {item.isAvailable ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                      Доступний
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">
                      Недоступний
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">
                  Нічого не знайдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export { StockTab }
