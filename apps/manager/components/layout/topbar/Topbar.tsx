'use client'

import { SearchIcon, BellIcon } from 'lucide-react'
import { Button } from '@pkg/ui'
import type { AuthUser } from '@pkg/db'

interface ITopBarProps {
  user: AuthUser
}

const TopBar = ({ user }: ITopBarProps) => (
  <header className="bg-white border-b border-slate-200 sticky top-0 z-20 h-14 px-6 flex items-center justify-between gap-2 shrink-0">
    <div className="text-sm text-slate-500">
      {user.firstName} {user.lastName}
    </div>
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="text-slate-500 gap-2">
        <SearchIcon className="size-3.5" />
        <span>Пошук…</span>
        <span className="ml-2 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">⌘K</span>
      </Button>
      <Button variant="ghost" size="icon" className="relative">
        <BellIcon className="size-5" />
        <span className="absolute top-1.5 right-1.5 size-2 bg-rose-500 rounded-full border-2 border-white" />
      </Button>
    </div>
  </header>
)

export { TopBar }
export type { ITopBarProps }
