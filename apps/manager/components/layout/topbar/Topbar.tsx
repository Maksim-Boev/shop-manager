'use client'

import { SearchIcon, BellIcon } from 'lucide-react'
import { Button } from '@pkg/ui'
import { ThemeToggle, type TTheme } from '@/components/layout/theme-toggle'
import { Breadcrumb } from '@/components/layout/breadcrumb'

interface ITopBarProps {
  defaultTheme: TTheme
}

const TopBar = ({ defaultTheme }: ITopBarProps) => (
  <header className="bg-sidebar border-b border-sidebar-border sticky top-0 z-20 h-14 px-6 flex items-center justify-between gap-4 shrink-0">
    <div className="min-w-0 flex-1">
      <Breadcrumb />
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <Button variant="outline-muted" size="sm" className="gap-2">
        <SearchIcon className="size-3.5" />
        <span>Пошук…</span>
        <span className="ml-2 px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono">⌘K</span>
      </Button>
      <ThemeToggle defaultTheme={defaultTheme} />
      <Button variant="ghost" size="icon" className="relative">
        <BellIcon className="size-5" />
        <span className="absolute top-1.5 right-1.5 size-2 bg-rose-500 rounded-full border-2 border-sidebar" />
      </Button>
    </div>
  </header>
)

export { TopBar }
export type { ITopBarProps }
