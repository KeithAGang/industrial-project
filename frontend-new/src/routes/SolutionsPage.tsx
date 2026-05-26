import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import api from '@/lib/api'
import type { PagedResult, Solution } from '@/types'
import { getRiskBadgeClass, getSlaStatusClass, formatDate } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { MagnifyingGlass, ArrowRight, CaretLeft, CaretRight } from '@phosphor-icons/react'

const PAGE_SIZE = 20

export function SolutionsPage() {
  const [search, setSearch] = useState('')
  const [riskTier, setRiskTier] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['solutions', search, riskTier, page],
    queryFn: () =>
      api.get<PagedResult<Solution>>('/solutions', {
        params: {
          search: search || undefined,
          riskTier: riskTier === 'all' ? undefined : riskTier,
          page,
          pageSize: PAGE_SIZE,
        },
      }).then(r => r.data),
  })

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 1

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Solutions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {data ? `${data.totalCount} solution${data.totalCount !== 1 ? 's' : ''} found` : 'Loading…'}
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search solutions or clients…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={riskTier} onValueChange={v => { setRiskTier(v); setPage(1) }}>
          <SelectTrigger className="w-44">
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
            <div className="p-6 space-y-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
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
                  <TableHead>SLA Tier</TableHead>
                  <TableHead>SLA Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data?.items?.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">No solutions found</TableCell>
                  </TableRow>
                )}
                {data?.items?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link to="/solutions/$id" params={{ id: s.id }} className="font-medium text-foreground hover:text-primary transition-colors">
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.clientName}</TableCell>
                    <TableCell>
                      {s.latestShi ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                s.latestShi.riskTier === 'Critical' ? 'bg-red-500' :
                                s.latestShi.riskTier === 'High' ? 'bg-orange-500' :
                                s.latestShi.riskTier === 'Medium' ? 'bg-amber-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${s.latestShi.shiScore * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-foreground">{(s.latestShi.shiScore * 100).toFixed(1)}</span>
                        </div>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      {s.latestShi ? (
                        <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getRiskBadgeClass(s.latestShi.riskTier)}`}>
                          {s.latestShi.riskTier}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(s.licenceExpiryDate)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.slaTier}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getSlaStatusClass(s.slaComplianceStatus)}`}>
                        {s.slaComplianceStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link to="/solutions/$id" params={{ id: s.id }}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowRight weight="bold" className="text-sm" />
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
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <CaretLeft weight="bold" className="text-lg" />Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next<CaretRight weight="bold" className="text-lg" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
