'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboardIcon, StoreIcon, UsersIcon, PackageIcon,
  TruckIcon, SettingsIcon, LogOutIcon, BookOpenIcon,
} from 'lucide-react'
import { cn } from '@pkg/ui/cn'
import { Avatar, AvatarFallback, Button } from '@pkg/ui'
import { logoutAction } from '@/actions/auth'
import type { AuthUser } from '@pkg/db'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Супер-адмін',
  ADMIN: 'Адміністратор',
  MANAGER: 'Менеджер',
  CASHIER: 'Касир',
}

const NAV_MAIN = [
  { label: 'Дашборд',          icon: LayoutDashboardIcon, href: '/' },
  { label: 'Магазини',         icon: StoreIcon,            href: '/shops' },
  { label: 'Персонал',         icon: UsersIcon,            href: '/staff' },
  { label: 'Каталог',          icon: BookOpenIcon,         href: '/products' },
]

const NAV_STOCK = [
  { label: 'Центральний склад', icon: PackageIcon, href: '/warehouse' },
  { label: 'Переміщення',       icon: TruckIcon,   href: '/transfers' },
]

const NAV_SYS = [
  { label: 'Налаштування', icon: SettingsIcon, href: '/settings' },
]

type TNavItemDef = { label: string; icon: React.ElementType; href: string }

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href)

const NavItem = ({ item, compact, active }: { item: TNavItemDef; compact: boolean; active: boolean }) => (
  <Link
    href={item.href}
    title={compact ? item.label : undefined}
    className={cn(
      'group relative w-full flex items-center py-2.5 rounded-lg text-sm font-medium transition-all',
      compact ? 'justify-center px-2' : 'gap-3 px-3',
      active
        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
    )}
  >
    {active && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-600 dark:bg-indigo-400 rounded-r" />
    )}
    <item.icon className="size-[18px] shrink-0" />
    {!compact && <span className="truncate">{item.label}</span>}
  </Link>
)

const NavSection = ({
  label, items, compact, pathname,
}: {
  label: string; items: TNavItemDef[]; compact: boolean; pathname: string
}) => (
  <>
    <div className={cn('pt-5 pb-1', compact ? 'text-center' : 'px-3')}>
      {!compact && <p className="text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-wider">{label}</p>}
      {compact && <div className="h-px bg-sidebar-border mx-2" />}
    </div>
    {items.map(i => (
      <NavItem key={i.href} item={i} compact={compact} active={isActive(pathname, i.href)} />
    ))}
  </>
)

interface ISidebarProps {
  compact: boolean
  onToggle: () => void
  user: AuthUser
}

const Sidebar = ({ compact, onToggle, user }: ISidebarProps) => {
  const pathname = usePathname()
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
  const roleLabel = ROLE_LABELS[user.role] ?? user.role

  return (
    <aside className={cn(
      'shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col h-screen transition-all duration-200',
      compact ? 'w-17' : 'w-58',
    )}>
      {/* Brand / toggle */}
      <div className={cn('h-16 flex items-center border-b border-sidebar-border', compact ? 'justify-center' : 'px-5')}>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="size-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-sm shadow-indigo-600/30 shrink-0 hover:bg-indigo-700 transition-colors"
          >
            <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h14l-1.5 9.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5L3 7Z"/>
              <path d="M7 7V5a3 3 0 0 1 6 0v2"/>
            </svg>
          </button>
          {!compact && (
            <div>
              <div className="font-bold text-sidebar-foreground tracking-tight text-[15px] leading-tight">ShopManager</div>
              <div className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-wider">Retail OS</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 overflow-y-auto py-4 space-y-1', compact ? 'px-2' : 'px-3')}>
        {NAV_MAIN.map(i => (
          <NavItem key={i.href} item={i} compact={compact} active={isActive(pathname, i.href)} />
        ))}
        <NavSection label="Склад"   items={NAV_STOCK} compact={compact} pathname={pathname} />
        <NavSection label="Система" items={NAV_SYS}   compact={compact} pathname={pathname} />
      </nav>

      {/* User */}
      <div className={cn('border-t border-sidebar-border', compact ? 'p-2' : 'p-3')}>
        {compact ? (
          <div className="flex flex-col items-center gap-1">
            <Avatar>
              <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => logoutAction()}
              title="Вийти"
              className="text-sidebar-foreground/50 hover:text-rose-500"
            >
              <LogOutIcon />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <Avatar>
              <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-sidebar-foreground/60 truncate">{roleLabel}</div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => logoutAction()}
              title="Вийти"
              className="text-sidebar-foreground/50 hover:text-rose-500 shrink-0"
            >
              <LogOutIcon />
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}

export { Sidebar }
export type { ISidebarProps }
