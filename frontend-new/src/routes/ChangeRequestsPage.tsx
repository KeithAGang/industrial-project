import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { ChangeRequest, Solution } from '@/types'
import { getRiskBadgeClass, getStatusBadgeClass, formatDate } from '@/types'
import { getUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { CaretLeft, CaretRight, Plus, CircleNotch } from '@phosphor-icons/react'

const PAGE_SIZE = 20
const ALL_STATUSES = ['Pending', 'InProgress', 'Approved', 'Rejected', 'Completed'] as const
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const

const createSchema = z.object({
  solutionId:  z.string().uuid('Select a solution'),
  title:       z.string().min(1, 'Required').max(150, 'Max 150 characters'),
  description: z.string().min(10, 'Minimum 10 characters'),
  priority:    z.enum(PRIORITIES),
})
type CreateFormValues = z.infer<typeof createSchema>

function CreateChangeRequestDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)

  const { data: solutionsData } = useQuery({
    queryKey: ['solutions-all'],
    queryFn: () =>
      api.get<{ items: Solution[] }>('/solutions', { params: { page: 1, pageSize: 200 } }).then(r => r.data),
    enabled: open,
  })

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { priority: 'Medium' },
  })

  const mutation = useMutation({
    mutationFn: (values: CreateFormValues) => api.post('/change-requests', values),
    onSuccess: () => {
      toast.success('Change request submitted')
      onCreated()
      setOpen(false)
      form.reset({ priority: 'Medium' })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to submit change request'
      toast.error(msg)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus weight="bold" />New Request</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[14px]">New Change Request</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(v => mutation.mutate(v))} className="space-y-3">

            <FormField control={form.control} name="solutionId" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">Solution</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a solution…" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {solutionsData?.items?.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">Title</FormLabel>
                <FormControl><Input placeholder="Brief summary of the change…" {...field} /></FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">Description</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={3}
                    placeholder="Describe the change in detail (min 10 characters)…"
                    className="flex w-full rounded border border-input bg-input px-2.5 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground/55 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            <FormField control={form.control} name="priority" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            <DialogFooter className="pt-1">
              <Button variant="outline" size="sm" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <CircleNotch weight="bold" className="animate-spin" />}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

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
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-foreground">Change Requests</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {data ? `${data.totalCount} request${data.totalCount !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>
        <CreateChangeRequestDialog
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['change-requests'] })}
        />
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
            <div className="p-4 space-y-2">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
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
                  {isAdmin && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data?.items?.length && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground py-12 text-[12px]">
                      No change requests found
                    </TableCell>
                  </TableRow>
                )}
                {data?.items?.map(cr => (
                  <TableRow key={cr.id}>
                    <TableCell>
                      <div className="font-medium text-foreground text-[12px] max-w-48 truncate" title={cr.title}>
                        {cr.title}
                      </div>
                      {cr.description && (
                        <div className="text-[10px] text-muted-foreground max-w-48 truncate">{cr.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[12px]">{cr.solutionName}</TableCell>
                    <TableCell className="text-muted-foreground text-[12px]">{cr.requestedByName}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded border px-1.5 py-0 leading-5 text-[10px] font-medium ${getRiskBadgeClass(cr.priority)}`}>
                        {cr.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded border px-1.5 py-0 leading-5 text-[10px] font-medium ${getStatusBadgeClass(cr.status)}`}>
                        {cr.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[12px] font-mono">
                      {formatDate(cr.createdAt)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
                              Update
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-[12px]">
                            <DropdownMenuLabel className="text-[10px] text-muted-foreground py-1 px-2">
                              Set Status
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {ALL_STATUSES.filter(s => s !== cr.status).map(s => (
                              <DropdownMenuItem
                                key={s}
                                className="text-[12px] py-1"
                                onClick={() => updateStatusMutation.mutate({ id: cr.id, newStatus: s })}
                              >
                                <span className={`inline-flex items-center rounded border px-1.5 py-0 leading-5 text-[10px] font-medium mr-2 ${getStatusBadgeClass(s)}`}>
                                  {s}
                                </span>
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
          <p className="text-[11px] text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <CaretLeft weight="bold" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next <CaretRight weight="bold" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
