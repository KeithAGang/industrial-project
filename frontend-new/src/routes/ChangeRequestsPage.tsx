import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { ChangeRequest } from '@/types'
import { getRiskBadgeClass, getStatusBadgeClass, formatDate } from '@/types'
import { getUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

const PAGE_SIZE = 20
const ALL_STATUSES = ['Pending', 'InProgress', 'Approved', 'Rejected', 'Completed'] as const

export function ChangeRequestsPage() {
  const user = getUser()
  const isAdmin = user?.role === 'Admin'
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['change-requests', status, page],
    queryFn: () =>
      api.get<{ items: ChangeRequest[]; totalCount: number }>('/change-requests', {
        params: { status: status === 'all' ? undefined : status, page, pageSize: PAGE_SIZE },
      }).then(r => r.data),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      api.put(`/change-requests/${id}/status`, { status: newStatus }),
    onSuccess: () => {
      toast.success('Status updated')
      queryClient.invalidateQueries({ queryKey: ['change-requests'] })
    },
    onError: () => toast.error('Failed to update status'),
  })

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 1

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Change Requests</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {data ? `${data.totalCount} request${data.totalCount !== 1 ? 's' : ''}` : 'Loading…'}
        </p>
      </div>

      <Select value={status} onValueChange={v => { setStatus(v); setPage(1) }}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Solution</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data?.items?.length && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground py-12">
                      No change requests found
                    </TableCell>
                  </TableRow>
                )}
                {data?.items?.map((cr) => (
                  <TableRow key={cr.id}>
                    <TableCell>
                      <div className="font-medium text-foreground max-w-48 truncate" title={cr.title}>{cr.title}</div>
                      {cr.description && <div className="text-xs text-muted-foreground max-w-48 truncate">{cr.description}</div>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{cr.solutionName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{cr.requestedByName}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getRiskBadgeClass(cr.priority)}`}>
                        {cr.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(cr.status)}`}>
                        {cr.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(cr.createdAt)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              Update Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Set Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {ALL_STATUSES.filter(s => s !== cr.status).map(s => (
                              <DropdownMenuItem key={s} onClick={() => updateStatusMutation.mutate({ id: cr.id, newStatus: s })}>
                                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold mr-2 ${getStatusBadgeClass(s)}`}>{s}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
