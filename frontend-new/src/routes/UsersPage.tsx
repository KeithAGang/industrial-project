import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { SystemUser } from '@/types'
import { formatDate } from '@/types'
import { getUser } from '@/lib/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Plus, CircleNotch, PencilSimple, Trash } from '@phosphor-icons/react'

const ROLES = ['Admin', 'Manager'] as const

/* ─── Create schema ──────────────────────────────────────────────── */
const createSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  fullName: z.string().min(1, 'Required'),
  password: z.string().min(6, 'Min 6 characters'),
  role:     z.enum(ROLES),
})
type CreateValues = z.infer<typeof createSchema>

/* ─── Edit schema ────────────────────────────────────────────────── */
const editSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  role:     z.enum(ROLES),
  password: z.string().min(6, 'Min 6 characters').or(z.literal('')).optional(),
})
type EditValues = z.infer<typeof editSchema>

/* ─── Add User Dialog ────────────────────────────────────────────── */
function AddUserDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'Manager' },
  })

  const mutation = useMutation({
    mutationFn: (values: CreateValues) => api.post('/users', values),
    onSuccess: () => {
      toast.success('User created')
      onCreated()
      setOpen(false)
      form.reset({ role: 'Manager' })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to create user'
      toast.error(msg)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus weight="bold" />Add User</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[14px]">New System User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(v => mutation.mutate(v))} className="space-y-3">

            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">Full Name</FormLabel>
                <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">Email</FormLabel>
                <FormControl><Input type="email" placeholder="jane@example.com" {...field} /></FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">Password</FormLabel>
                <FormControl><Input type="password" placeholder="Min 6 characters" {...field} /></FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            <DialogFooter className="pt-1">
              <Button variant="outline" size="sm" type="button" onClick={() => setOpen(false)}>Cancel</Button>
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

/* ─── Edit User Dialog ───────────────────────────────────────────── */
function EditUserDialog({ user, onUpdated }: { user: SystemUser; onUpdated: () => void }) {
  const [open, setOpen] = useState(false)

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { fullName: user.fullName, role: user.role, password: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: EditValues) =>
      api.put(`/users/${user.id}`, {
        fullName: values.fullName,
        role:     values.role,
        password: values.password || undefined,
      }),
    onSuccess: () => {
      toast.success('User updated')
      onUpdated()
      setOpen(false)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to update user'
      toast.error(msg)
    },
  })

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (v) form.reset({ fullName: user.fullName, role: user.role, password: '' }) }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <PencilSimple weight="bold" className="text-[12px]" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[14px]">Edit User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(v => mutation.mutate(v))} className="space-y-3">

            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">Full Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px]">New Password <span className="text-muted-foreground">(leave blank to keep current)</span></FormLabel>
                <FormControl><Input type="password" placeholder="Leave blank to keep current" {...field} /></FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            <DialogFooter className="pt-1">
              <Button variant="outline" size="sm" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <CircleNotch weight="bold" className="animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Delete Confirm Dialog ──────────────────────────────────────── */
function DeleteUserDialog({ user, onDeleted }: { user: SystemUser; onDeleted: () => void }) {
  const [open, setOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: () => api.delete(`/users/${user.id}`),
    onSuccess: () => {
      toast.success('User deleted')
      onDeleted()
      setOpen(false)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to delete user'
      toast.error(msg)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <Trash weight="bold" className="text-[12px]" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[14px]">Delete User</DialogTitle>
        </DialogHeader>
        <p className="text-[12px] text-muted-foreground">
          Are you sure you want to delete <span className="text-foreground font-medium">{user.fullName}</span>?
          This action cannot be undone.
        </p>
        <DialogFooter className="pt-1">
          <Button variant="outline" size="sm" type="button" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <CircleNotch weight="bold" className="animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Role badge ─────────────────────────────────────────────────── */
function RoleBadge({ role }: { role: string }) {
  const cls = role === 'Admin'
    ? 'bg-primary/15 text-primary border-primary/30'
    : 'bg-secondary text-secondary-foreground border-border'
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0 leading-5 text-[10px] font-medium ${cls}`}>
      {role}
    </span>
  )
}

/* ─── Page ───────────────────────────────────────────────────────── */
export function UsersPage() {
  const currentUser = getUser()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['system-users'],
    queryFn: () =>
      api.get<{ items: SystemUser[]; totalCount: number }>('/users', {
        params: { page: 1, pageSize: 100 },
      }).then(r => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['system-users'] })

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-foreground">System Users</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {data ? `${data.totalCount} user${data.totalCount !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>
        <AddUserDialog onCreated={invalidate} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data?.items?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12 text-[12px]">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
                {data?.items?.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-foreground text-[12px]">{u.fullName}</TableCell>
                    <TableCell className="text-muted-foreground text-[11px] font-mono">{u.email}</TableCell>
                    <TableCell><RoleBadge role={u.role} /></TableCell>
                    <TableCell className="text-muted-foreground text-[12px] font-mono">{formatDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5 justify-end">
                        <EditUserDialog user={u} onUpdated={invalidate} />
                        {u.id !== currentUser?.id && (
                          <DeleteUserDialog user={u} onDeleted={invalidate} />
                        )}
                      </div>
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
