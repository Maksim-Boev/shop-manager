'use client'

import {
  TrendingUpIcon, TrendingDownIcon,
  PackageIcon, UsersIcon, ArrowRightIcon,
} from 'lucide-react'
import { Button } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import type { IOverviewTabProps } from './types'

const fmt = (n: number) =>
  `₴ ${n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const OverviewTab = ({ data, onGoToStock }: IOverviewTabProps) => {
  const delta =
    data.revenueYesterday > 0
      ? ((data.revenueToday - data.revenueYesterday) / data.revenueYesterday) * 100
      : 0
  const deltaPositive = delta >= 0
  const totalAlerts = data.outOfStockCount + data.lowStockCount

  return (
    <div className="space-y-6">
      {/* KPI сетка 2×2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Виручка */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Виручка сьогодні
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums">
            {fmt(data.revenueToday)}
          </div>
          {data.revenueYesterday > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span
                className={cn(
                  'text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded',
                  deltaPositive
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-rose-700 bg-rose-50',
                )}
              >
                {deltaPositive ? (
                  <TrendingUpIcon className="size-3" />
                ) : (
                  <TrendingDownIcon className="size-3" />
                )}
                {Math.abs(delta).toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">vs. вчора</span>
            </div>
          )}
        </div>

        {/* Чеки */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Чеки</div>
          <div className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums">
            {data.checksToday}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Середній чек{' '}
            <span className="font-semibold text-slate-700 tabular-nums">
              {fmt(data.avgCheck)}
            </span>
          </div>
        </div>

        {/* Персонал */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Персонал на зміні
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums">
            {data.staffOnShift}
          </div>
          <div className="flex -space-x-1.5 mt-2">
            {data.staffOnShiftList.slice(0, 4).map(m => (
              <div
                key={m.userId}
                title={`${m.firstName} ${m.lastName}`}
                className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center ring-2 ring-white"
              >
                {m.firstName[0]}{m.lastName[0]}
              </div>
            ))}
            {data.staffOnShiftList.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">
                +{data.staffOnShiftList.length - 4}
              </div>
            )}
          </div>
        </div>

        {/* Складські алерти */}
        <div
          className={cn(
            'bg-white rounded-xl border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
            totalAlerts > 0 ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200',
          )}
        >
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Складські алерти
            </div>
            {totalAlerts > 0 && (
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums">
            {totalAlerts}
          </div>
          <div className="text-xs mt-2">
            {data.outOfStockCount > 0 && (
              <span className="text-rose-600 font-semibold">{data.outOfStockCount} немає · </span>
            )}
            <span className="text-amber-600 font-semibold">{data.lowStockCount} закінч.</span>
          </div>
        </div>
      </div>

      {/* Нижняя сетка */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Потребують поповнення */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900">Потребують поповнення</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalAlerts} товарів · сортовано за пріоритетом
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onGoToStock} className="gap-1">
              Весь склад <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>

          {data.topLowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <PackageIcon className="size-8 mb-2" />
              <span className="text-sm">Всі товари в нормі</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.topLowStock.map(item => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/60"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <PackageIcon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="font-mono">{item.sku}</span>
                      <span>·</span>
                      <span>{item.category}</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      item.stock === 0 ? 'text-rose-600' : 'text-amber-600',
                    )}
                  >
                    {item.stock} шт.
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-bold rounded-full',
                      item.stock === 0
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700',
                    )}
                  >
                    {item.stock === 0 ? 'Немає' : 'Низький'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* На зміні зараз */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">На зміні зараз</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {data.staffOnShift} {data.staffOnShift === 1 ? 'людина' : 'людей'}
            </p>
          </div>

          {data.staffOnShiftList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <UsersIcon className="size-8 mb-2" />
              <span className="text-sm">Зміна не відкрита</span>
            </div>
          ) : (
            <div className="p-4 space-y-1">
              {data.staffOnShiftList.map(m => (
                <div
                  key={m.userId}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {m.firstName[0]}{m.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {m.firstName} {m.lastName}
                    </div>
                    <div className="text-xs text-emerald-600 font-medium">На зміні</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { OverviewTab }
