'use client'

import { useState } from 'react'
import {
  ShoppingCartIcon, TrendingUpIcon, ReceiptIcon,
  RotateCcwIcon, CreditCardIcon, BanknoteIcon,
} from 'lucide-react'
import { Card, CardContent } from '@pkg/ui'
import { OrdersFilter } from './components/orders-filter'
import { OrdersTable } from './components/orders-table'
import type { IOrdersViewProps } from './types'

const fmt = (n: number) =>
  n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface IKpiCardProps {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  iconBg: string
}

const KpiMiniCard = ({ label, value, sub, icon: Icon, iconBg }: IKpiCardProps) => (
  <Card>
    <CardContent className="pt-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`size-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-foreground mt-1 tabular-nums tracking-tight">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </CardContent>
  </Card>
)

const OrdersView = ({ orders, stores }: IOrdersViewProps) => {
  const [search, setSearch] = useState('')
  const [storeId, setStoreId] = useState('ALL')
  const [state, setState] = useState('ALL')
  const [payment, setPayment] = useState('ALL')
  const [datePreset, setDatePreset] = useState('ALL')
  const [sortBy, setSortBy] = useState('time-desc')

  // KPIs — computed from all orders
  const today = new Date().toDateString()
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const todayOrders = orders.filter(o =>
    new Date(o.createdAt).toDateString() === today && o.state !== 'CANCELLED',
  )
  const todayRevenue = todayOrders.reduce((s, o) => s + o.grandTotal, 0)
  const todayAvg = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0
  const refundsCount = orders.filter(o => o.state === 'REFUNDED').length

  const cardTotal = todayOrders.filter(o => o.paymentMethod === 'CARD').reduce((s, o) => s + o.grandTotal, 0)
  const cashTotal = todayOrders.filter(o => o.paymentMethod === 'CASH').reduce((s, o) => s + o.grandTotal, 0)
  const allTotal = cardTotal + cashTotal || 1

  // Filtering + sorting
  const filtered = orders
    .filter(o => {
      if (storeId !== 'ALL' && o.storeId !== storeId) return false
      if (state !== 'ALL' && o.state !== state) return false
      if (payment !== 'ALL' && o.paymentMethod !== payment) return false
      if (datePreset === 'TODAY' && new Date(o.createdAt).toDateString() !== today) return false
      if (datePreset === 'YESTERDAY' && new Date(o.createdAt).toDateString() !== yesterday.toDateString()) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !String(o.orderNumber).includes(q) &&
          !o.cashierName.toLowerCase().includes(q) &&
          !o.storeName.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'time-desc') return b.createdAt.getTime() - a.createdAt.getTime()
      if (sortBy === 'time-asc') return a.createdAt.getTime() - b.createdAt.getTime()
      if (sortBy === 'total-desc') return b.grandTotal - a.grandTotal
      if (sortBy === 'total-asc') return a.grandTotal - b.grandTotal
      return 0
    })

  const filteredRevenue = filtered.filter(o => o.state !== 'CANCELLED').reduce((s, o) => s + o.grandTotal, 0)
  const filteredItems = filtered.reduce((s, o) => s + o.itemCount, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Продажі</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{orders.length} чеків у базі</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiMiniCard
          label="Продажів сьогодні"
          value={String(todayOrders.length)}
          sub="чеків"
          icon={ShoppingCartIcon}
          iconBg="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
        />
        <KpiMiniCard
          label="Виручка сьогодні"
          value={`${fmt(todayRevenue)} грн.`}
          icon={TrendingUpIcon}
          iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
        />
        <KpiMiniCard
          label="Середній чек"
          value={`${fmt(todayAvg)} грн.`}
          icon={ReceiptIcon}
          iconBg="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
        />
        <KpiMiniCard
          label="Повернення"
          value={String(refundsCount)}
          sub="за весь час"
          icon={RotateCcwIcon}
          iconBg="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
        />

        {/* Payment breakdown card */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              По способу оплати
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Картка', total: cardTotal, Icon: CreditCardIcon },
                { label: 'Готівка', total: cashTotal, Icon: BanknoteIcon },
              ].map(({ label, total, Icon }) => {
                const pct = (total / allTotal) * 100
                return (
                  <div key={label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-foreground font-medium flex items-center gap-1">
                        <Icon className="size-3" />{label}
                      </span>
                      <span className="text-muted-foreground tabular-nums">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <OrdersFilter
        stores={stores}
        search={search}
        storeId={storeId}
        state={state}
        payment={payment}
        datePreset={datePreset}
        onSearch={setSearch}
        onStore={setStoreId}
        onState={setState}
        onPayment={setPayment}
        onDatePreset={setDatePreset}
      />

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <OrdersTable
          orders={filtered}
          totalRevenue={filteredRevenue}
          totalItems={filteredItems}
          totalCount={orders.length}
          sortBy={sortBy}
          onSortBy={setSortBy}
        />
      </div>
    </div>
  )
}

export { OrdersView }
