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
  IconProps,
} from '@phosphor-icons/react'

const RISK_COLORS = {
  Critical: '#ef4444',
  High:     '#f97316',
  Medium:   '#f59e0b',
  Low:      '#22c55e',
}

const CHART_BG   = 'hsl(222 15% 9%)'
const CHART_LINE = 'hsl(222 10% 16%)'
const CHART_TEXT = 'hsl(220 8% 44%)'

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats').then(r => r.data),
  })

  const pieData = stats
    ? [
        { name: 'Critical', value: stats.criticalCount, color: RISK_COLORS.Critical },
        { name: 'High',     value: stats.highCount,     color: RISK_COLORS.High },
        { name: 'Medium',   value: stats.mediumCount,   color: RISK_COLORS.Medium },
        { name: 'Low',      value: stats.lowCount,      color: RISK_COLORS.Low },
      ].filter(d => (d.value ?? 0) > 0)
    : []

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-base font-semibold text-foreground">Dashboard</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Solution lifecycle overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard loading={isLoading} label="Total Solutions" value={stats?.totalSolutions}
          icon={Desktop} iconColor="text-primary" />
        <StatCard loading={isLoading} label="Critical" value={stats?.criticalCount}
          icon={Warning} iconColor="text-red-400" valueColor="text-red-400" />
        <StatCard loading={isLoading} label="High Risk" value={stats?.highCount}
          icon={Warning} iconColor="text-orange-400" valueColor="text-orange-400" />
        <StatCard loading={isLoading} label="Med / Low"
          value={stats ? `${stats.mediumCount ?? 0} / ${stats.lowCount ?? 0}` : undefined}
          icon={CheckCircle} iconColor="text-green-400" valueColor="text-green-400" />
      </div>

      {/* Chart + avg row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5">
              <ChartPieSlice weight="duotone" className="text-[14px] text-primary" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-44 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map(entry => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: CHART_BG,
                      border: `1px solid ${CHART_LINE}`,
                      borderRadius: '4px',
                      color: '#d8dce8',
                      fontSize: 12,
                      fontFamily: 'IBM Plex Mono',
                    }}
                    labelStyle={{ color: '#d8dce8' }}
                    itemStyle={{ color: '#d8dce8' }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend
                    iconSize={8}
                    formatter={v => (
                      <span style={{ color: CHART_TEXT, fontSize: 11 }}>{v}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5">
              <TrendUp weight="duotone" className="text-[14px] text-primary" />
              Avg SHI Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-36 gap-1">
            {isLoading ? (
              <Skeleton className="h-14 w-20" />
            ) : (
              <>
                <span className="text-4xl font-semibold font-mono text-foreground">
                  {stats ? ((stats.avgShiScore ?? 0) * 100).toFixed(1) : '—'}
                </span>
                <span className="text-[11px] text-muted-foreground">out of 100</span>
                <span className="text-[10px] text-muted-foreground/60">(higher = more risk)</span>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top risk table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5">
            <Warning weight="duotone" className="text-[14px] text-primary" />
            Top Risk Solutions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Solution</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>SHI</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Licence Expiry</TableHead>
                  <TableHead>SLA Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!stats?.topRiskSolutions?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-[12px]">
                      No solutions found
                    </TableCell>
                  </TableRow>
                )}
                {stats?.topRiskSolutions?.map(s => (
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
                      <span className="font-mono text-[12px]">
                        {s.latestShi ? (s.latestShi.shiScore * 100).toFixed(1) : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {s.latestShi && (
                        <span className={`inline-flex items-center rounded border px-1.5 py-0 leading-5 text-[10px] font-medium ${getRiskBadgeClass(s.latestShi.riskTier)}`}>
                          {s.latestShi.riskTier}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[12px] font-mono">
                      {formatDate(s.licenceExpiryDate)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded border px-1.5 py-0 leading-5 text-[10px] font-medium ${
                        s.slaComplianceStatus === 'Compliant' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                        s.slaComplianceStatus === 'AtRisk'    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
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

function StatCard({
  label, value, icon: Icon, iconColor, valueColor, loading,
}: {
  label: string
  value?: number | string
  icon: React.ComponentType<IconProps>
  iconColor: string
  valueColor?: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon weight="duotone" className={`text-[13px] shrink-0 ${iconColor}`} />
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground truncate">
              {label}
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-6 w-10 shrink-0" />
          ) : (
            <span className={`text-xl font-semibold font-mono shrink-0 ${valueColor ?? 'text-primary'}`}>
              {value ?? '—'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
