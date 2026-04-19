// Shared UI components for ShopManager
const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;

// ---------- Format helpers ----------
const fmtUAH = (n) => '₴ ' + Math.round(n).toLocaleString('uk-UA').replace(/,/g, ' ');
const fmtNum = (n) => Math.round(n).toLocaleString('uk-UA').replace(/,/g, ' ');
const fmtPct = (n) => (n > 0 ? '+' : '') + n.toFixed(1) + '%';

// ---------- Tweaks context ----------
const TweaksCtx = createContext(null);
const useTweaks = () => useContext(TweaksCtx);

// ---------- Accent palette map ----------
const ACCENT_MAP = {
  indigo:  { bg: '#EEF2FF', fg: '#4338CA', solid: '#4F46E5', soft: '#C7D2FE', text: '#3730A3' },
  emerald: { bg: '#ECFDF5', fg: '#047857', solid: '#10B981', soft: '#A7F3D0', text: '#065F46' },
  amber:   { bg: '#FFFBEB', fg: '#B45309', solid: '#F59E0B', soft: '#FDE68A', text: '#92400E' },
  rose:    { bg: '#FFF1F2', fg: '#BE123C', solid: '#F43F5E', soft: '#FECDD3', text: '#9F1239' },
  sky:     { bg: '#F0F9FF', fg: '#0369A1', solid: '#0EA5E9', soft: '#BAE6FD', text: '#075985' },
  violet:  { bg: '#F5F3FF', fg: '#6D28D9', solid: '#8B5CF6', soft: '#DDD6FE', text: '#5B21B6' },
  teal:    { bg: '#F0FDFA', fg: '#0F766E', solid: '#14B8A6', soft: '#99F6E4', text: '#115E59' },
};
const accent = (k) => ACCENT_MAP[k] || ACCENT_MAP.indigo;

// ---------- Icon (lucide via font / svg wrapper) ----------
function Icon({ name, className = 'w-5 h-5', strokeWidth = 2 }) {
  // Uses lucide-static via inline SVG paths. Fallback to a generic circle if name missing.
  const ref = useRef(null);
  useEffect(() => {
    if (window.lucide && ref.current) {
      ref.current.innerHTML = '';
      const el = document.createElement('i');
      el.setAttribute('data-lucide', name);
      el.className = className;
      ref.current.appendChild(el);
      window.lucide.createIcons({ attrs: { 'stroke-width': strokeWidth } });
    }
  }, [name, className, strokeWidth]);
  return <span ref={ref} className={'inline-flex shrink-0 ' + className} aria-hidden="true"></span>;
}

