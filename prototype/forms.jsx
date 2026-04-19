// Forms — add shop / product / staff / transfer

function AddShopForm({ onClose, toast }) {
  const [form, setForm] = useState({ name: '', address: '', city: 'Київ', phone: '', area: '', manager: '' });
  const [saving, setSaving] = useState(false);
  const submit = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: 'Магазин створено', desc: form.name || 'Новий магазин' });
      onClose();
    }, 600);
  };
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Назва магазину" placeholder="Наприклад: АТБ Дарниця" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="md:col-span-2" />
        <Input label="Адреса" icon="map-pin" placeholder="Вулиця, будинок" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="md:col-span-2" />
        <Select label="Місто" options={['Київ','Львів','Одеса','Харків','Дніпро']} value={form.city} onChange={v => setForm({...form, city: v})} />
        <Input label="Телефон точки" placeholder="+380..." value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
        <Input label="Площа, м²" type="number" placeholder="0" value={form.area} onChange={e => setForm({...form, area: e.target.value})} />
        <Select label="Керуючий" options={[{value:'',label:'Виберіть пізніше'},{value:'14',label:'Ірина Волошин (Консультант)'},{value:'15',label:'Андрій Козак (Менеджер)'}]} value={form.manager} onChange={v => setForm({...form, manager: v})} />
      </div>
      <div className="mt-5 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><Icon name="sparkles" className="w-4 h-4" /></div>
        <div className="text-sm">
          <div className="font-semibold text-indigo-900">Пустий склад створюється автоматично</div>
          <div className="text-xs text-indigo-700 mt-0.5">Після створення ви зможете поповнити його через накладну з центрального складу.</div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Скасувати</Button>
        <Button onClick={submit} disabled={saving || !form.name || !form.address} icon={saving ? undefined : 'check'}>
          {saving ? 'Створення...' : 'Створити магазин'}
        </Button>
      </div>
    </>
  );
}

function AddProductForm({ onClose, toast, data }) {
  const [form, setForm] = useState({ name: '', sku: '', category: data.categories[0], price: '', cost: '', unit: '', brand: '' });
  const submit = () => {
    toast({ title: 'Товар додано', desc: form.name });
    onClose();
  };
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Назва товару" placeholder="Наприклад: Молоко Яготинське 2.5%" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="md:col-span-2" />
        <Input label="Артикул / SKU" placeholder="ML-0099" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
        <Select label="Категорія" options={data.categories} value={form.category} onChange={v => setForm({...form, category: v})} />
        <Input label="Бренд" placeholder="Бренд товару" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
        <Input label="Одиниця / упаковка" placeholder="1 л, 500 г..." value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
        <Input label="Ціна продажу, ₴" type="number" placeholder="0.00" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
        <Input label="Закупівельна ціна, ₴" type="number" placeholder="0.00" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Скасувати</Button>
        <Button onClick={submit} disabled={!form.name || !form.sku} icon="check">Створити товар</Button>
      </div>
    </>
  );
}

function AddStaffForm({ onClose, toast, data, preShopId }) {
  const [form, setForm] = useState({ name: '', role: 'Касир', shopId: preShopId || '', shift: '08:00 – 16:00', phone: '' });
  const submit = () => {
    toast({ title: 'Співробітника створено', desc: form.name });
    onClose();
  };
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="ПІБ" placeholder="Прізвище Ім'я" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="md:col-span-2" />
        <Select label="Роль" options={['Керуючий','Касир','Консультант','Комірник','Менеджер']} value={form.role} onChange={v => setForm({...form, role: v})} />
        <Input label="Телефон" placeholder="+380..." value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
        <Select label="Магазин"
          options={[{value:'',label:'Без призначення'}, ...data.shops.map(s => ({value: s.id, label: s.name}))]}
          value={form.shopId} onChange={v => setForm({...form, shopId: v})} />
        <Select label="Зміна" options={['08:00 – 16:00','09:00 – 17:00','10:00 – 18:00','14:00 – 22:00','Без призначення']} value={form.shift} onChange={v => setForm({...form, shift: v})} />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Скасувати</Button>
        <Button onClick={submit} disabled={!form.name} icon="check">Створити</Button>
      </div>
    </>
  );
}

