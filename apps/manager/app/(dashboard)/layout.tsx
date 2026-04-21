'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [compact, setCompact] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar compact={compact} onToggle={() => setCompact(v => !v)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
