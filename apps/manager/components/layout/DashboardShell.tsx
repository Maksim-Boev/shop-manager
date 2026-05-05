'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'
import type { AuthUser } from '@pkg/db'

interface IDashboardShellProps {
  children: React.ReactNode
  user: AuthUser
  defaultCompact: boolean
}

const DashboardShell = ({ children, user, defaultCompact }: IDashboardShellProps) => {
  const [compact, setCompact] = useState(defaultCompact)

  const handleToggle = () => {
    const next = !compact
    setCompact(next)
    document.cookie = `sidebar_compact=${next}; path=/; max-age=${60 * 60 * 24 * 365}`
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar compact={compact} onToggle={handleToggle} user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export { DashboardShell }
export type { IDashboardShellProps }
