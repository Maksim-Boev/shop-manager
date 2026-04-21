'use client'

import { SearchIcon, BellIcon } from 'lucide-react'

const TopBar = () => (
  <header className="bg-white border-b border-slate-200 sticky top-0 z-20 h-14 px-6 flex items-center justify-end gap-2 shrink-0">
    <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 transition-colors">
      <SearchIcon className="size-3.5" />
      <span>Пошук…</span>
      <span className="ml-2 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">⌘K</span>
    </button>
    <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
      <BellIcon className="size-5" />
      <span className="absolute top-1.5 right-1.5 size-2 bg-rose-500 rounded-full border-2 border-white" />
    </button>
  </header>
)

export { TopBar }