function AddTransferForm({ onClose, toast, data, preToShopId, preProductId }) {
  const [from, setFrom] = useState('warehouse');
  const [to, setTo] = useState(preToShopId || data.shops[0].id);
  const [items, setItems] = useState(preProductId ? [{ productId: preProductId, qty: 10 }] : [{ productId: data.products[0].id, qty: 1 }]);
  const [q, setQ] = useState('');

  const addItem = (productId) => {
    if (items.find(i => i.productId === productId)) return;
    setItems([...items, { productId, qty: 1 }]);
  };
  const updateQty = (productId, qty) => setItems(items.map(i => i.productId === productId ? { ...i, qty: Math.max(1, parseInt(qty) || 1) } : i));
  const removeItem = (productId) => setItems(items.filter(i => i.productId !== productId));
  const available = (productId) => from === 'warehouse' ? (data.warehouse[productId] || 0) : ((data.stock[from] || {})[productId] || 0);

  const filteredProducts = data.products.filter(p => {
    if (items.find(i => i.productId === p.id)) return false;
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).slice(0, 6);

  const totalUnits = items.reduce((s, i) => s + i.qty, 0);
  const totalValue = items.reduce((s, i) => {
    const p = data.products.find(x => x.id === i.productId);
    return s + (p ? p.price * i.qty : 0);
  }, 0);

  const submit = () => {
    toast({ title: 'Накладну створено', desc: `${items.length} товарів · ${totalUnits} шт.` });
    onClose();
  };

  const fromOptions = [{ value: 'warehouse', label: 'Центральний склад' }, ...data.shops.map(s => ({ value: s.id, label: s.name }))];
  const toOptions = data.shops.filter(s => s.id !== from).map(s => ({ value: s.id, label: s.name }));

  return (
    <>
      {/* Route selector */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end mb-5">
        <Select label="Звідки" options={fromOptions} value={from} onChange={setFrom} />
        <div className="pb-2 text-slate-400 hidden md:block"><Icon name="arrow-right" className="w-5 h-5" /></div>
        <Select label="Куди" options={toOptions} value={to} onChange={setTo} />
      </div>

      {/* Items */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Позиції ({items.length})</div>
          <div className="text-xs text-slate-500 tabular-nums">Всього: <span className="font-semibold text-slate-900">{totalUnits} шт.</span> · {fmtUAH(totalValue)}</div>
        </div>
        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
          {items.map(i => {
            const p = data.products.find(x => x.id === i.productId);
            const avail = available(i.productId);
            const over = i.qty > avail;
            return (
              <div key={i.productId} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-400"><Icon name="package" className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
                  <div className="text-[11px] text-slate-500 flex gap-2"><span className="font-mono">{p.sku}</span><span>Доступно: <span className={over ? 'text-rose-600 font-semibold' : 'text-slate-700'}>{avail} шт.</span></span></div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(i.productId, i.qty - 1)} className="w-7 h-7 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">–</button>
                  <input type="number" value={i.qty} onChange={e => updateQty(i.productId, e.target.value)} className={`w-14 text-center text-sm py-1 border rounded-md outline-none tabular-nums font-semibold ${over ? 'border-rose-300 text-rose-600' : 'border-slate-200'}`} />
                  <button onClick={() => updateQty(i.productId, i.qty + 1)} className="w-7 h-7 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">+</button>
                </div>
                <button onClick={() => removeItem(i.productId)} className="text-slate-300 hover:text-rose-500"><Icon name="trash-2" className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>
        {/* Add item */}
        <div className="p-3 bg-slate-50/60 border-t border-slate-200">
          <Input icon="search" placeholder="Додати товар до накладної..." value={q} onChange={e => setQ(e.target.value)} />
          {q && filteredProducts.length > 0 && (
            <div className="mt-2 space-y-1 max-h-36 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-sm">
              {filteredProducts.map(p => (
                <button key={p.id} onClick={() => { addItem(p.id); setQ(''); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left">
                  <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-400"><Icon name="package" className="w-3.5 h-3.5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{p.sku} · Доступно: {available(p.id)}</div>
                  </div>
                  <Icon name="plus" className="w-4 h-4 text-indigo-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Скасувати</Button>
        <Button onClick={submit} disabled={items.length === 0 || from === to} icon="truck">Створити накладну</Button>
      </div>
    </>
  );
}

Object.assign(window, { AddShopForm, AddProductForm, AddStaffForm, AddTransferForm });
