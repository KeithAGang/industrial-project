import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { Client } from '@/types'
import { formatDate } from '@/types'
import { getUser } from '@/lib/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Plus, MagnifyingGlass, CircleNotch } from '@phosphor-icons/react'

const schema = z.object({
  name:          z.string().min(1, 'Name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  email:         z.string().email('Enter a valid email'),
  phone:         z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function ClientsPage() {
  const user = getUser()
  const isAdmin = user?.role === 'Admin'
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () =>
      api.get<{ items: Client[]; totalCount: number }>('/clients', {
        params: { search: search || undefined, page: 1, pageSize: 50 },
      }).then(r => r.data),
  })

  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.post('/clients', values),
    onSuccess: () => {
      toast.success('Client created')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setDialogOpen(false)
      form.reset()
    },
    onError: () => toast.error('Failed to create client'),
  })

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-foreground">Clients</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {data ? `${data.totalCount} client${data.totalCount !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus weight="bold" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[14px]">New Client</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(v => createMutation.mutate(v))} className="space-y-3">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px]">Company Name</FormLabel>
                      <FormControl><Input placeholder="Acme Corp" {...field} /></FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contactPerson" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px]">Contact Person</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px]">Email</FormLabel>
                      <FormControl><Input type="email" placeholder="john@acme.com" {...field} /></FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px]">Phone (optional)</FormLabel>
                      <FormControl><Input placeholder="+1 555 000 0000" {...field} /></FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />
                  <DialogFooter>
                    <Button variant="outline" size="sm" type="button" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <CircleNotch weight="bold" className="animate-spin" />}
                      Create
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative max-w-sm">
        <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground" />
        <Input className="pl-8" placeholder="Search clients…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

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
                  <TableHead>Company</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Active Solutions</TableHead>
                  <TableHead>Member Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data?.items?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-[12px]">
                      No clients found
                    </TableCell>
                  </TableRow>
                )}
                {data?.items?.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground text-[12px]">{c.contactPerson}</TableCell>
                    <TableCell className="text-muted-foreground text-[11px] font-mono">{c.email}</TableCell>
                    <TableCell className="text-muted-foreground text-[12px]">{c.phone ?? '—'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0 leading-5 text-[10px] font-mono text-foreground">
                        {c.activeSolutionCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[12px] font-mono">
                      {formatDate(c.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
