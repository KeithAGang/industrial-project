import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { getUser, logout } from '@/lib/auth'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { NotificationPagedResult } from '@/types'
import { Tooltip } from '@/components/ui/tooltip'
import {
  SquaresFour,
  Desktop,
  Users,
  GitPullRequest,
  Bell,
  Pulse,
  SignOut,
  X,
  UserGear,
} from '@phosphor-icons/react'

const navItems = [
  { to: '/',                label: 'Dashboard',       icon: SquaresFour,    exact: true, adminOnly: false },
  { to: '/solutions',       label: 'Solutions',        icon: Desktop,                    adminOnly: false },
  { to: '/clients',         label: 'Clients',          icon: Users,                      adminOnly: false },
  { to: '/change-requests', label: 'Change Requests',  icon: GitPullRequest,             adminOnly: false },
  { to: '/notifications',   label: 'Notifications',    icon: Bell,                       adminOnly: false },
  { to: '/users',           label: 'System Users',     icon: UserGear,                   adminOnly: true  },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const user = getUser()
  const isAdmin = user?.role === 'Admin'
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const { data: notifData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () =>
      api.get<NotificationPagedResult>('/notifications', {
        params: { unreadOnly: true, pageSize: 1 },
      }).then(r => r.data),
    refetchInterval: 30_000,
  })

  const unreadCount = notifData?.unreadCount ?? 0

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return currentPath === to
    return currentPath.startsWith(to)
  }

  const initials =
    user?.fullName
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? 'U'

  const handleNavClick = () => {
    onClose?.()
  }

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen w-[196px] flex flex-col border-r border-border bg-card z-40',
        'transition-transform duration-200 ease-out',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-11 border-b border-border shrink-0">
        <div className="flex h-[22px] w-[22px] items-center justify-center rounded bg-primary">
          <Pulse weight="fill" className="text-[11px] text-primary-foreground" />
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-foreground leading-none flex-1">
          Nepsis
        </span>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden rounded p-1 text-muted-foreground/60 hover:text-foreground transition-colors"
          aria-label="Close navigation"
        >
          <X weight="bold" className="text-[14px]" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <p className="px-4 pt-0.5 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60 select-none">
          Navigation
        </p>
        {visibleItems.map(({ to, label, icon: Icon, exact }) => {
          const active = isActive(to, exact)
          return (
            <Link
              key={to}
              to={to}
              onClick={handleNavClick}
              className={cn(
                'relative flex items-center gap-2.5 px-4 py-[7px] text-[12px] transition-colors select-none',
                active
                  ? 'text-foreground bg-accent/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/35'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1 bottom-1 w-[2px] rounded-r bg-primary" />
              )}
              <Icon
                weight={active ? 'fill' : 'regular'}
                className={cn('text-[15px] shrink-0', active ? 'text-primary' : '')}
              />
              <span className="flex-1 truncate">{label}</span>
              {label === 'Notifications' && unreadCount > 0 && (
                <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded px-1 text-[9px] font-semibold bg-primary/20 text-primary">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-border px-3 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-[22px] w-[22px] rounded bg-primary/15 flex items-center justify-center text-[9px] font-semibold text-primary shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium truncate text-foreground leading-tight">
              {user?.fullName ?? 'User'}
            </p>
            <p className="text-[10px] text-muted-foreground truncate leading-tight">
              {user?.role ?? ''}
            </p>
          </div>
          <Tooltip content="Sign out" side="top">
            <button
              onClick={logout}
              className="rounded p-1 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Sign out"
            >
              <SignOut weight="fill" className="text-[14px]" />
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  )
}