// ---------- Button ----------
function Button({ children, variant = 'primary', size = 'md', icon, iconRight, onClick, className = '', type = 'button', disabled }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs rounded-lg', md: 'px-4 py-2 text-sm rounded-lg', lg: 'px-5 py-2.5 text-sm rounded-xl' };
  const variants = {
    primary:  'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow active:bg-indigo-800',
    secondary:'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300',
    ghost:    'bg-transparent hover:bg-slate-100 text-slate-600',
    soft:     'bg-indigo-50 hover:bg-indigo-100 text-indigo-700',
    danger:   'bg-rose-600 hover:bg-rose-700 text-white',
    dark:     'bg-slate-900 hover:bg-slate-800 text-white',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {icon && <Icon name={icon} className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {children}
      {iconRight && <Icon name={iconRight} className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
    </button>
  );
}

// ---------- Badge ----------
function Badge({ children, tone = 'slate', icon, dot }) {
  const tones = {
    slate:   'bg-slate-100 text-slate-700',
    indigo:  'bg-indigo-50 text-indigo-700 border border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    amber:   'bg-amber-50 text-amber-700 border border-amber-100',
    rose:    'bg-rose-50 text-rose-700 border border-rose-100',
    sky:     'bg-sky-50 text-sky-700 border border-sky-100',
  };
  const dotColors = { slate: 'bg-slate-400', indigo: 'bg-indigo-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500', sky: 'bg-sky-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${tones[tone]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[tone]} ${tone === 'emerald' ? 'animate-pulse' : ''}`}></span>}
      {icon && <Icon name={icon} className="w-3 h-3" />}
      {children}
    </span>
  );
}

// ---------- Avatar ----------
function Avatar({ emp, size = 'md', showStatus = false, ring = false }) {
  const sizes = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
  const dot = { xs: 'w-1.5 h-1.5', sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3', xl: 'w-3.5 h-3.5' };
  if (!emp) return <div className={`${sizes[size]} rounded-full bg-slate-200 text-slate-400 flex items-center justify-center font-semibold`}>?</div>;
  const c = accent(emp.color);
  return (
    <div className="relative inline-flex">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold ${ring ? 'ring-2 ring-white' : ''}`}
        style={{ background: c.bg, color: c.text }}
      >
        {emp.avatar}
      </div>
      {showStatus && (
        <span className={`absolute bottom-0 right-0 ${dot[size]} rounded-full border-2 border-white ${emp.status === 'on' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
      )}
    </div>
  );
}

// ---------- Card ----------
function Card({ children, className = '', pad = true, hover = false }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${hover ? 'hover:shadow-md hover:border-slate-300 transition-all' : ''} ${pad ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}

// ---------- Input ----------
function Input({ icon, label, hint, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-semibold text-slate-600 mb-1.5 tracking-wide">{label}</label>}
      <div className="relative">
        {icon && <Icon name={icon} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
        <input
          {...props}
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition placeholder:text-slate-400 ${error ? 'border-rose-300' : ''}`}
        />
      </div>
      {hint && !error && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

function Select({ label, options, value, onChange, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-semibold text-slate-600 mb-1.5 tracking-wide">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange && onChange(e.target.value)}
          className="w-full appearance-none pl-3 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
        >
          {options.map(o => typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Icon name="chevron-down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ---------- Modal ----------
function Modal({ open, onClose, title, subtitle, children, size = 'md', footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_.15s_ease-out]">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative w-full ${sizes[size]} bg-white rounded-2xl shadow-2xl border border-slate-200 animate-[slideUp_.2s_ease-out] max-h-[90vh] flex flex-col`}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg -mr-2">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Toast ----------
const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, ...t }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), t.duration || 3200);
  };
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[slideUp_.2s_ease-out] min-w-[260px]">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.tone === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
              <Icon name={t.tone === 'error' ? 'alert-circle' : 'check'} className="w-4 h-4" />
            </div>
            <div className="text-sm">
              <div className="font-medium">{t.title}</div>
              {t.desc && <div className="text-slate-400 text-xs mt-0.5">{t.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- Sparkline ----------
function Sparkline({ data, color = '#4F46E5', fill = '#EEF2FF', height = 36, width = 120 }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / range) * (height - 4) - 2]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = line + ` L ${width},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.5" fill={color} />
    </svg>
  );
}

// ---------- Bar chart (simple) ----------
function BarChart({ data, labels, height = 160, color = '#4F46E5', accent = '#818CF8' }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((v, i) => {
        const h = (v / max) * (height - 20);
        const isPeak = v === max;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition font-medium tabular-nums">
              {Math.round(v / 1000)}k
            </div>
            <div
              className="w-full rounded-t transition-all group-hover:opacity-80"
              style={{ height: h, background: isPeak ? color : accent, minHeight: 2 }}
            ></div>
            {labels && <div className="text-[10px] text-slate-400">{labels[i]}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ---------- Progress bar ----------
function Progress({ value, max = 100, color = 'indigo', label }) {
  const pct = Math.min(100, (value / max) * 100);
  const colors = { indigo: 'bg-indigo-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500' };
  return (
    <div>
      {label && <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">{label}</span><span className="text-slate-500 tabular-nums">{Math.round(pct)}%</span></div>}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]} rounded-full transition-all duration-500`} style={{ width: pct + '%' }}></div>
      </div>
    </div>
  );
}

// ---------- Empty state ----------
function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="text-center py-12">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
        <Icon name={icon || 'inbox'} className="w-7 h-7" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {desc && <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Stock level helper
function stockLevel(qty) {
  if (qty === 0) return { tone: 'rose', label: 'Немає', dot: true };
  if (qty <= 3) return { tone: 'rose', label: 'Критично', dot: true };
  if (qty <= 10) return { tone: 'amber', label: 'Закінчується', dot: true };
  return { tone: 'emerald', label: 'В наявності', dot: true };
}

Object.assign(window, {
  fmtUAH, fmtNum, fmtPct,
  TweaksCtx, useTweaks,
  ACCENT_MAP, accent,
  Icon, Button, Badge, Avatar, Card, Input, Select, Modal,
  ToastCtx, useToast, ToastProvider,
  Sparkline, BarChart, Progress, EmptyState,
  stockLevel,
});
