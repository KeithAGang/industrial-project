import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { getUser, logout } from '@/lib/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { NotificationPagedResult } from '@/types'
import { 
  SquaresFour, 
  Desktop, 
  Users, 
  GitPullRequest, 
  Bell, 
  Pulse, 
  SignOut 
} from '@phosphor-icons/react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: SquaresFour, exact: true },
  { to: '/solutions', label: 'Solutions', icon: Desktop },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/change-requests', label: 'Change Requests', icon: GitPullRequest },
  { to: '/notifications', label: 'Notifications', icon: Bell },
]

export function Sidebar() {
  const user = getUser()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const { data: notifData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => api.get<NotificationPagedResult>('/notifications', {
      params: { unreadOnly: true, pageSize: 1 }
    }).then(r => r.data),
    refetchInterval: 30_000,
  })

  const unreadCount = notifData?.unreadCount ?? 0

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return currentPath === to
    return currentPath.startsWith(to)
  }

  const initials = user?.fullName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U'

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col border-r border-border bg-card z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
          <Pulse weight="duotone" className="text-lg text-primary-foreground" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-foreground">LifecycleIQ</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Command Center</div>
        </div>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Navigation
        </p>
        {navItems.map(({ to, label, icon: Icon, exact }) => {
          const active = isActive(to, exact)
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon 
                weight={active ? "duotone" : "regular"} 
                className={cn('text-lg shrink-0', active ? 'text-primary' : '')} 
              />
              <span className="flex-1">{label}</span>
              {label === 'Notifications' && unreadCount > 0 && (
                <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User footer */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-3 rounded-md px-3 py-2.5">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[10px] font-semibold bg-primary/20 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-foreground">{user?.fullName ?? 'User'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.role ?? ''}</p>
          </div>
          <button
            onClick={logout}
            className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Sign out"
          >
            <SignOut weight="duotone" className="text-lg" />
          </button>
        </div>
      </div>
    </aside>
  )
}
