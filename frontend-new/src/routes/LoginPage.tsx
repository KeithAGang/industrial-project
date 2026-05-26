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
import { 
  Pulse, 
  ShieldCheck, 
  Envelope, 
  Lock, 
  CircleNotch 
} from '@phosphor-icons/react'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
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
      // Update axios defaults immediately so first page queries include the token
      api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
      await navigate({ to: '/' })
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-card border-r border-border p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Pulse weight="duotone" className="text-xl text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">LifecycleIQ</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight text-foreground mb-4">
            Solution Lifecycle<br />
            <span className="text-primary">Command Center</span>
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xs">
            Monitor solution health, track SLA compliance, and stay ahead of risk with AI-powered briefings.
          </p>
        </div>

        <div className="relative space-y-4">
          {[
            { icon: ShieldCheck, label: 'Weighted Factor Analysis', desc: 'Quantify solution health with precision' },
            { icon: Pulse, label: 'Real-time SHI Scoring', desc: 'Continuous risk tier monitoring' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Icon weight="duotone" className="text-lg text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right login form */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 bg-background">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Access your command center</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground" />
                        <Input className="pl-9" placeholder="admin@lifecycleiq.com" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground" />
                        <Input className="pl-9" type="password" placeholder="••••••••" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <CircleNotch weight="bold" className="text-lg animate-spin" />}
                Sign in
              </Button>
            </form>
          </Form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Imaging Solutions — Internal Platform
          </p>
        </div>
      </div>
    </div>
  )
}
