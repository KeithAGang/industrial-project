import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import api from '@/lib/api'
import { setToken, setUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { User } from '@/types'
import { Pulse, ShieldCheck, Envelope, Lock, CircleNotch } from '@phosphor-icons/react'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const { data } = await api.post<{ accessToken: string; user: User }>('/auth/login', values)
      setToken(data.accessToken)
      setUser(data.user)
      api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
      await navigate({ to: '/' })
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[420px] flex-col justify-between border-r border-border bg-card p-10 relative overflow-hidden shrink-0">
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Subtle glow */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
            <Pulse weight="fill" className="text-[13px] text-primary-foreground" />
          </div>
          <span className="text-[14px] font-semibold tracking-tight text-foreground">LifecycleIQ</span>
        </div>

        {/* Hero copy */}
        <div className="relative space-y-5">
          <div>
            <h1 className="text-2xl font-semibold leading-snug text-foreground mb-2">
              Solution Lifecycle<br />
              <span className="text-primary">Command Center</span>
            </h1>
            <p className="text-[12px] text-muted-foreground leading-relaxed max-w-xs">
              Monitor solution health, track SLA compliance, and stay ahead of risk with AI-powered briefings.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              { icon: ShieldCheck, label: 'Weighted Factor Analysis', desc: 'Quantify solution health with precision' },
              { icon: Pulse,       label: 'Real-time SHI Scoring',    desc: 'Continuous risk tier monitoring' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10">
                  <Icon weight="duotone" className="text-[13px] text-primary" />
                </div>
                <div>
                  <p className="text-[12px] font-medium text-foreground leading-tight">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
            Imaging Solutions — Internal Platform
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-10">
        <div className="w-full max-w-[320px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Pulse weight="fill" className="text-[11px] text-primary-foreground" />
            </div>
            <span className="text-[13px] font-semibold text-foreground">LifecycleIQ</span>
          </div>

          <div className="mb-6">
            <h2 className="text-[16px] font-semibold text-foreground">Sign in</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Access your command center</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                      Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Envelope className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground" />
                        <Input className="pl-8" placeholder="admin@lifecycleiq.com" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground" />
                        <Input className="pl-8" type="password" placeholder="••••••••" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-1" disabled={loading}>
                {loading && <CircleNotch weight="bold" className="animate-spin" />}
                Sign in
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
