import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '@/lib/api'
import type { Solution, ShiRecord } from '@/types'
import { getRiskBadgeClass, getSlaStatusClass, getStatusBadgeClass, formatDate } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  CaretLeft,
  CircleNotch,
  Cpu,
  Tag,
  CalendarBlank,
  Shield,
  Wrench,
  CaretUp,
  CaretDown,
  ChartLine,
} from '@phosphor-icons/react'

const CHART_BG   = 'hsl(222 15% 9%)'
const CHART_LINE = 'hsl(222 10% 16%)'
const CHART_TEXT = 'hsl(220 8% 44%)'

function SHIFactor({ label, score, weight }: { label: string; score: number; weight: number }) {
  const weighted = score * weight
  const pct = Math.round(weighted * 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">
          {(score * 100).toFixed(1)} × {(weight * 100).toFixed(0)}% = {pct}
        </span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function SolutionDetailPage() {
  const params = useParams({ strict: false }) as { id: string }
  const id = params.id
  const queryClient = useQueryClient()
  const [briefingOpen, setBriefingOpen] = useState(false)

  const { data: solution, isLoading } = useQuery({
    queryKey: ['solution', id],
    queryFn: () => api.get<Solution>(`/solutions/${id}`).then(r => r.data),
    enabled: !!id,
  })

  const { data: history } = useQuery({
    queryKey: ['solution-shi-history', id],
    queryFn: () => api.get<ShiRecord[]>(`/solutions/${id}/shi-history`).then(r => r.data),
    enabled: !!id,
  })

  const { data: changeRequests } = useQuery({
    queryKey: ['change-requests', id],
    queryFn: () => api.get(`/change-requests?solutionId=${id}&pageSize=50`).then(r => r.data),
    enabled: !!id,
  })

  const computeMutation = useMutation({
    mutationFn: () => api.post(`/solutions/${id}/compute-shi`),
    onSuccess: () => {
      toast.success('SHI computed successfully')
      queryClient.invalidateQueries({ queryKey: ['solution', id] })
      queryClient.invalidateQueries({ queryKey: ['solution-shi-history', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
    onError: () => toast.error('Failed to compute SHI'),
  })

  const chartData =
    history
      ?.slice()
      .reverse()
      .map((r, i) => ({
        index: i + 1,
        score: parseFloat((r.shiScore * 100).toFixed(2)),
        date:  formatDate(r.computedAt),
      })) ?? []

  const shi = solution?.latestShi

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  if (!solution) return <div className="p-4 text-[12px] text-muted-foreground">Solution not found.</div>

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/solutions"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground mb-1.5 transition-colors"
          >
            <CaretLeft weight="bold" className="text-[11px]" />
            Solutions
          </Link>
          <h1 className="text-base font-semibold text-foreground">{solution.name}</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">{solution.clientName}</p>
        </div>
        <Button onClick={() => computeMutation.mutate()} disabled={computeMutation.isPending} size="sm">
          {computeMutation.isPending
            ? <CircleNotch weight="bold" className="animate-spin" />
            : <Cpu weight="duotone" />}
          Compute SHI
        </Button>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          { icon: Tag,           label: 'Version',          value: `${solution.currentVersion} → ${solution.latestVersion}` },
          { icon: CalendarBlank, label: 'Licence Expiry',   value: formatDate(solution.licenceExpiryDate) },
          { icon: Shield,        label: 'SLA Tier',         value: solution.slaTier },
          { icon: Wrench,        label: 'Last Maintenance', value: formatDate(solution.lastMaintenanceDate) },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon weight="duotone" className="text-[12px] text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{label}</span>
              </div>
              <span className="text-[12px] font-medium text-foreground font-mono">{value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status badges */}
      <div className="flex gap-1.5 flex-wrap">
        {shi && (
          <span className={`inline-flex items-center rounded border px-1.5 py-0 leading-5 text-[10px] font-medium ${getRiskBadgeClass(shi.riskTier)}`}>
            Risk: {shi.riskTier}
          </span>
        )}
        <span className={`inline-flex items-center rounded border px-1.5 py-0 leading-5 text-[10px] font-medium ${getSlaStatusClass(solution.slaComplianceStatus)}`}>
          SLA: {solution.slaComplianceStatus}
        </span>
        {shi && (
          <span className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0 leading-5 text-[10px] font-mono text-foreground">
            SHI: {(shi.shiScore * 100).toFixed(2)}
          </span>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="shi">
        <TabsList>
          <TabsTrigger value="shi">Health Index</TabsTrigger>
          <TabsTrigger value="history">SHI History</TabsTrigger>
          <TabsTrigger value="changes">Change Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="shi" className="space-y-3 mt-3">
          {shi ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Factor Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SHIFactor label="Licence Urgency"    score={shi.licenceUrgencyScore}    weight={shi.licenceUrgencyWeight} />
                  <SHIFactor label="Version Gap"        score={shi.versionGapScore}        weight={shi.versionGapWeight} />
                  <SHIFactor label="SLA Compliance"     score={shi.slaComplianceScore}     weight={shi.slaComplianceWeight} />
                  <SHIFactor label="Maintenance Recency" score={shi.maintenanceRecencyScore} weight={shi.maintenanceRecencyWeight} />
                </CardContent>
              </Card>

              {shi.aiBriefing && (
                <Collapsible open={briefingOpen} onOpenChange={setBriefingOpen}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CollapsibleTrigger asChild>
                        <button className="flex w-full items-center justify-between text-[13px] font-semibold text-foreground hover:text-primary transition-colors">
                          <span>AI Briefing</span>
                          {briefingOpen
                            ? <CaretUp weight="bold" className="text-[13px]" />
                            : <CaretDown weight="bold" className="text-[13px]" />}
                        </button>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap border border-border rounded p-3 bg-muted/20 font-mono">
                          {shi.aiBriefing}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Cpu weight="duotone" className="text-3xl mb-2 opacity-30 mx-auto" />
                <p className="text-[12px]">No SHI computed yet. Click "Compute SHI" to generate.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5">
                <ChartLine weight="duotone" className="text-[14px] text-primary" />
                SHI Score History (last 30)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="py-10 text-center text-[12px] text-muted-foreground">No history available</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="shiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="hsl(211 98% 62%)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(211 98% 62%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_LINE} />
                    <XAxis dataKey="index" tick={{ fontSize: 10, fill: CHART_TEXT }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: CHART_TEXT }} />
                    <Tooltip
                      contentStyle={{
                        background: CHART_BG,
                        border: `1px solid ${CHART_LINE}`,
                        borderRadius: '4px',
                        color: '#d8dce8',
                        fontSize: 11,
                        fontFamily: 'IBM Plex Mono',
                      }}
                      labelStyle={{ color: '#d8dce8' }}
                      itemStyle={{ color: '#d8dce8' }}
                      formatter={(v: number) => [v.toFixed(2), 'SHI Score']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(211 98% 62%)"
                      strokeWidth={1.5}
                      fill="url(#shiGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes" className="mt-3">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!changeRequests?.items?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-[12px]">
                        No change requests
                      </TableCell>
                    </TableRow>
                  )}
                  {changeRequests?.items?.map((cr: any) => (
                    <TableRow key={cr.id}>
                      <TableCell className="font-medium text-[12px]">{cr.title}</TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
