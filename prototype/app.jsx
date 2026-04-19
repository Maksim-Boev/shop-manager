// Main app — routing, state, tweaks

function App() {
  const data = window.APP_DATA;
  const [route, setRoute] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sm.route')) || { screen: 'dashboard' }; }
    catch { return { screen: 'dashboard' }; }
  });
  useEffect(() => { localStorage.setItem('sm.route', JSON.stringify(route)); }, [route]);

  const [modal, setModal] = useState(null); // {type, props}
  const [cmdOpen, setCmdOpen] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [tweaks, setTweaks] = useState(() => window.TWEAK_DEFAULTS || { density: 'comfortable', sidebar: 'full', accent: 'indigo' });

  const toastRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(v => !v); }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Edit mode integration
  useEffect(() => {
    const handler = (ev) => {
      if (ev.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (ev.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const updateTweak = (key, value) => {
    setTweaks(prev => {
      const next = { ...prev, [key]: value };
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: value } }, '*');
      return next;
    });
  };

  const openModal = (type, props = {}) => setModal({ type, props });
  const closeModal = () => setModal(null);

  return (
    <TweaksCtx.Provider value={{ tweaks, updateTweak }}>
      <ToastProvider>
        <ToastConsumer toastRef={toastRef} />
        <div className={`flex h-screen overflow-hidden bg-slate-50 ${tweaks.density === 'compact' ? 'density-compact' : ''}`} style={{ '--accent': ACCENT_MAP[tweaks.accent]?.solid || '#4F46E5' }}>
          <Sidebar route={route} setRoute={setRoute} tweaks={tweaks} />
          <main className="flex-1 flex flex-col overflow-y-auto" data-screen-label={route.screen}>
            {route.screen === 'dashboard'   && <DashboardScreen data={data} setRoute={setRoute} openModal={openModal} />}
            {route.screen === 'shops'       && <ShopsScreen data={data} setRoute={setRoute} openModal={openModal} />}
            {route.screen === 'shop-detail' && <ShopDetailScreen data={data} setRoute={setRoute} route={route} openModal={openModal} toast={(t) => toastRef.current?.(t)} />}
            {route.screen === 'warehouse'   && <WarehouseScreen data={data} openModal={openModal} />}
            {route.screen === 'transfers'   && <TransfersScreen data={data} setRoute={setRoute} openModal={openModal} toast={(t) => toastRef.current?.(t)} />}
            {route.screen === 'staff'       && <StaffScreen data={data} openModal={openModal} />}
            {route.screen === 'settings'    && <SettingsScreen />}
          </main>
        </div>

        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} setRoute={setRoute} data={data} />

        {/* Modals */}
        <Modal open={modal?.type === 'add-shop'} onClose={closeModal} title="Новий магазин" subtitle="Заповніть основну інформацію — решту можна додати пізніше" size="lg">
          {modal?.type === 'add-shop' && <AddShopForm onClose={closeModal} toast={(t) => toastRef.current?.(t)} />}
        </Modal>
        <Modal open={modal?.type === 'add-product'} onClose={closeModal} title="Новий товар" subtitle="Додайте SKU до каталогу" size="lg">
          {modal?.type === 'add-product' && <AddProductForm onClose={closeModal} toast={(t) => toastRef.current?.(t)} data={data} />}
        </Modal>
        <Modal open={modal?.type === 'add-staff'} onClose={closeModal} title="Новий співробітник" subtitle="Створити профіль і призначити на зміну" size="lg">
          {modal?.type === 'add-staff' && <AddStaffForm onClose={closeModal} toast={(t) => toastRef.current?.(t)} data={data} preShopId={modal.props?.shopId} />}
        </Modal>
        <Modal open={modal?.type === 'add-transfer'} onClose={closeModal} title="Нова накладна" subtitle="Переміщення між магазинами або з центрального складу" size="lg">
          {modal?.type === 'add-transfer' && <AddTransferForm onClose={closeModal} toast={(t) => toastRef.current?.(t)} data={data} preToShopId={modal.props?.toShopId} preProductId={modal.props?.productId} />}
        </Modal>

        {/* Tweaks panel */}
        {tweaksOpen && <TweaksPanel tweaks={tweaks} updateTweak={updateTweak} onClose={() => setTweaksOpen(false)} />}
      </ToastProvider>
    </TweaksCtx.Provider>
  );
}

function ToastConsumer({ toastRef }) {
  const t = useToast();
  useEffect(() => { toastRef.current = t.push; }, [t, toastRef]);
  return null;
}

function TweaksPanel({ tweaks, updateTweak, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-[slideUp_.2s_ease-out]">
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="sliders-horizontal" className="w-4 h-4" />
          <div className="text-sm font-bold">Tweaks</div>
        </div>
        <button onClick={onClose} className="hover:bg-white/10 rounded p-1"><Icon name="x" className="w-4 h-4" /></button>
      </div>
      <div className="p-4 space-y-5">
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Акцентний колір</div>
          <div className="flex gap-2">
            {['indigo','violet','emerald','sky','rose','amber'].map(a => (
              <button key={a} onClick={() => updateTweak('accent', a)}
                className={`w-8 h-8 rounded-full transition-all ${tweaks.accent === a ? 'ring-2 ring-offset-2 ring-slate-300 scale-110' : ''}`}
                style={{ background: ACCENT_MAP[a].solid }} title={a}></button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Сайдбар</div>
          <div className="grid grid-cols-2 gap-2">
            <TweakOption active={tweaks.sidebar === 'full'} onClick={() => updateTweak('sidebar', 'full')}>Широкий</TweakOption>
            <TweakOption active={tweaks.sidebar === 'compact'} onClick={() => updateTweak('sidebar', 'compact')}>Компактний</TweakOption>
          </div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Щільність</div>
          <div className="grid grid-cols-2 gap-2">
            <TweakOption active={tweaks.density === 'comfortable'} onClick={() => updateTweak('density', 'comfortable')}>Комфортна</TweakOption>
            <TweakOption active={tweaks.density === 'compact'} onClick={() => updateTweak('density', 'compact')}>Щільна</TweakOption>
          </div>
        </div>
      </div>
    </div>
  );
}

function TweakOption({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{children}</button>
  );
}

// Mount
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
