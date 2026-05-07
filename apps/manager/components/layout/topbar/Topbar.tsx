'use client'

import { SearchIcon, BellIcon } from 'lucide-react'
import { Button } from '@pkg/ui'
import { ThemeToggle, type TTheme } from '@/components/layout/theme-toggle'
import type { AuthUser } from '@pkg/db'

interface ITopBarProps {
  user: AuthUser
  defaultTheme: TTheme
}

const TopBar = ({ user, defaultTheme }: ITopBarProps) => (
  <header className="bg-card border-b border-border sticky top-0 z-20 h-14 px-6 flex items-center justify-between gap-2 shrink-0">
    <div className="text-sm text-muted-foreground">
      {user.firstName} {user.lastName}
    </div>
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="text-muted-foreground gap-2">
        <SearchIcon className="size-3.5" />
        <span>Пошук…</span>
        <span className="ml-2 px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono">⌘K</span>
      </Button>
      <ThemeToggle defaultTheme={defaultTheme} />
      <Button variant="ghost" size="icon" className="relative">
        <BellIcon className="size-5" />
        <span className="absolute top-1.5 right-1.5 size-2 bg-rose-500 rounded-full border-2 border-card" />
      </Button>
    </div>
  </header>
)

export { TopBar }
export type { ITopBarProps }
