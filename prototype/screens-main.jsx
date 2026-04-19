// Dashboard + Shops list + Shop detail screens

// ============== DASHBOARD ==============
function DashboardScreen({ data, setRoute, openModal }) {
  const { chain, shops, activity, employees, transfers } = data;
  const revDelta = ((chain.revenueToday - chain.revenueYesterday) / chain.revenueYesterday) * 100;
  const topShops = [...shops].sort((a, b) => b.revenue - a.revenue).slice(0, 4);
  const hourLabels = ['07','','09','','11','','13','','15','','17','','19','','21',''];

  return (
    <>
      <TopBar
        title="Огляд мережі"
        subtitle={<Badge tone="emerald" dot>Сьогодні · 18 квітня, пт</Badge>}
        actions={<>
          <Button variant="secondary" icon="download">Звіт</Button>
          <Button icon="plus" onClick={() => openModal('add-shop')}>Додати магазин</Button>
        </>}
      />

      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* KPI ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Виручка сьогодні"
            value={fmtUAH(chain.revenueToday)}
            delta={revDelta}
            sparkColor="#4F46E5"
            sparkFill="#EEF2FF"
            data={[28,34,42,48,56,64,68,72,78,84,92,98,112,132,152,172,198,228,245,258,252,250,248,252]}
            icon="trending-up"
            iconBg="bg-indigo-50 text-indigo-600"
          />
          <KpiCard
            label="Чеків пробито"
            value={fmtNum(chain.checks)}
            sub={`Ср. чек ${fmtUAH(chain.revenueToday/chain.checks)}`}
            sparkColor="#10B981"
            sparkFill="#ECFDF5"
            data={[4,8,12,16,22,28,36,44,52,60,72,84,96,108,122,138,152,168,184,196,208,218,228,238]}
            icon="receipt"
            iconBg="bg-emerald-50 text-emerald-600"
          />
          <KpiCard
            label="Товарів на складах"
            value={fmtNum(chain.stockUnits)}
            sub={`${chain.lowStockSkus} SKU потребують уваги`}
            icon="package"
            iconBg="bg-sky-50 text-sky-600"
            alertPulse
          />
          <KpiCard
            label="Персонал на зміні"
            value={`${chain.staffOnShift} / ${chain.staffTotal}`}
            sub={`${chain.shopsOpen} з ${chain.shopsTotal} магазинів відкриті`}
            icon="users"
            iconBg="bg-violet-50 text-violet-600"
          />
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
                {['Сьогодні','Тиждень','Місяць'].map((t,i) => (
                  <button key={t} className={`px-3 py-1 text-xs font-medium rounded-md ${i===0 ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-6 items-baseline mb-5">
              <div>
                <div className="text-3xl font-bold text-slate-900 tabular-nums">{fmtUAH(chain.revenueToday)}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-xs font-semibold ${revDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'} inline-flex items-center gap-0.5`}>
                    <Icon name={revDelta >= 0 ? 'trending-up' : 'trending-down'} className="w-3 h-3" />
                    {fmtPct(revDelta)}
                  </span>
                  <span className="text-xs text-slate-500">vs. вчора</span>
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200"></div>
              <div>
                <div className="text-xs text-slate-500">Піковий час</div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">15:00 – 16:00</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Середній чек</div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums">{fmtUAH(chain.revenueToday/chain.checks)}</div>
              </div>
            </div>
            <BarChart data={chain.hourly} labels={hourLabels} height={180} color="#4F46E5" accent="#C7D2FE" />
          </Card>

          {/* Live activity */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Стрічка подій</h2>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  В реальному часі
                </p>
              </div>
              <Button variant="ghost" size="sm">Усі</Button>
            </div>
            <div className="space-y-0 -mx-2">
              {activity.map((a, i) => {
                const shop = shops.find(s => s.id === a.shopId);
                const emp = a.emp ? employees.find(e => e.id === a.emp) : null;
                const iconMap = { sale: 'shopping-cart', stock: 'package', transfer: 'truck', staff: 'user-check', alert: 'alert-triangle' };
                const toneMap = { sale: 'emerald', stock: 'amber', transfer: 'indigo', staff: 'sky', alert: 'rose' };
                const c = accent(toneMap[a.type]);
                return (
                  <div key={a.id} className="flex gap-3 items-start px-2 py-2 rounded-lg hover:bg-slate-50 relative group">
                    {i < activity.length - 1 && <div className="absolute left-[22px] top-10 bottom-0 w-px bg-slate-100"></div>}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative z-10" style={{ background: c.bg, color: c.fg }}>
                      <Icon name={iconMap[a.type]} className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-sm text-slate-900 leading-snug">{a.text}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{shop?.name}</span>
                        <span className="text-slate-300">·</span>
                        {emp && <><span>{emp.name}</span><span className="text-slate-300">·</span></>}
                        <span className="tabular-nums">{a.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Top shops + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2" pad={false}>
            <div className="flex items-center justify-between p-6 pb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Топ магазинів за виручкою</h2>
                <p className="text-xs text-slate-500 mt-0.5">Сьогодні</p>
              </div>
              <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => setRoute({ screen: 'shops' })}>Усі магазини</Button>
            </div>
            <div className="px-2 pb-2">
              {topShops.map((s, i) => {
                const c = accent(s.accent);
                const pct = (s.revenue / topShops[0].revenue) * 100;
                const delta = ((s.revenue - s.revenueYesterday) / s.revenueYesterday) * 100;
                return (
                  <button key={s.id} onClick={() => setRoute({ screen: 'shop-detail', shopId: s.id })}
                    className="w-full grid grid-cols-12 items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-50 text-left group transition-colors">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold tabular-nums" style={{ background: c.bg, color: c.fg }}>{i+1}</div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 truncate group-hover:text-indigo-700">{s.name}</div>
                        <div className="text-xs text-slate-500 truncate">{s.city} · {s.checks} чеків</div>
                      </div>
                    </div>
                    <div className="col-span-5">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: pct + '%', background: c.solid }}></div>
                      </div>
                    </div>
                    <div className="col-span-2 text-right tabular-nums">
                      <div className="font-bold text-slate-900 text-sm">{fmtUAH(s.revenue)}</div>
                      <div className={`text-xs ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtPct(delta)}</div>
                    </div>
                    <div className="col-span-1 text-right">
                      <Icon name="chevron-right" className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 ml-auto" />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Alerts panel */}
          <Card pad={false}>
            <div className="flex items-center justify-between p-6 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Потребують уваги</h2>
                <p className="text-xs text-slate-500 mt-0.5">{transfers.filter(t => t.status === 'pending').length + shops.filter(s => s.alert || s.status === 'break').length} задач</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              <AlertRow icon="alert-triangle" tone="rose" title="Не призначено керуючого" desc="Novus Одеса-Марина" action="Призначити"
                onClick={() => setRoute({ screen: 'shop-detail', shopId: 'shop-6' })} />
              <AlertRow icon="package" tone="amber" title="Критичні залишки (5 SKU)" desc="АТБ Подільський · Novus Хрещатик" action="Переглянути"
                onClick={() => setRoute({ screen: 'shops' })} />
              <AlertRow icon="clock" tone="sky" title="Тех. перерва" desc="Сільпо Стрийська до 16:00" />
              <AlertRow icon="truck" tone="indigo" title="2 накладні очікують" desc="Потрібно підтвердити відправлення" action="Переглянути"
                onClick={() => setRoute({ screen: 'transfers' })} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function KpiCard({ label, value, sub, delta, data, sparkColor, sparkFill, icon, iconBg, alertPulse }) {
  return (
    <Card hover className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} relative`}>
          <Icon name={icon} className="w-4 h-4" />
          {alertPulse && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>}
        </div>
        {delta != null && (
          <span className={`text-xs font-semibold ${delta >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded`}>
            <Icon name={delta >= 0 ? 'trending-up' : 'trending-down'} className="w-3 h-3" />
            {fmtPct(delta)}
          </span>
        )}
      </div>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums tracking-tight">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      {data && (
        <div className="mt-3 -mx-1">
          <Sparkline data={data} color={sparkColor} fill={sparkFill} height={40} width={220} />
        </div>
      )}
    </Card>
  );
}

function AlertRow({ icon, tone, title, desc, action, onClick }) {
  const c = accent(tone);
  return (
    <div className="flex items-start gap-3 px-6 py-3.5 hover:bg-slate-50/60 group">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: c.bg, color: c.fg }}>
        <Icon name={icon} className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
      {action && <button onClick={onClick} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity">{action}</button>}
    </div>
  );
}

// ============== SHOPS LIST ==============
function ShopsScreen({ data, setRoute, openModal }) {
  const [view, setView] = useState('grid');
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('Усі регіони');
  const [status, setStatus] = useState('Усі');

  const regions = ['Усі регіони', ...Array.from(new Set(data.shops.map(s => s.region)))];
  const filtered = data.shops.filter(s => {
    if (q && !(s.name.toLowerCase().includes(q.toLowerCase()) || s.address.toLowerCase().includes(q.toLowerCase()))) return false;
    if (region !== 'Усі регіони' && s.region !== region) return false;
    if (status === 'Відкриті' && s.status !== 'open') return false;
    if (status === 'Закриті' && s.status === 'open') return false;
    return true;
  });

  return (
    <>
      <TopBar
        title="Магазини"
        subtitle={<Badge tone="slate">{data.shops.length} всього</Badge>}
        actions={<>
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}><Icon name="layout-grid" className="w-4 h-4" /></button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}><Icon name="list" className="w-4 h-4" /></button>
            <button onClick={() => setView('map')} className={`p-1.5 rounded ${view === 'map' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}><Icon name="map" className="w-4 h-4" /></button>
          </div>
          <Button icon="plus" onClick={() => openModal('add-shop')}>Додати магазин</Button>
        </>}
      />

      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* Filters */}
        <Card pad={false} className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <Input icon="search" placeholder="Шукати магазин..." value={q} onChange={e => setQ(e.target.value)} className="flex-1" />
            <Select options={regions} value={region} onChange={setRegion} />
            <Select options={['Усі','Відкриті','Закриті']} value={status} onChange={setStatus} />
            <Button variant="secondary" icon="sliders-horizontal">Фільтри</Button>
          </div>
        </Card>

        {view === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(shop => <ShopCard key={shop.id} shop={shop} data={data} setRoute={setRoute} />)}
          </div>
        )}

        {view === 'list' && (
          <Card pad={false}>
            <ShopsTable shops={filtered} data={data} setRoute={setRoute} />
          </Card>
        )}

        {view === 'map' && (
          <Card pad={false} className="h-[600px] relative overflow-hidden">
            <MapView shops={filtered} setRoute={setRoute} />
          </Card>
        )}

        {filtered.length === 0 && (
          <EmptyState icon="store" title="Магазини не знайдені" desc="Спробуйте змінити фільтри" />
        )}
      </div>
    </>
  );
}

function ShopCard({ shop, data, setRoute }) {
  const c = accent(shop.accent);
  const manager = data.employees.find(e => e.id === shop.manager);
  const staffCount = data.employees.filter(e => e.shopId === shop.id).length;
  const delta = ((shop.revenue - shop.revenueYesterday) / shop.revenueYesterday) * 100;
  return (
    <Card hover pad={false} className="overflow-hidden group cursor-pointer flex flex-col" >
      {/* Header with gradient */}
      <div className="h-24 relative" style={{
        background: `linear-gradient(135deg, ${c.solid} 0%, ${c.fg} 100%)`,
      }}>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}></div>
        <div className="absolute top-3 right-3">
          {shop.status === 'open' ? (
            <span className="bg-white/95 backdrop-blur text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Відкритий
            </span>
          ) : (
            <span className="bg-white/95 backdrop-blur text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Перерва
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-4 text-white">
          <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">{shop.region}</div>
          <div className="text-xs opacity-90 mt-0.5">{shop.hours}</div>
        </div>
        <div className="absolute -bottom-5 right-4 w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center" style={{ color: c.fg }}>
          <Icon name="store" className="w-5 h-5" />
        </div>
      </div>

      <div className="p-5 pt-5 flex-1 flex flex-col">
        <div>
          <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors cursor-pointer text-[15px]" onClick={() => setRoute({ screen: 'shop-detail', shopId: shop.id })}>{shop.name}</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <Icon name="map-pin" className="w-3 h-3" /> {shop.address}, {shop.city}
          </p>
        </div>

        {/* Alert banner if any */}
        {shop.alert && (
          <div className="mt-3 bg-rose-50 text-rose-700 p-2.5 rounded-lg text-xs flex items-start gap-2 border border-rose-100">
            <Icon name="alert-triangle" className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="font-medium">{shop.alert}</span>
          </div>
        )}
        {shop.status === 'break' && (
          <div className="mt-3 bg-amber-50 text-amber-800 p-2.5 rounded-lg text-xs flex items-start gap-2 border border-amber-100">
            <Icon name="clock" className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="font-medium">{shop.breakReason}</span>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 my-4 pt-4 border-t border-slate-100">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Виручка</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">{fmtUAH(shop.revenue)}</div>
            <div className={`text-[11px] font-semibold mt-0.5 inline-flex items-center gap-0.5 ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              <Icon name={delta >= 0 ? 'trending-up' : 'trending-down'} className="w-3 h-3" /> {fmtPct(delta)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Залишки</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">{fmtNum(shop.stockUnits)}</div>
            {shop.stockAlerts > 0 && (
              <div className="text-[11px] text-amber-600 font-semibold mt-0.5">{shop.stockAlerts} SKU нижче норми</div>
            )}
            {shop.stockAlerts === 0 && <div className="text-[11px] text-slate-400 mt-0.5">Все в нормі</div>}
          </div>
        </div>

        {/* Manager */}
        <div className="flex items-center justify-between bg-slate-50 px-3 py-2.5 rounded-lg">
          {manager ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar emp={manager} size="sm" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">{manager.name}</div>
                <div className="text-[10px] text-slate-500">{manager.role}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center">
                <Icon name="user-x" className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-rose-700">Не призначено</div>
                <div className="text-[10px] text-slate-500">Керуючий</div>
              </div>
            </div>
          )}
          <div className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">
            +{staffCount - (manager ? 1 : 0)} люд.
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" onClick={() => setRoute({ screen: 'shop-detail', shopId: shop.id, tab: 'stock' })}>Склад</Button>
          <Button variant="soft" size="sm" onClick={() => setRoute({ screen: 'shop-detail', shopId: shop.id })}>Деталі</Button>
        </div>
      </div>
    </Card>
  );
}

function ShopsTable({ shops, data, setRoute }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-left">
            <th className="px-6 py-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">Магазин</th>
            <th className="px-6 py-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">Керуючий</th>
            <th className="px-6 py-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 text-right">Виручка</th>
            <th className="px-6 py-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 text-right">Залишки</th>
            <th className="px-6 py-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 text-center">Статус</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {shops.map(s => {
            const c = accent(s.accent);
            const m = data.employees.find(e => e.id === s.manager);
            return (
              <tr key={s.id} className="hover:bg-slate-50 cursor-pointer group" onClick={() => setRoute({ screen: 'shop-detail', shopId: s.id })}>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: c.bg, color: c.fg }}>
                      <Icon name="store" className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-700">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.city} · {s.address}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  {m ? <div className="flex items-center gap-2"><Avatar emp={m} size="xs" /><span className="text-slate-700">{m.name}</span></div>
                     : <span className="text-rose-600 text-xs font-medium">Не призначено</span>}
                </td>
                <td className="px-6 py-3.5 text-right tabular-nums font-semibold text-slate-900">{fmtUAH(s.revenue)}</td>
                <td className="px-6 py-3.5 text-right tabular-nums text-slate-700">
                  {fmtNum(s.stockUnits)}
                  {s.stockAlerts > 0 && <div className="text-[11px] text-amber-600 font-semibold">{s.stockAlerts} алертів</div>}
                </td>
                <td className="px-6 py-3.5 text-center">
                  {s.status === 'open' ? <Badge tone="emerald" dot>Відкр.</Badge> : <Badge tone="amber" dot>Перерва</Badge>}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <Icon name="chevron-right" className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 ml-auto" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MapView({ shops, setRoute }) {
  // Abstract stylized "map" — stylized pins on a soft grid background
  const cities = [
    { name: 'Київ',  x: 46, y: 38, count: shops.filter(s => s.city === 'Київ').length },
    { name: 'Львів', x: 18, y: 44, count: shops.filter(s => s.city === 'Львів').length },
    { name: 'Одеса', x: 52, y: 82, count: shops.filter(s => s.city === 'Одеса').length },
  ];
  const positions = {
    'shop-1': { x: 44, y: 34 }, 'shop-2': { x: 48, y: 30 }, 'shop-3': { x: 47, y: 42 },
    'shop-4': { x: 16, y: 42 }, 'shop-5': { x: 20, y: 48 }, 'shop-6': { x: 52, y: 82 },
  };
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-slate-50 to-sky-50/40">
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}></div>
      {/* Fake country outline */}
      <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 10 30 Q 20 20 40 25 T 75 20 L 85 35 L 88 55 L 75 75 L 60 85 L 40 82 L 25 72 L 12 55 Z" fill="rgba(99,102,241,0.04)" stroke="rgba(99,102,241,0.18)" strokeWidth="0.3" strokeDasharray="1 1" />
      </svg>
      {/* City labels */}
      {cities.map(city => (
        <div key={city.name} className="absolute -translate-x-1/2 -translate-y-[140%] pointer-events-none" style={{ left: city.x + '%', top: city.y + '%' }}>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{city.name}</div>
          <div className="text-[10px] text-slate-400">{city.count} магаз.</div>
        </div>
      ))}
      {/* Pins */}
      {shops.map(shop => {
        const pos = positions[shop.id];
        if (!pos) return null;
        const c = accent(shop.accent);
        return (
          <button key={shop.id} onClick={() => setRoute({ screen: 'shop-detail', shopId: shop.id })}
            className="absolute -translate-x-1/2 -translate-y-full group"
            style={{ left: pos.x + '%', top: pos.y + '%' }}>
            <div className="relative">
              <div className="w-10 h-10 rounded-full rounded-br-none flex items-center justify-center text-white shadow-lg rotate-45 transition-transform group-hover:scale-110" style={{ background: c.solid }}>
                <Icon name="store" className="w-4 h-4 -rotate-45" />
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white shadow-lg border border-slate-200 rounded-lg px-3 py-2 min-w-[180px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="text-xs font-bold text-slate-900">{shop.name}</div>
                <div className="text-[11px] text-slate-500">{fmtUAH(shop.revenue)} · {shop.checks} чек.</div>
              </div>
            </div>
          </button>
        );
      })}
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur border border-slate-200 rounded-xl shadow-sm p-3 text-xs">
        <div className="font-bold text-slate-900 mb-2">Карта мережі</div>
        <div className="flex items-center gap-2 text-slate-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Відкриті ({shops.filter(s => s.status === 'open').length})</div>
        <div className="flex items-center gap-2 text-slate-600 mt-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Перерва ({shops.filter(s => s.status === 'break').length})</div>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardScreen, ShopsScreen, ShopCard, KpiCard });
