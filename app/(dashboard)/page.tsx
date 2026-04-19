'use client'

import {
  TrendingUpIcon, TrendingDownIcon, ReceiptIcon, PackageIcon, UsersIcon,
  TruckIcon, AlertTriangleIcon, ClockIcon, ShoppingCartIcon, UserCheckIcon,
  ArrowRightIcon, ChevronRightIcon, DownloadIcon, PlusIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─── Mock data ────────────────────────────────────────────────────────────────

const kpis = [
  {
    label: 'Виручка сьогодні',
    value: '₴ 271 650',
    delta: +5.7,
    sub: null,
    icon: TrendingUpIcon,
    iconBg: 'bg-indigo-50 text-indigo-600',
    bars: [28,34,42,48,56,64,68,72,78,84,92,98,112,132,152,172,198,228,245,258,252,250,248,252],
    barColor: '#4F46E5',
  },
  {
    label: 'Чеків пробито',
    value: '985',
    delta: +8.2,
    sub: 'Сер. чек ₴ 275',
    icon: ReceiptIcon,
    iconBg: 'bg-emerald-50 text-emerald-600',
    bars: [4,8,12,16,22,28,36,44,52,60,72,84,96,108,122,138,152,168,184,196,208,218,228,238],
    barColor: '#10B981',
  },
  {
    label: 'Товарів на складах',
    value: '55 230',
    delta: null,
    sub: '21 SKU потребують уваги',
    icon: PackageIcon,
    iconBg: 'bg-sky-50 text-sky-600',
    bars: null,
    barColor: null,
    alert: true,
  },
  {
    label: 'Персонал на зміні',
    value: '9 / 15',
    delta: null,
    sub: '5 з 6 магазинів відкриті',
    icon: UsersIcon,
    iconBg: 'bg-violet-50 text-violet-600',
    bars: null,
    barColor: null,
  },
]

const topShops = [
  { name: 'Сільпо Оболонь',    city: 'Київ',  revenue: '₴ 72 340', delta: +6.2,  pct: 100, color: '#10B981' },
  { name: 'Novus Хрещатик',    city: 'Київ',  revenue: '₴ 58 900', delta: -3.8,  pct: 81,  color: '#F59E0B' },
  { name: 'АТБ Подільський',   city: 'Київ',  revenue: '₴ 48 520', delta: +12.3, pct: 67,  color: '#4F46E5' },
  { name: 'Novus Одеса-Марина',city: 'Одеса', revenue: '₴ 41 200', delta: +4.3,  pct: 57,  color: '#8B5CF6' },
]

const activity = [
  { icon: ShoppingCartIcon, color: 'bg-emerald-50 text-emerald-600', text: 'Великий чек — ₴ 2 840',           shop: 'Сільпо Оболонь',    time: '10:42' },
  { icon: PackageIcon,      color: 'bg-amber-50 text-amber-600',     text: 'Низький залишок: Barilla — 2 шт', shop: 'АТБ Подільський',   time: '10:38' },
  { icon: TruckIcon,        color: 'bg-indigo-50 text-indigo-600',   text: 'Створено накладну на поповнення', shop: 'Novus Хрещатик',    time: '10:30' },
  { icon: UserCheckIcon,    color: 'bg-sky-50 text-sky-600',         text: 'Катерина Бабій вийшла на зміну',  shop: 'Сільпо Оболонь',    time: '10:24' },
  { icon: AlertTriangleIcon,color: 'bg-rose-50 text-rose-600',       text: 'Потрібно призначити керуючого',   shop: 'Novus Одеса-Марина',time: '10:18' },
  { icon: ClockIcon,        color: 'bg-amber-50 text-amber-600',     text: 'Тех. перерва — інвентаризація',  shop: 'Сільпо Стрийська',  time: '10:05' },
]

const alerts = [
  { icon: AlertTriangleIcon, color: 'bg-rose-50 text-rose-600',    title: 'Не призначено керуючого',  desc: 'Novus Одеса-Марина',               action: 'Призначити' },
  { icon: PackageIcon,       color: 'bg-amber-50 text-amber-600',  title: 'Критичні залишки (5 SKU)', desc: 'АТБ Подільський · Novus Хрещатик', action: 'Переглянути' },
  { icon: ClockIcon,         color: 'bg-sky-50 text-sky-600',      title: 'Тех. перерва',             desc: 'Сільпо Стрийська до 16:00',        action: null },
  { icon: TruckIcon,         color: 'bg-indigo-50 text-indigo-600',title: '2 накладні очікують',      desc: 'Потрібно підтвердити відправлення',action: 'Переглянути' },
]

const BAR_DATA   = [1200,4800,8900,12400,15800,18200,19800,21500,23400,24100,22800,20400,17600,14800,11200,6400]
const BAR_LABELS = ['07','','09','','11','','13','','15','','17','','19','','21','']

// ─── Sub-components ───────────────────────────────────────────────────────────

const Card = ({ children, className, pad = true }: { children: React.ReactNode; className?: string; pad?: boolean }) => (
  <div className={cn(
    'bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
    pad && 'p-6',
    className,
  )}>
    {children}
  </div>
)

const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  const w = 220, h = 40
  const step = w / (data.length - 1)
  const pts = data.map((v, i) => [i * step, h - ((v - min) / range) * (h - 4) - 2] as [number, number])
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path d={area} fill={color} opacity={0.15} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.5" fill={color} />
    </svg>
  )
}

