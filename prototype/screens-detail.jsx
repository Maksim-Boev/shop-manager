// Shop detail, warehouse, staff, transfers screens

// ============== SHOP DETAIL ==============
function ShopDetailScreen({ data, setRoute, route, openModal, toast }) {
  const shop = data.shops.find(s => s.id === route.shopId);
  const [tab, setTab] = useState(route.tab || 'overview');
  useEffect(() => { setTab(route.tab || 'overview'); }, [route.shopId, route.tab]);
  if (!shop) return null;

  const c = accent(shop.accent);
  const manager = data.employees.find(e => e.id === shop.manager);
  const shopEmployees = data.employees.filter(e => e.shopId === shop.id);
  const onShift = shopEmployees.filter(e => e.status === 'on');
  const stockMap = data.stock[shop.id] || {};
  const stockItems = data.products.map(p => ({ ...p, qty: stockMap[p.id] || 0 }));
  const lowStock = stockItems.filter(x => x.qty <= 10 && x.qty > 0);
  const outOfStock = stockItems.filter(x => x.qty === 0);
  const delta = ((shop.revenue - shop.revenueYesterday) / shop.revenueYesterday) * 100;

  const tabs = [
    { key: 'overview', label: 'Огляд' },
    { key: 'stock',    label: 'Склад', count: stockItems.length },
    { key: 'staff',    label: 'Персонал', count: shopEmployees.length },
    { key: 'finance',  label: 'Фінанси' },
  ];

  return (
    <>
      <TopBar
        crumbs={[
          { label: 'Магазини', onClick: () => setRoute({ screen: 'shops' }) },
          { label: shop.name },
        ]}
        title={shop.name}
        subtitle={
          <div className="flex items-center gap-2 flex-wrap">
            {shop.status === 'open' ? <Badge tone="emerald" dot>Відкритий</Badge> : <Badge tone="amber" dot>Перерва</Badge>}
            <span className="text-xs text-slate-500 flex items-center gap-1"><Icon name="map-pin" className="w-3 h-3" />{shop.city}, {shop.address}</span>
            <span className="text-xs text-slate-500 flex items-center gap-1"><Icon name="phone" className="w-3 h-3" />{shop.phone}</span>
            <span className="text-xs text-slate-500 flex items-center gap-1"><Icon name="clock" className="w-3 h-3" />{shop.hours}</span>
          </div>
        }
        actions={<>
          <Button variant="secondary" icon="settings">Налаштування</Button>
          <Button icon="plus" onClick={() => openModal('add-transfer', { toShopId: shop.id })}>Замовити поставку</Button>
        </>}
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
      />

      <div className="p-8 space-y-6 max-w-[1600px]">
        {tab === 'overview' && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10" style={{ background: c.solid }}></div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Виручка сьогодні</div>
                <div className="text-[28px] font-bold text-slate-900 mt-1 tabular-nums">{fmtUAH(shop.revenue)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-semibold inline-flex items-center gap-0.5 ${delta >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-1.5 py-0.5 rounded`}>
                    <Icon name={delta >= 0 ? 'trending-up' : 'trending-down'} className="w-3 h-3" /> {fmtPct(delta)}
                  </span>
                  <span className="text-xs text-slate-500">vs. вчора</span>
                </div>
                <div className="mt-3"><Sparkline data={shop.trend} color={c.solid} fill={c.bg} height={36} width={220} /></div>
              </Card>
              <Card>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Чеки</div>
                <div className="text-[28px] font-bold text-slate-900 mt-1 tabular-nums">{shop.checks}</div>
                <div className="text-xs text-slate-500 mt-2">Середній чек <span className="font-semibold text-slate-700 tabular-nums">{fmtUAH(shop.avgCheck)}</span></div>
              </Card>
              <Card>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Персонал на зміні</div>
                <div className="text-[28px] font-bold text-slate-900 mt-1 tabular-nums">{onShift.length} <span className="text-xl text-slate-400 font-normal">/ {shop.staffTotal}</span></div>
                <div className="flex -space-x-1.5 mt-2">
                  {onShift.slice(0,5).map(e => <Avatar key={e.id} emp={e} size="xs" ring />)}
                  {onShift.length > 5 && <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">+{onShift.length-5}</div>}
                </div>
              </Card>
              <Card className={shop.stockAlerts > 0 ? 'ring-1 ring-amber-200' : ''}>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Складські алерти</div>
                  {shop.stockAlerts > 0 && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>}
                </div>
                <div className="text-[28px] font-bold text-slate-900 mt-1 tabular-nums">{shop.stockAlerts + outOfStock.length}</div>
                <div className="text-xs mt-2">
                  {outOfStock.length > 0 && <span className="text-rose-600 font-semibold">{outOfStock.length} немає · </span>}
                  <span className="text-amber-600 font-semibold">{lowStock.length} закінч.</span>
                </div>
              </Card>
            </div>

            {/* Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Low stock inventory preview */}
              <Card className="lg:col-span-2" pad={false}>
                <div className="flex items-center justify-between p-5 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="font-bold text-slate-900">Потребують поповнення</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{lowStock.length + outOfStock.length} товарів · сортовано за пріоритетом</p>
                  </div>
                  <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => setTab('stock')}>Весь склад</Button>
                </div>
                <div className="divide-y divide-slate-100">
                  {[...outOfStock, ...lowStock].slice(0, 6).map(item => {
                    const warehouseQty = data.warehouse[item.id] || 0;
                    const level = stockLevel(item.qty);
                    return (
                      <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/60 group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                          <Icon name="package" className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{item.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span className="font-mono">{item.sku}</span>
                            <span>·</span>
                            <span>{item.category}</span>
                            <span>·</span>
                            <span>{item.unit}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold tabular-nums ${item.qty === 0 ? 'text-rose-600' : 'text-amber-600'}`}>{item.qty} шт.</div>
                          <div className="text-[10px] text-slate-400">на складі ЦХ: {warehouseQty}</div>
                        </div>
                        <Badge tone={level.tone} dot>{level.label}</Badge>
                        <Button size="sm" variant="soft" icon="truck" onClick={() => openModal('add-transfer', { toShopId: shop.id, productId: item.id })}>Замовити</Button>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Staff on shift */}
              <Card pad={false}>
                <div className="flex items-center justify-between p-5 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="font-bold text-slate-900">На зміні зараз</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{onShift.length} з {shop.staffTotal} співробітників</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setTab('staff')}>Графік</Button>
                </div>
                <div className="p-4 space-y-1">
                  {shopEmployees.map(e => (
                    <div key={e.id} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 ${e.status !== 'on' ? 'opacity-50' : ''}`}>
                      <Avatar emp={e} size="sm" showStatus />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{e.name}</div>
                        <div className="text-xs text-slate-500">{e.role} · {e.shift}</div>
                      </div>
                      <button className="text-slate-300 hover:text-slate-600"><Icon name="more-horizontal" className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => openModal('add-staff', { shopId: shop.id })} className="w-full mt-2 border border-dashed border-slate-300 rounded-lg py-2.5 text-xs font-semibold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 flex items-center justify-center gap-2 transition-colors">
                    <Icon name="user-plus" className="w-3.5 h-3.5" /> Призначити співробітника
                  </button>
                </div>
              </Card>
            </div>

            {/* Promo card */}
            <Card pad={false} className="relative overflow-hidden" >
              <div className="grid grid-cols-1 md:grid-cols-5">
                <div className="md:col-span-3 p-6 relative z-10">
                  <Badge tone="indigo">Швидка дія</Badge>
                  <h3 className="text-xl font-bold text-slate-900 mt-3">Оптимізуйте залишки одним кліком</h3>
                  <p className="text-sm text-slate-600 mt-1 max-w-md">Система проаналізує темп продажу за 7 днів і створить накладну на поставку з центрального складу.</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Button icon="zap" onClick={() => toast({ title: 'Рекомендації готові', desc: 'Створено 2 чернетки накладних' })}>Автозамовлення</Button>
                    <Button variant="ghost">Переглянути звіт</Button>
                  </div>
                </div>
                <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50 hidden md:block">
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'radial-gradient(circle at 30% 40%, #818CF8 1px, transparent 2px)',
                    backgroundSize: '24px 24px',
                  }}></div>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-lg border border-slate-200 p-4 w-60">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><Icon name="sparkles" className="w-3.5 h-3.5" /></div>
                      <div className="text-xs font-bold text-slate-900">AI прогноз</div>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">Закінчаться протягом 3 днів:</div>
                    <div className="space-y-1.5">
                      {lowStock.slice(0,3).map(it => (
                        <div key={it.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 truncate">{it.name.split(' ').slice(0,2).join(' ')}</span>
                          <span className="font-bold text-rose-600 tabular-nums">{it.qty} шт.</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {tab === 'stock' && <StockTable items={stockItems} data={data} shop={shop} openModal={openModal} />}

        {tab === 'staff' && <StaffSection shop={shop} employees={shopEmployees} data={data} openModal={openModal} />}

        {tab === 'finance' && <FinanceSection shop={shop} />}
      </div>
    </>
  );
}

function StockTable({ items, data, shop, openModal }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Усі категорії');
  const [onlyLow, setOnlyLow] = useState(false);
  const cats = ['Усі категорії', ...data.categories];
  const filtered = items.filter(i => {
    if (q && !i.name.toLowerCase().includes(q.toLowerCase()) && !i.sku.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat !== 'Усі категорії' && i.category !== cat) return false;
    if (onlyLow && i.qty > 10) return false;
    return true;
  });
  const totalValue = filtered.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <Card pad={false}>
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-5 border-b border-slate-100">
        <div className="flex-1 flex flex-col md:flex-row gap-3">
          <Input icon="search" placeholder="Пошук за назвою або артикулом..." value={q} onChange={e => setQ(e.target.value)} className="md:w-80" />
          <Select options={cats} value={cat} onChange={setCat} />
          <button onClick={() => setOnlyLow(v => !v)} className={`px-3 py-2 text-sm rounded-lg border transition-colors ${onlyLow ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Icon name="alert-triangle" className="w-4 h-4 inline mr-1.5" />
            Низькі залишки
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Вартість залишків</div>
            <div className="text-sm font-bold text-slate-900 tabular-nums">{fmtUAH(totalValue)}</div>
          </div>
          <Button variant="secondary" icon="download" size="sm">Експорт</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left">Товар</th>
              <th className="px-5 py-3 text-left">Категорія</th>
              <th className="px-5 py-3 text-right">В магазині</th>
              <th className="px-5 py-3 text-right">Центр. склад</th>
              <th className="px-5 py-3 text-right">Ціна</th>
              <th className="px-5 py-3 text-center">Статус</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(item => {
              const whQty = data.warehouse[item.id] || 0;
              const level = stockLevel(item.qty);
              return (
                <tr key={item.id} className={`hover:bg-slate-50/60 group ${item.qty === 0 ? 'bg-rose-50/30' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <Icon name="package" className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="font-mono">{item.sku}</span>
                          <span>·</span><span>{item.unit}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 text-sm">{item.category}</td>
                  <td className={`px-5 py-3 text-right font-semibold tabular-nums ${item.qty === 0 ? 'text-rose-600' : item.qty <= 10 ? 'text-amber-600' : 'text-slate-900'}`}>{item.qty} шт.</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-600">{whQty} шт.</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-900 font-medium">{fmtUAH(item.price)}</td>
                  <td className="px-5 py-3 text-center"><Badge tone={level.tone} dot>{level.label}</Badge></td>
                  <td className="px-5 py-3 text-right opacity-0 group-hover:opacity-100 transition">
                    <Button size="sm" variant="soft" icon="truck" onClick={() => openModal('add-transfer', { toShopId: shop.id, productId: item.id })}>Замовити</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Показано {filtered.length} з {items.length} SKU</span>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 hover:bg-slate-100 rounded">‹</button>
          <span className="px-2">1 / 1</span>
          <button className="px-2 py-1 hover:bg-slate-100 rounded">›</button>
        </div>
      </div>
    </Card>
  );
}

function StaffSection({ shop, employees, data, openModal }) {
  const hours = ['08','09','10','11','12','13','14','15','16','17','18','19','20','21','22'];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2" pad={false}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900">Графік змін — 18 квітня</h2>
            <p className="text-xs text-slate-500 mt-0.5">{employees.filter(e=>e.status==='on').length} на зміні</p>
          </div>
          <Button size="sm" variant="secondary" icon="calendar">Тиждень</Button>
        </div>
        <div className="p-5 overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex">
              <div className="w-40 shrink-0"></div>
              <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}>
                {hours.map(h => <div key={h} className="text-[10px] text-slate-400 text-center tabular-nums">{h}</div>)}
              </div>
            </div>
            <div className="mt-2 space-y-2">
              {employees.map(e => {
                const match = e.shift.match(/(\d{2}):00\s*[–-]\s*(\d{2}):00/);
                const start = match ? parseInt(match[1]) : null;
                const end = match ? parseInt(match[2]) : null;
                const c = accent(e.color);
                return (
                  <div key={e.id} className="flex items-center">
                    <div className="w-40 shrink-0 flex items-center gap-2 pr-3">
                      <Avatar emp={e} size="sm" showStatus />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">{e.name}</div>
                        <div className="text-[10px] text-slate-500">{e.role}</div>
                      </div>
                    </div>
                    <div className="flex-1 relative h-7 bg-slate-50 rounded-md">
                      {start != null && end != null && (
                        <div className="absolute top-0 bottom-0 rounded-md flex items-center px-2 text-[10px] font-semibold text-white"
                          style={{
                            left: ((start - 8) / (hours.length)) * 100 + '%',
                            width: ((end - start) / (hours.length)) * 100 + '%',
                            background: `linear-gradient(90deg, ${c.solid}, ${c.fg})`,
                          }}>
                          {e.shift}
                        </div>
                      )}
                      {start == null && (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">{e.shift}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
      <Card pad={false}>
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Керування персоналом</h2>
          <p className="text-xs text-slate-500 mt-0.5">Швидкі дії</p>
        </div>
        <div className="p-4 space-y-1">
          <QuickAction icon="user-plus" label="Призначити зміну" onClick={() => openModal('add-staff', { shopId: shop.id })} />
          <QuickAction icon="calendar-plus" label="Створити графік на тиждень" />
          <QuickAction icon="file-text" label="Звіт по відпрацьованому часу" />
          <QuickAction icon="message-circle" label="Повідомити команду" />
        </div>
      </Card>
    </div>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-left group">
      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-100"><Icon name={icon} className="w-4 h-4" /></div>
      <div className="flex-1 text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</div>
      <Icon name="chevron-right" className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
    </button>
  );
}

function FinanceSection({ shop }) {
  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];
  const weekData = [32400, 38900, 42100, 35800, shop.revenue, 52300, 48700];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-slate-900">Виручка за тиждень</h2>
            <p className="text-xs text-slate-500 mt-0.5">Сумарно: {fmtUAH(weekData.reduce((s,x)=>s+x,0))}</p>
          </div>
        </div>
        <BarChart data={weekData} labels={days} height={220} color="#4F46E5" accent="#C7D2FE" />
      </Card>
      <Card>
        <h3 className="font-bold text-slate-900 mb-4">Розбивка сьогодні</h3>
        <div className="space-y-3">
          {[
            { label: 'Готівка',      val: shop.revenue * 0.32, pct: 32, tone: 'emerald' },
            { label: 'Картка',       val: shop.revenue * 0.58, pct: 58, tone: 'indigo' },
            { label: 'Apple/Google', val: shop.revenue * 0.10, pct: 10, tone: 'sky' },
          ].map(row => (
            <div key={row.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 font-medium">{row.label}</span>
                <span className="text-slate-500 tabular-nums">{fmtUAH(row.val)} · {row.pct}%</span>
              </div>
              <Progress value={row.pct} color={row.tone} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============== CENTRAL WAREHOUSE ==============
function WarehouseScreen({ data, openModal }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Усі категорії');
  const cats = ['Усі категорії', ...data.categories];
  const items = data.products.map(p => {
    const whQty = data.warehouse[p.id] || 0;
    const shopTotal = data.shops.reduce((s, shop) => s + ((data.stock[shop.id] || {})[p.id] || 0), 0);
    return { ...p, whQty, shopTotal, totalQty: whQty + shopTotal, totalValue: (whQty + shopTotal) * p.price };
  });
  const filtered = items.filter(i => {
    if (q && !i.name.toLowerCase().includes(q.toLowerCase()) && !i.sku.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat !== 'Усі категорії' && i.category !== cat) return false;
    return true;
  });
  const totalValue = filtered.reduce((s, i) => s + i.totalValue, 0);

  return (
    <>
      <TopBar
        title="Центральний склад"
        subtitle={<Badge tone="indigo">{fmtNum(filtered.length)} SKU · {fmtUAH(totalValue)}</Badge>}
        actions={<>
          <Button variant="secondary" icon="upload">Імпорт</Button>
          <Button icon="plus" onClick={() => openModal('add-product')}>Новий товар</Button>
        </>}
      />
      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="SKU в каталозі" value={fmtNum(data.products.length)} icon="package" iconBg="bg-indigo-50 text-indigo-600" />
          <KpiCard label="Вартість залишків" value={fmtUAH(totalValue)} icon="coins" iconBg="bg-emerald-50 text-emerald-600" />
          <KpiCard label="На центр. складі" value={fmtNum(Object.values(data.warehouse).reduce((s,v)=>s+v,0))} icon="warehouse" iconBg="bg-sky-50 text-sky-600" sub="Одиниць" />
          <KpiCard label="В дорозі" value={data.transfers.filter(t => t.status === 'in-transit').length} icon="truck" iconBg="bg-amber-50 text-amber-600" sub="Активних накладних" />
        </div>

        <Card pad={false}>
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-5 border-b border-slate-100">
            <div className="flex-1 flex flex-col md:flex-row gap-3">
              <Input icon="search" placeholder="Пошук товару..." value={q} onChange={e => setQ(e.target.value)} className="md:w-80" />
              <Select options={cats} value={cat} onChange={setCat} />
            </div>
            <Button variant="secondary" icon="download" size="sm">Експорт CSV</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Товар</th>
                  <th className="px-5 py-3 text-left">Категорія</th>
                  <th className="px-5 py-3 text-right">Центр. склад</th>
                  <th className="px-5 py-3 text-right">В магазинах</th>
                  <th className="px-5 py-3 text-right">Разом</th>
                  <th className="px-5 py-3 text-right">Вартість</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center text-slate-400"><Icon name="package" className="w-4 h-4" /></div>
                        <div>
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-500"><span className="font-mono">{item.sku}</span> · {item.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{item.category}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-slate-900">{item.whQty}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">{item.shopTotal}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-900 font-bold">{item.totalQty}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-900">{fmtUAH(item.totalValue)}</td>
                    <td className="px-5 py-3 text-right opacity-0 group-hover:opacity-100">
                      <Button size="sm" variant="ghost" icon="truck" onClick={() => openModal('add-transfer', { productId: item.id })}>Перемістити</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

// ============== STAFF SCREEN ==============
function StaffScreen({ data, openModal }) {
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('Усі ролі');
  const [shopFilter, setShopFilter] = useState('all');
  const roles = ['Усі ролі', ...Array.from(new Set(data.employees.map(e => e.role)))];
  const shopOpts = [{ value: 'all', label: 'Усі магазини' }, { value: 'unassigned', label: 'Без призначення' }, ...data.shops.map(s => ({ value: s.id, label: s.name }))];
  const filtered = data.employees.filter(e => {
    if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (roleFilter !== 'Усі ролі' && e.role !== roleFilter) return false;
    if (shopFilter === 'unassigned' && e.shopId) return false;
    if (shopFilter !== 'all' && shopFilter !== 'unassigned' && e.shopId !== shopFilter) return false;
    return true;
  });

  return (
    <>
      <TopBar
        title="Персонал"
        subtitle={<Badge tone="slate">{data.employees.length} людей · {data.employees.filter(e=>e.status==='on').length} на зміні</Badge>}
        actions={<Button icon="user-plus" onClick={() => openModal('add-staff')}>Додати співробітника</Button>}
      />
      <div className="p-8 space-y-6 max-w-[1600px]">
        <Card pad={false} className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <Input icon="search" placeholder="Шукати співробітника..." value={q} onChange={e => setQ(e.target.value)} className="flex-1" />
            <Select options={roles} value={roleFilter} onChange={setRoleFilter} />
            <Select options={shopOpts} value={shopFilter} onChange={setShopFilter} />
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(e => {
            const shop = data.shops.find(s => s.id === e.shopId);
            const c = accent(e.color);
            return (
              <Card key={e.id} hover className="relative">
                <div className="flex items-start gap-4">
                  <Avatar emp={e} size="lg" showStatus />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-slate-900 truncate">{e.name}</div>
                    <div className="text-xs text-slate-500">{e.role}</div>
                    <div className="mt-2 flex items-center gap-2">
                      {e.status === 'on' ? <Badge tone="emerald" dot>На зміні</Badge> : <Badge tone="slate">Поза зміною</Badge>}
                    </div>
                  </div>
                  <button className="text-slate-300 hover:text-slate-600"><Icon name="more-horizontal" className="w-4 h-4" /></button>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Магазин</div>
                    <div className="text-slate-900 font-semibold mt-0.5">{shop ? shop.name : <span className="text-rose-600">Не призначено</span>}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Зміна</div>
                    <div className="text-slate-900 font-semibold mt-0.5 tabular-nums">{e.shift}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ============== TRANSFERS ==============
function TransfersScreen({ data, setRoute, openModal, toast }) {
  const [tab, setTab] = useState('all');
  const tabs = [
    { key: 'all', label: 'Усі', count: data.transfers.length },
    { key: 'pending', label: 'Очікують', count: data.transfers.filter(t => t.status === 'pending').length },
    { key: 'in-transit', label: 'В дорозі', count: data.transfers.filter(t => t.status === 'in-transit').length },
    { key: 'delivered', label: 'Доставлені', count: data.transfers.filter(t => t.status === 'delivered').length },
  ];
  const filtered = tab === 'all' ? data.transfers : data.transfers.filter(t => t.status === tab);

  const resolveName = (ref) => ref === 'warehouse' ? 'Центральний склад' : (data.shops.find(s => s.id === ref)?.name || ref);

  return (
    <>
      <TopBar
        title="Переміщення"
        subtitle={<Badge tone="slate">{data.transfers.length} накладних</Badge>}
        actions={<Button icon="plus" onClick={() => openModal('add-transfer')}>Нова накладна</Button>}
        tabs={tabs} activeTab={tab} onTabChange={setTab}
      />
      <div className="p-8 space-y-6 max-w-[1600px]">
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">№ / Дата</th>
                  <th className="px-5 py-3 text-left">Маршрут</th>
                  <th className="px-5 py-3 text-left">Позицій</th>
                  <th className="px-5 py-3 text-right">К-сть</th>
                  <th className="px-5 py-3 text-center">Статус</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(t => {
                  const toneMap = { pending: 'amber', 'in-transit': 'indigo', delivered: 'emerald' };
                  const labelMap = { pending: 'Очікує', 'in-transit': 'В дорозі', delivered: 'Доставлено' };
                  const iconMap  = { pending: 'clock', 'in-transit': 'truck', delivered: 'check-circle-2' };
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 group">
                      <td className="px-5 py-3">
                        <div className="font-mono text-xs text-slate-500 uppercase">{t.id}</div>
                        <div className="text-xs text-slate-500 mt-0.5 tabular-nums">{t.createdAt}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-slate-900">{resolveName(t.from)}</span>
                          <Icon name="arrow-right" className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-900">{resolveName(t.to)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{t.items.length} товарів</td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold text-slate-900">{t.total} шт.</td>
                      <td className="px-5 py-3 text-center"><Badge tone={toneMap[t.status]} icon={iconMap[t.status]}>{labelMap[t.status]}</Badge></td>
                      <td className="px-5 py-3 text-right opacity-0 group-hover:opacity-100">
                        {t.status === 'pending' && <Button size="sm" variant="soft" onClick={() => toast({ title: 'Накладна підтверджена', desc: t.id })}>Підтвердити</Button>}
                        {t.status === 'in-transit' && <Button size="sm" variant="soft" onClick={() => toast({ title: 'Позначено як доставлене', desc: t.id })}>Прийняти</Button>}
                        {t.status === 'delivered' && <Button size="sm" variant="ghost">Деталі</Button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function SettingsScreen() {
  return (
    <>
      <TopBar title="Налаштування" />
      <div className="p-8 max-w-3xl">
        <Card>
          <EmptyState icon="settings" title="Розділ у розробці" desc="Тут будуть налаштування інтеграцій, ролей та сповіщень." />
        </Card>
      </div>
    </>
  );
}

Object.assign(window, { ShopDetailScreen, WarehouseScreen, StaffScreen, TransfersScreen, SettingsScreen });
