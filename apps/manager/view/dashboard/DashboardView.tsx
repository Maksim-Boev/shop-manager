import { ReceiptIcon, PackageIcon, UsersIcon, TrendingUpIcon } from 'lucide-react'
import { KpiCard } from './components/kpi-card'
import { RevenueChart } from './components/revenue-chart'
import { TopShops } from './components/top-shops'
import { ActivityFeed } from './components/activity-feed'
import { AlertsPanel } from './components/alerts-panel'
import type { IDashboardViewProps } from './types'

const DashboardView = ({ kpis, revenueByHour, topShops, activity, alerts }: IDashboardViewProps) => {
  const today = new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', weekday: 'short' })

  return (
    <div className="space-y-6 max-w-400">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-foreground tracking-tight">Огляд мережі</h1>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Сьогодні · {today}
          </span>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Виручка сьогодні"
          value={`₴ ${Number(kpis.revenueToday).toLocaleString('uk-UA')}`}
          icon={TrendingUpIcon}
          iconBg="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
        />
        <KpiCard
          label="Чеків пробито"
          value={String(kpis.checksCount)}
          sub={`Сер. чек ₴ ${Number(kpis.avgCheck).toFixed(2)}`}
          icon={ReceiptIcon}
          iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
        />
        <KpiCard
          label="Товарів на складах"
          value={kpis.stockUnitsTotal.toLocaleString('uk-UA')}
          sub={`${kpis.outOfStockSkuCount} SKU — нуль; ${kpis.lowStockSkuCount} — мало`}
          alert={kpis.outOfStockSkuCount > 0 || kpis.lowStockSkuCount > 0}
          icon={PackageIcon}
          iconBg="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
        />
        <KpiCard
          label="Персонал на зміні"
          value={`${kpis.staffOnShift} / ${kpis.shopsTotal}`}
          sub={`${kpis.shopsOpen} з ${kpis.shopsTotal} магазинів відкриті`}
          icon={UsersIcon}
          iconBg="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RevenueChart
          data={revenueByHour}
          totalRevenue={`₴ ${Number(kpis.revenueToday).toLocaleString('uk-UA')}`}
        />
        <ActivityFeed events={activity} />
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopShops shops={topShops} />
        <AlertsPanel alerts={alerts} />
      </div>
    </div>
  )
}

export { DashboardView }
