// Shell: Sidebar, Top Header, Nav state
const { useState: useStateShell } = React;

function Sidebar({ route, setRoute, tweaks }) {
  const compact = tweaks.sidebar === 'compact';
  const items = [
    { key: 'dashboard', icon: 'layout-dashboard', label: 'Дашборд' },
    { key: 'shops',     icon: 'store',            label: 'Магазини' },
    { key: 'staff',     icon: 'users',            label: 'Персонал' },
  ];
  const itemsStock = [
    { key: 'warehouse', icon: 'package',          label: 'Центральний склад' },
    { key: 'transfers', icon: 'truck',            label: 'Переміщення' },
  ];
  const sys = [
    { key: 'settings',  icon: 'settings',         label: 'Налаштування' },
  ];

  const NavItem = ({ item }) => {
    const active = route.screen === item.key || (item.key === 'shops' && route.screen === 'shop-detail');
    return (
      <button
        onClick={() => setRoute({ screen: item.key })}
        title={compact ? item.label : undefined}
        className={`group relative w-full flex items-center ${compact ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm font-medium transition-all
          ${active
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-600 rounded-r"></span>}
        <Icon name={item.icon} className="w-[18px] h-[18px]" />
        {!compact && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  return (
    <aside className={`${compact ? 'w-[68px]' : 'w-[232px]'} shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen transition-all duration-200`}>
      {/* Brand */}
      <div className={`h-16 flex items-center ${compact ? 'justify-center' : 'px-5'} border-b border-slate-100`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-sm shadow-indigo-600/30">
            <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h14l-1.5 9.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5L3 7Z"/>
              <path d="M7 7V5a3 3 0 0 1 6 0v2"/>
            </svg>
          </div>
          {!compact && (
            <div>
              <div className="font-bold text-slate-900 tracking-tight text-[15px] leading-tight">ShopManager</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Retail OS</div>
            </div>
          )}
        </div>
      </div>

      <nav className={`flex-1 overflow-y-auto ${compact ? 'px-2' : 'px-3'} py-4 space-y-1`}>
        {items.map(i => <NavItem key={i.key} item={i} />)}

        <div className={`pt-5 pb-1 ${compact ? 'text-center' : 'px-3'}`}>
          {!compact && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Склад</p>}
          {compact && <div className="h-px bg-slate-100 mx-2"></div>}
        </div>
        {itemsStock.map(i => <NavItem key={i.key} item={i} />)}

        <div className={`pt-5 pb-1 ${compact ? 'text-center' : 'px-3'}`}>
          {!compact && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Система</p>}
          {compact && <div className="h-px bg-slate-100 mx-2"></div>}
        </div>
        {sys.map(i => <NavItem key={i.key} item={i} />)}
      </nav>

      {/* User */}
      <div className={`border-t border-slate-100 ${compact ? 'p-2' : 'p-3'}`}>
        {compact ? (
          <div className="flex justify-center">
            <Avatar emp={{ avatar: 'АА', color: 'indigo', status: 'on' }} size="sm" showStatus />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
            <Avatar emp={{ avatar: 'АА', color: 'indigo', status: 'on' }} size="sm" showStatus />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">Андрій Антонов</div>
              <div className="text-xs text-slate-500 truncate">Адміністратор</div>
            </div>
            <Icon name="chevrons-up-down" className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>
    </aside>
  );
}

function TopBar({ title, subtitle, crumbs, actions, tabs, activeTab, onTabChange, onOpenCommand }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="px-8 pt-5 pb-0">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            {crumbs && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                {crumbs.map((c, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <Icon name="chevron-right" className="w-3 h-3" />}
                    <span className={i === crumbs.length - 1 ? 'text-slate-900 font-medium' : 'hover:text-slate-700 cursor-pointer'} onClick={c.onClick}>{c.label}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{title}</h1>
              {subtitle}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onOpenCommand} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500">
              <Icon name="search" className="w-3.5 h-3.5" />
              <span>Пошук…</span>
              <span className="ml-2 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">⌘K</span>
            </button>
            <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg">
              <Icon name="bell" className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            {actions}
          </div>
        </div>
        {tabs && (
          <div className="flex items-center gap-1 mt-5 -mb-px">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
                  ${activeTab === t.key
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                {t.label}
                {t.count != null && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === t.key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'} tabular-nums`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        {!tabs && <div className="h-5"></div>}
      </div>
    </header>
  );
}

// Command palette (Cmd+K)
function CommandPalette({ open, onClose, setRoute, data }) {
  const [q, setQ] = useState('');
  useEffect(() => { if (open) setQ(''); }, [open]);
  if (!open) return null;
  const all = [
    ...data.shops.map(s => ({ kind: 'Магазин', label: s.name, sub: s.city + ' · ' + s.address, action: () => setRoute({ screen: 'shop-detail', shopId: s.id }), icon: 'store' })),
    ...data.employees.slice(0, 10).map(e => ({ kind: 'Співробітник', label: e.name, sub: e.role, action: () => setRoute({ screen: 'staff' }), icon: 'user' })),
    { kind: 'Сторінка', label: 'Дашборд', sub: 'Огляд мережі', action: () => setRoute({ screen: 'dashboard' }), icon: 'layout-dashboard' },
    { kind: 'Сторінка', label: 'Переміщення', sub: 'Між магазинами', action: () => setRoute({ screen: 'transfers' }), icon: 'truck' },
    { kind: 'Сторінка', label: 'Центральний склад', sub: 'Залишки', action: () => setRoute({ screen: 'warehouse' }), icon: 'package' },
  ];
  const filtered = q ? all.filter(x => (x.label + ' ' + x.sub).toLowerCase().includes(q.toLowerCase())) : all.slice(0, 8);
  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center pt-24 p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Icon name="search" className="w-4 h-4 text-slate-400" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Шукати магазини, співробітників, сторінки..." className="flex-1 text-sm outline-none" />
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">ESC</span>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-500">Нічого не знайдено</div>}
          {filtered.map((r, i) => (
            <button key={i} onClick={() => { r.action(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Icon name={r.icon} className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">{r.label}</div>
                <div className="text-xs text-slate-500 truncate">{r.sub}</div>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">{r.kind}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, TopBar, CommandPalette });
