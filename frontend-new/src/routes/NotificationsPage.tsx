import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { NotificationPagedResult, Notification } from '@/types'
import { timeAgo } from '@/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { 
  WarningOctagon, 
  Warning, 
  Bell, 
  Info, 
  Checks, 
  CaretLeft, 
  CaretRight 
} from '@phosphor-icons/react'

const PAGE_SIZE = 20

function NotifIcon({ type }: { type: Notification['type'] }) {
  const base = 'text-lg'
  switch (type) {
    case 'Critical': return <WarningOctagon weight="duotone" className={`${base} text-red-400`} />
    case 'High': return <Warning weight="duotone" className={`${base} text-orange-400`} />
    case 'Medium': return <Warning weight="duotone" className={`${base} text-amber-400`} />
    case 'Low': return <Bell weight="duotone" className={`${base} text-green-400`} />
    default: return <Info weight="duotone" className={`${base} text-blue-400`} />
  }
}

export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', unreadOnly, page],
    queryFn: () =>
      api.get<NotificationPagedResult>('/notifications', {
        params: { unreadOnly: unreadOnly || undefined, page, pageSize: PAGE_SIZE },
      }).then(r => r.data),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      toast.success('All notifications marked as read')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
    onError: () => toast.error('Failed to mark all as read'),
  })

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 1

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.unreadCount} unread` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={unreadOnly ? 'default' : 'outline'} size="sm" onClick={() => { setUnreadOnly(v => !v); setPage(1) }}>
            Unread only
          </Button>
          <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending || !data?.unreadCount}>
            <Checks weight="bold" className="text-lg" />
            Mark all read
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : !data?.items?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Bell weight="duotone" className="text-5xl mb-3 opacity-30" />
          <p className="text-sm">{unreadOnly ? 'No unread notifications' : 'No notifications'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {data.items.map((n) => (
            <div
              key={n.id}
              className={cn(
                'rounded-lg border p-4 transition-colors',
                n.isRead ? 'bg-card border-border opacity-70' : 'bg-card border-border ring-1 ring-primary/20'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                  n.type === 'Critical' ? 'bg-red-500/10' :
                  n.type === 'High' ? 'bg-orange-500/10' :
                  n.type === 'Medium' ? 'bg-amber-500/10' :
                  n.type === 'Low' ? 'bg-green-500/10' : 'bg-blue-500/10'
                )}>
                  <NotifIcon type={n.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={cn('text-sm font-medium leading-tight', n.isRead ? 'text-muted-foreground' : 'text-foreground')}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                      {!n.isRead && (
                        <button
                          onClick={() => markReadMutation.mutate(n.id)}
                          className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 hover:bg-primary/60 transition-colors"
                          title="Mark as read"
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 font-mono">{n.solutionName}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <CaretLeft weight="bold" className="text-lg" />Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next<CaretRight weight="bold" className="text-lg" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
