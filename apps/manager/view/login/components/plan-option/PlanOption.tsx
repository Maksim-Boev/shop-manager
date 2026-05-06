'use client'
import { Check } from 'lucide-react'
import { cn } from '@pkg/ui/cn'
import type { IPlanOptionProps } from './types'

const PlanOption = ({ active, onClick, title, desc, price, badge, featured }: IPlanOptionProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'relative text-left p-3 rounded-[var(--radius)] border transition-all',
      active
        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]'
        : 'border-[hsl(var(--border))] hover:border-[hsl(240_6%_22%)] bg-[hsl(var(--muted)/0.4)]',
    )}
  >
    <div className="flex items-start justify-between mb-1">
      <span className="text-xs font-bold text-[hsl(var(--foreground))]">{title}</span>
      {featured && badge && (
        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[hsl(var(--primary)/0.2)] text-[hsl(252_100%_85%)] rounded">
          {badge}
        </span>
      )}
    </div>
    <div className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1.5">{desc}</div>
    <div className="text-sm font-bold text-[hsl(var(--foreground))]">
      {price}
      <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-normal"> /міс</span>
    </div>
    {active && (
      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
      </div>
    )}
  </button>
)

export { PlanOption }