const BarChart = () => {
  const max = Math.max(...BAR_DATA)
  return (
    <div className="flex items-end gap-1" style={{ height: 180 }}>
      {BAR_DATA.map((v, i) => {
        const h = (v / max) * 160
        const isPeak = v === max
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition font-medium tabular-nums">
              {Math.round(v / 1000)}k
            </div>
            <div
              className="w-full rounded-t transition-all group-hover:opacity-80"
              style={{ height: h, background: isPeak ? '#4F46E5' : '#C7D2FE', minHeight: 2 }}
            />
            <div className="text-[10px] text-slate-400">{BAR_LABELS[i]}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DashboardPage = () => (
  <div className="space-y-6 max-w-400">
    {/* Page heading */}
    <div className="flex items-start justify-between gap-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Огляд мережі</h1>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Сьогодні · 18 квітня, пт
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm">
          <DownloadIcon />
          Звіт
        </Button>
        <Button size="sm">
          <PlusIcon />
          Додати магазин
        </Button>
      </div>
    </div>

    {/* KPI row */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(kpi => (
        <Card key={kpi.label} className="relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className={cn('size-9 rounded-xl flex items-center justify-center relative', kpi.iconBg)}>
              <kpi.icon className="size-4" />
              {kpi.alert && (
                <span className="absolute -top-0.5 -right-0.5 size-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            {kpi.delta != null && (
              <span className={cn(
                'text-xs font-semibold inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded',
                kpi.delta >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50',
              )}>
                {kpi.delta >= 0
                  ? <TrendingUpIcon className="size-3" />
                  : <TrendingDownIcon className="size-3" />}
                {kpi.delta > 0 ? '+' : ''}{kpi.delta.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{kpi.label}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums tracking-tight">{kpi.value}</div>
          {kpi.sub && <div className="text-xs text-slate-500 mt-1">{kpi.sub}</div>}
          {kpi.bars && kpi.barColor && (
            <div className="mt-3 -mx-1">
              <Sparkline data={kpi.bars} color={kpi.barColor} />
            </div>
          )}
        </Card>
      ))}
    </div>

    {/* Main grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue chart */}
      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Виручка по годинах</h2>
            <p className="text-xs text-slate-500 mt-0.5">Сьогодні, сумарно по всій мережі</p>
          </div>
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
            {['Сьогодні', 'Тиждень', 'Місяць'].map((t, i) => (
              <button key={t} className={cn(
                'px-3 py-1 text-xs font-medium rounded-md',
                i === 0 ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500',
              )}>{t}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-6 items-baseline mb-5">
          <div>
            <div className="text-3xl font-bold text-slate-900 tabular-nums">₴ 271 650</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-0.5">
                <TrendingUpIcon className="size-3" />+5.7%
              </span>
              <span className="text-xs text-slate-500">vs. вчора</span>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <div className="text-xs text-slate-500">Піковий час</div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5">15:00 – 16:00</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Середній чек</div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums">₴ 275</div>
          </div>
        </div>
        <BarChart />
      </Card>

      {/* Activity feed */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Стрічка подій</h2>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              В реальному часі
            </p>
          </div>
          <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Усі</button>
        </div>
        <div className="space-y-0 -mx-2">
          {activity.map((a, i) => (
            <div key={i} className="relative flex gap-3 items-start px-2 py-2 rounded-lg hover:bg-slate-50 group">
              {i < activity.length - 1 && (
                <div className="absolute left-5.5 top-10 bottom-0 w-px bg-slate-100" />
              )}
              <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0 relative z-10', a.color)}>
                <a.icon className="size-3.5" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="text-sm text-slate-900 leading-snug">{a.text}</div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <span>{a.shop}</span>
                  <span className="text-slate-300">·</span>
                  <span className="tabular-nums">{a.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* Bottom grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top shops */}
      <Card pad={false} className="lg:col-span-2">
        <div className="flex items-center justify-between p-6 pb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Топ магазинів за виручкою</h2>
            <p className="text-xs text-slate-500 mt-0.5">Сьогодні</p>
          </div>
          <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
            Усі магазини <ArrowRightIcon className="size-3" />
          </button>
        </div>
        <div className="px-2 pb-2">
          {topShops.map((s, i) => (
            <button key={s.name} className="w-full grid grid-cols-12 items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-50 text-left group transition-colors">
              <div className="col-span-4 flex items-center gap-3">
                <div className="size-9 rounded-lg flex items-center justify-center text-sm font-bold tabular-nums text-white" style={{ background: s.color }}>
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate group-hover:text-indigo-700">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.city}</div>
                </div>
              </div>
              <div className="col-span-5">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: s.pct + '%', background: s.color }} />
                </div>
              </div>
              <div className="col-span-2 text-right tabular-nums">
                <div className="font-bold text-slate-900 text-sm">{s.revenue}</div>
                <div className={cn('text-xs', s.delta >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                  {s.delta > 0 ? '+' : ''}{s.delta.toFixed(1)}%
                </div>
              </div>
              <div className="col-span-1 text-right">
                <ChevronRightIcon className="size-4 text-slate-300 group-hover:text-indigo-600 ml-auto" />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Alerts */}
      <Card pad={false}>
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Потребують уваги</h2>
            <p className="text-xs text-slate-500 mt-0.5">4 задачі</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-start gap-3 px-6 py-3.5 hover:bg-slate-50/60 group">
              <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', a.color)}>
                <a.icon className="size-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900">{a.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{a.desc}</div>
              </div>
              {a.action && (
                <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {a.action}
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
)

export default DashboardPage
