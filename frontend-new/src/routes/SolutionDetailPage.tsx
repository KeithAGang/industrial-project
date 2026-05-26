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
  ChartLine
} from '@phosphor-icons/react'

function SHIFactor({ label, score, weight }: { label: string; score: number; weight: number }) {
  const weighted = score * weight
  const pct = Math.round(weighted * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{(score * 100).toFixed(1)} × {(weight * 100).toFixed(0)}% = {pct}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
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

  const chartData = history?.slice().reverse().map((r, i) => ({
    index: i + 1,
    score: parseFloat((r.shiScore * 100).toFixed(2)),
    date: formatDate(r.computedAt),
  })) ?? []

  const shi = solution?.latestShi

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!solution) return <div className="p-6 text-muted-foreground">Solution not found.</div>

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/solutions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <CaretLeft weight="bold" className="text-base" />
            Solutions
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{solution.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{solution.clientName}</p>
        </div>
        <Button onClick={() => computeMutation.mutate()} disabled={computeMutation.isPending} size="sm">
          {computeMutation.isPending
            ? <CircleNotch weight="bold" className="text-lg animate-spin" />
            : <Cpu weight="duotone" className="text-lg" />}
          Compute SHI
        </Button>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Tag, label: 'Version', value: `${solution.currentVersion} → ${solution.latestVersion}` },
          { icon: CalendarBlank, label: 'Licence Expiry', value: formatDate(solution.licenceExpiryDate) },
          { icon: Shield, label: 'SLA Tier', value: solution.slaTier },
          { icon: Wrench, label: 'Last Maintenance', value: formatDate(solution.lastMaintenanceDate) },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon weight="duotone" className="text-sm text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <span className="text-sm font-medium text-foreground font-mono">{value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Badges */}
      <div className="flex gap-2 flex-wrap">
        {shi && (
          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getRiskBadgeClass(shi.riskTier)}`}>
            Risk: {shi.riskTier}
          </span>
        )}
        <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getSlaStatusClass(solution.slaComplianceStatus)}`}>
          SLA: {solution.slaComplianceStatus}
        </span>
        {shi && (
          <span className="inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-0.5 text-xs font-mono text-foreground">
            SHI: {(shi.shiScore * 100).toFixed(2)}
          </span>
        )}
      </div>

      <Tabs defaultValue="shi">
        <TabsList>
          <TabsTrigger value="shi">Health Index</TabsTrigger>
          <TabsTrigger value="history">SHI History</TabsTrigger>
          <TabsTrigger value="changes">Change Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="shi" className="space-y-4 mt-4">
          {shi ? (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">Factor Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <SHIFactor label="Licence Urgency" score={shi.licenceUrgencyScore} weight={shi.licenceUrgencyWeight} />
                  <SHIFactor label="Version Gap" score={shi.versionGapScore} weight={shi.versionGapWeight} />
                  <SHIFactor label="SLA Compliance" score={shi.slaComplianceScore} weight={shi.slaComplianceWeight} />
                  <SHIFactor label="Maintenance Recency" score={shi.maintenanceRecencyScore} weight={shi.maintenanceRecencyWeight} />
                </CardContent>
              </Card>

              {shi.aiBriefing && (
                <Collapsible open={briefingOpen} onOpenChange={setBriefingOpen}>
                  <Card>
                    <CardHeader className="pb-3">
                      <CollapsibleTrigger asChild>
                        <button className="flex w-full items-center justify-between text-base font-semibold text-foreground hover:text-primary transition-colors">
                          <span>AI Briefing</span>
                          {briefingOpen ? <CaretUp weight="bold" className="text-lg" /> : <CaretDown weight="bold" className="text-lg" />}
                        </button>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap border border-border rounded-md p-4 bg-muted/30 font-mono text-xs">
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
                <Cpu weight="duotone" className="text-4xl mb-3 opacity-40 mx-auto" />
                <p>No SHI computed yet. Click "Compute SHI" to generate.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ChartLine weight="duotone" className="text-lg text-primary" />
                SHI Score History (last 30)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">No history available</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="shiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(210 100% 66%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(210 100% 66%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 20%)" />
                    <XAxis dataKey="index" tick={{ fontSize: 10, fill: 'hsl(215 15% 65%)' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(215 15% 65%)' }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(215 25% 12%)', border: '1px solid hsl(215 20% 20%)', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                      formatter={(v: number) => [v.toFixed(2), 'SHI Score']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                    />
                    <Area type="monotone" dataKey="score" stroke="hsl(210 100% 66%)" strokeWidth={2} fill="url(#shiGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes" className="mt-4">
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
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No change requests</TableCell>
                    </TableRow>
                  )}
                  {changeRequests?.items?.map((cr: any) => (
                    <TableRow key={cr.id}>
                      <TableCell className="font-medium">{cr.title}</TableCell>
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
