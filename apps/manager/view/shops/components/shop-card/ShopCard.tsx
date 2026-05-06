import Link from 'next/link'
import { MapPinIcon, StoreIcon, AlertTriangleIcon, UsersIcon } from 'lucide-react'
import { Button } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import type { IShopCardProps } from './types'

const ACCENT_KEYS = ['indigo', 'emerald', 'amber', 'sky', 'violet', 'teal'] as const
type TAccentKey = (typeof ACCENT_KEYS)[number]

const ACCENT_MAP: Record<TAccentKey, { bg: string; fg: string; solid: string }> = {
  indigo:  { bg: '#EEF2FF', fg: '#4338CA', solid: '#4F46E5' },
  emerald: { bg: '#ECFDF5', fg: '#047857', solid: '#10B981' },
  amber:   { bg: '#FFFBEB', fg: '#B45309', solid: '#F59E0B' },
  sky:     { bg: '#F0F9FF', fg: '#0369A1', solid: '#0EA5E9' },
  violet:  { bg: '#F5F3FF', fg: '#6D28D9', solid: '#8B5CF6' },
  teal:    { bg: '#F0FDFA', fg: '#0F766E', solid: '#14B8A6' },
}

const getAccent = (id: string) => {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return ACCENT_MAP[ACCENT_KEYS[hash % ACCENT_KEYS.length]]
}

const ShopCard = ({ shop }: IShopCardProps) => {
  const accent = getAccent(shop.id)
  const isArchived = shop.status === 'ARCHIVED'
  const isOpen = !isArchived && shop.hasOpenShift
  const totalStockAlerts = shop.outOfStockCount + shop.lowStockCount

  return (
    <div className={cn(
      'bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
      'hover:shadow-md hover:border-slate-300 transition-all overflow-hidden group cursor-pointer flex flex-col',
      isArchived && 'opacity-60',
    )}>
      {/* Gradient header */}
      <div
        className="h-24 relative shrink-0"
        style={{ background: `linear-gradient(135deg, ${accent.solid} 0%, ${accent.fg} 100%)` }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          {isOpen ? (
            <span className="bg-white/95 backdrop-blur text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Відкритий
            </span>
          ) : isArchived ? (
            <span className="bg-white/95 backdrop-blur text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Архів
            </span>
          ) : (
            <span className="bg-white/95 backdrop-blur text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Зачинений
            </span>
          )}
        </div>

        {/* Region + hours */}
        {(shop.region || shop.openingHours) && (
          <div className="absolute bottom-3 left-4 text-white">
            {shop.region && (
              <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">{shop.region}</div>
            )}
            {shop.openingHours && (
              <div className="text-xs opacity-90 mt-0.5">{shop.openingHours}</div>
            )}
          </div>
        )}

        {/* Floating store icon */}
        <div
          className="absolute -bottom-5 right-4 w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center shrink-0"
          style={{ color: accent.fg }}
        >
          <StoreIcon className="size-5" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 pt-8 flex-1 flex flex-col">
        <div>
          <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-[15px]">
            {shop.name}
          </h3>
          {shop.address && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPinIcon className="size-3 shrink-0" />
              {shop.address}
            </p>
          )}
        </div>

        {/* Stock alert banner */}
        {totalStockAlerts > 0 && (
          <div className="mt-3 bg-amber-50 text-amber-800 p-2.5 rounded-lg text-xs flex items-start gap-2 border border-amber-100">
            <AlertTriangleIcon className="size-3.5 mt-0.5 shrink-0" />
            <span className="font-medium">
              {shop.outOfStockCount > 0 && `${shop.outOfStockCount} SKU немає в наявності`}
              {shop.outOfStockCount > 0 && shop.lowStockCount > 0 && ', '}
              {shop.lowStockCount > 0 && `${shop.lowStockCount} SKU закінчується`}
            </span>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 my-4 pt-4 border-t border-slate-100">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Виручка</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
              ₴ {Number(shop.revenueToday).toLocaleString('uk-UA')}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Залишки</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
              {Number(shop.stockTotal).toLocaleString('uk-UA')} од.
            </div>
            {totalStockAlerts > 0 ? (
              <div className="text-[11px] text-amber-600 font-semibold mt-0.5">{totalStockAlerts} SKU нижче норми</div>
            ) : (
              <div className="text-[11px] text-slate-400 mt-0.5">Все в нормі</div>
            )}
          </div>
        </div>

        {/* Manager / staff row */}
        <div className="flex items-center justify-between bg-slate-50 px-3 py-2.5 rounded-lg">
          {shop.managersCount > 0 ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: accent.bg, color: accent.fg }}
              >
                <UsersIcon className="size-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {shop.managersCount} {shop.managersCount === 1 ? 'менеджер' : 'менеджери'}
                </div>
                <div className="text-[10px] text-slate-500">Персонал</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                <UsersIcon className="size-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-rose-700">Не призначено</div>
                <div className="text-[10px] text-slate-500">Менеджер</div>
              </div>
            </div>
          )}
          <div className={cn(
            'text-[10px] font-semibold px-2 py-1 rounded-md border shrink-0',
            isOpen
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : 'text-slate-500 bg-white border-slate-200',
          )}>
            {isOpen ? 'Зміна відкрита' : 'Зміна закрита'}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/shops/${shop.id}?tab=stock`}>Склад</Link>
          </Button>
          <Button size="sm" asChild className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-0 shadow-none">
            <Link href={`/shops/${shop.id}`}>Деталі</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export { ShopCard }
