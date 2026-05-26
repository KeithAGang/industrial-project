import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import api from '@/lib/api'
import type { DashboardStats } from '@/types'
import { getRiskBadgeClass, formatDate } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Desktop, 
  Warning, 
  CheckCircle, 
  ChartPieSlice, 
  TrendUp,
  IconProps
} from '@phosphor-icons/react'

const RISK_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#22c55e',
}

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats').then(r => r.data),
  })

  const pieData = stats
    ? [
        { name: 'Critical', value: stats.criticalCount, color: RISK_COLORS.Critical },
        { name: 'High', value: stats.highCount, color: RISK_COLORS.High },
        { name: 'Medium', value: stats.mediumCount, color: RISK_COLORS.Medium },
        { name: 'Low', value: stats.lowCount, color: RISK_COLORS.Low },
      ].filter(d => (d.value ?? 0) > 0)
    : []

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Solution lifecycle overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard loading={isLoading} label="Total Solutions" value={stats?.totalSolutions}
          icon={Desktop} iconColor="text-primary" />
        <StatCard loading={isLoading} label="Critical" value={stats?.criticalCount}
          icon={Warning} iconColor="text-red-400" valueColor="text-red-400" />
        <StatCard loading={isLoading} label="High Risk" value={stats?.highCount}
          icon={Warning} iconColor="text-orange-400" valueColor="text-orange-400" />
        <StatCard loading={isLoading} label="Medium / Low"
          value={stats ? `${stats.mediumCount ?? 0} / ${stats.lowCount ?? 0}` : undefined}
          icon={CheckCircle} iconColor="text-green-400" valueColor="text-green-400" />
      </div>

      {/* Chart + avg row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ChartPieSlice weight="duotone" className="text-lg text-primary" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(215 25% 12%)', border: '1px solid hsl(215 20% 20%)', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend formatter={(value) => <span style={{ color: 'hsl(215 15% 65%)' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendUp weight="duotone" className="text-lg text-primary" />
              Avg SHI Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-40 gap-2">
            {isLoading ? (
              <Skeleton className="h-16 w-24" />
            ) : (
              <>
                <span className="text-5xl font-bold font-mono text-foreground">
                  {stats ? ((stats.avgShiScore ?? 0) * 100).toFixed(1) : '—'}
                </span>
                <span className="text-sm text-muted-foreground">out of 100</span>
                <span className="text-xs text-muted-foreground">(higher = more risk)</span>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top risk table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Warning weight="duotone" className="text-lg text-primary" />
            Top Risk Solutions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Solution</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>SHI Score</TableHead>
                  <TableHead>Risk Tier</TableHead>
                  <TableHead>Licence Expiry</TableHead>
                  <TableHead>SLA Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!stats?.topRiskSolutions?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No solutions found</TableCell>
                  </TableRow>
                )}
                {stats?.topRiskSolutions?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link to="/solutions/$id" params={{ id: s.id }} className="font-medium text-foreground hover:text-primary transition-colors">
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.clientName}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{s.latestShi ? (s.latestShi.shiScore * 100).toFixed(1) : '—'}</span>
                    </TableCell>
                    <TableCell>
                      {s.latestShi && (
                        <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getRiskBadgeClass(s.latestShi.riskTier)}`}>
                          {s.latestShi.riskTier}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(s.licenceExpiryDate)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                        s.slaComplianceStatus === 'Compliant' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                        s.slaComplianceStatus === 'AtRisk' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                        'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}>
                        {s.slaComplianceStatus}
                      </span>
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

function StatCard({ label, value, icon: Icon, iconColor, valueColor, loading }: {
  label: string; value?: number | string; icon: React.ComponentType<IconProps>
  iconColor: string; valueColor?: string; loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</CardTitle>
          <Icon weight="duotone" className={`text-lg ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-20" /> : (
          <span className={`text-3xl font-bold font-mono ${valueColor ?? 'text-primary'}`}>{value ?? '—'}</span>
        )}
      </CardContent>
    </Card>
  )
}
