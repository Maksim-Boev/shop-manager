import Link from 'next/link'
import { Button } from '@pkg/ui'

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 text-center">
    <svg
      className="w-64 h-64 mb-8 text-indigo-100"
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Shelf */}
      <rect x="40" y="200" width="320" height="12" rx="4" fill="currentColor" />
      <rect x="60" y="212" width="8" height="60" rx="2" fill="currentColor" />
      <rect x="332" y="212" width="8" height="60" rx="2" fill="currentColor" />

      {/* Books on shelf */}
      <rect x="80" y="148" width="28" height="52" rx="3" fill="#C7D2FE" />
      <rect x="112" y="160" width="22" height="40" rx="3" fill="#A5B4FC" />
      <rect x="138" y="152" width="32" height="48" rx="3" fill="#818CF8" />
      <rect x="174" y="156" width="26" height="44" rx="3" fill="#C7D2FE" />

      {/* Gap — missing book */}
      <rect x="204" y="170" width="30" height="2" rx="1" fill="#E0E7FF" strokeDasharray="4 4" />

      <rect x="238" y="162" width="24" height="38" rx="3" fill="#A5B4FC" />
      <rect x="266" y="150" width="30" height="50" rx="3" fill="#C7D2FE" />
      <rect x="300" y="158" width="22" height="42" rx="3" fill="#818CF8" />

      {/* Flying book */}
      <g transform="rotate(-15 220 80)">
        <rect x="195" y="60" width="38" height="50" rx="3" fill="#6366F1" />
        <rect x="195" y="60" width="6" height="50" rx="2" fill="#4F46E5" />
        <line x1="207" y1="74" x2="228" y2="74" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <line x1="207" y1="82" x2="224" y2="82" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <line x1="207" y1="90" x2="226" y2="90" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* Stars / sparkles */}
      <circle cx="170" cy="40" r="3" fill="#A5B4FC" />
      <circle cx="260" cy="30" r="2" fill="#C7D2FE" />
      <circle cx="310" cy="55" r="3" fill="#A5B4FC" />
      <circle cx="100" cy="50" r="2" fill="#C7D2FE" />

      {/* 404 text shadow */}
      <text x="200" y="270" textAnchor="middle" fontSize="22" fontWeight="700" fill="#E0E7FF" fontFamily="sans-serif">
        404
      </text>
    </svg>

    <h1 className="text-2xl font-bold text-slate-800 mb-2">Сторінку не знайдено</h1>
    <p className="text-slate-500 text-sm max-w-xs mb-8">
      Схоже, ця сторінка переїхала або ніколи не існувала. Перевірте посилання або поверніться на головну.
    </p>

    <Button asChild>
      <Link href="/">На головну</Link>
    </Button>
  </div>
)

export default NotFound
