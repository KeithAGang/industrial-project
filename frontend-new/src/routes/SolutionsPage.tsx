import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import api from '@/lib/api'
import { getUser } from '@/lib/auth'
import type { PagedResult, Solution, Client } from '@/types'
import { getRiskBadgeClass, getSlaStatusClass, formatDate } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { MagnifyingGlass, ArrowRight, CaretLeft, CaretRight, Plus, CircleNotch } from '@phosphor-icons/react'

const PAGE_SIZE = 20

const schema = z.object({
  clientId:            z.string().uuid('Select a client'),
  name:                z.string().min(1, 'Required').max(100),
  description:         z.string().optional(),
  currentVersion:      z.string().min(1, 'Required'),
  latestVersion:       z.string().min(1, 'Required'),
  licenceKey:          z.string().optional(),
  licenceExpiryDate:   z.string().min(1, 'Required'),
  slaTier:             z.enum(['Basic', 'Standard', 'Premium', 'Critical']),
  slaComplianceStatus: z.enum(['Compliant', 'AtRisk', 'Breached']),
  lastMaintenanceDate: z.string().min(1, 'Required'),
})
type FormValues = z.infer<typeof schema>

function AddSolutionDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)

  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => api.get<{ items: Client[] }>('/clients', { params: { page: 1, pageSize: 200 } }).then(r => r.data),
    enabled: open,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slaTier: 'Standard',
      slaComplianceStatus: 'Compliant',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.post('/solutions', {
        ...values,
        licenceExpiryDate:   new Date(values.licenceExpiryDate).toISOString(),
        lastMaintenanceDate: new Date(values.lastMaintenanceDate).toISOString(),
      }),
    onSuccess: () => {
      toast.success('Solution created')
      onCreated()
      setOpen(false)
      form.reset()
    },
    onError: () => toast.error('Failed to create solution'),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus weight="bold" />Add Solution</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[14px]">New Solution</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(v => mutation.mutate(v))} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">

            {/* Client */}
            <FormField control={form.control} name="clientId" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">Client</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a client…" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clientsData?.items?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            {/* Name */}
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">Solution Name</FormLabel>
                <FormControl><Input placeholder="e.g. SAP ERP" {...field} /></FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            {/* Description */}
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">Description <span className="text-muted-foreground">(optional)</span></FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={2}
                    placeholder="Brief description of the solution…"
                    className="flex w-full rounded border border-input bg-input px-2.5 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            {/* Version row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="currentVersion" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px]">Current Version</FormLabel>
                  <FormControl><Input placeholder="e.g. 4.2.1" {...field} /></FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
              <FormField control={form.control} name="latestVersion" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px]">Latest Version</FormLabel>
                  <FormControl><Input placeholder="e.g. 4.5.0" {...field} /></FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
            </div>

            {/* Licence Key */}
            <FormField control={form.control} name="licenceKey" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">Licence Key <span className="text-muted-foreground">(optional)</span></FormLabel>
                <FormControl><Input placeholder="XXXX-XXXX-XXXX-XXXX" {...field} /></FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            {/* Dates row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="licenceExpiryDate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px]">Licence Expiry</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastMaintenanceDate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px]">Last Maintenance</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
            </div>

            {/* SLA row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="slaTier" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px]">SLA Tier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
              <FormField control={form.control} name="slaComplianceStatus" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px]">SLA Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Compliant">Compliant</SelectItem>
                      <SelectItem value="AtRisk">At Risk</SelectItem>
                      <SelectItem value="Breached">Breached</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
            </div>

            <DialogFooter className="pt-1">
              <Button variant="outline" size="sm" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <CircleNotch weight="bold" className="animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function SolutionsPage() {
  const user = getUser()
  const isAdmin = user?.role === 'Admin'
  const [search, setSearch] = useState('')
  const [riskTier, setRiskTier] = useState('all')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['solutions', search, riskTier, page],
    queryFn: () =>
      api.get<PagedResult<Solution>>('/solutions', {
        params: {
          search:   search || undefined,
          riskTier: riskTier === 'all' ? undefined : riskTier,
          page,
          pageSize: PAGE_SIZE,
        },
      }).then(r => r.data),
  })

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 1

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-foreground">Solutions</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {data ? `${data.totalCount} solution${data.totalCount !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>
        {isAdmin && (
          <AddSolutionDialog onCreated={() => queryClient.invalidateQueries({ queryKey: ['solutions'] })} />
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search solutions or clients…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={riskTier} onValueChange={v => { setRiskTier(v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Risk Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Tiers</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Solution</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>SHI Score</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Licence Expiry</TableHead>
                  <TableHead>SLA Tier</TableHead>
                  <TableHead>SLA Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data?.items?.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12 text-[12px]">
                      No solutions found
                    </TableCell>
                  </TableRow>
                )}
                {data?.items?.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link
                        to="/solutions/$id"
                        params={{ id: s.id }}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[12px]">{s.clientName}</TableCell>
                    <TableCell>
                      {s.latestShi ? (
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                s.latestShi.riskTier === 'Critical' ? 'bg-red-500' :
                                s.latestShi.riskTier === 'High'     ? 'bg-orange-500' :
                                s.latestShi.riskTier === 'Medium'   ? 'bg-amber-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${s.latestShi.shiScore * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-foreground">
                            {(s.latestShi.shiScore * 100).toFixed(1)}
                          </span>
                        </div>
                      ) : <span className="text-muted-foreground text-[11px]">—</span>}
                    </TableCell>
                    <TableCell>
                      {s.latestShi ? (
                        <span className={`inline-flex items-center rounded border px-1.5 py-0 leading-5 text-[10px] font-medium ${getRiskBadgeClass(s.latestShi.riskTier)}`}>
                          {s.latestShi.riskTier}
                        </span>
                      ) : <span className="text-muted-foreground text-[11px]">—</span>}
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground font-mono">
                      {formatDate(s.licenceExpiryDate)}
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{s.slaTier}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded border px-1.5 py-0 leading-5 text-[10px] font-medium ${getSlaStatusClass(s.slaComplianceStatus)}`}>
                        {s.slaComplianceStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link to="/solutions/$id" params={{ id: s.id }}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ArrowRight weight="bold" className="text-[12px]" />
                        </Button>
                      </Link>
                    </TableCell>
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
