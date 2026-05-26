export interface User {
  id: string
  email: string
  fullName: string
  role: 'Admin' | 'Manager'
}

export interface ShiRecord {
  id: string
  solutionId: string
  shiScore: number
  riskTier: 'Low' | 'Medium' | 'High' | 'Critical'
  licenceUrgencyScore: number
  versionGapScore: number
  slaComplianceScore: number
  maintenanceRecencyScore: number
  licenceUrgencyWeight: number
  versionGapWeight: number
  slaComplianceWeight: number
  maintenanceRecencyWeight: number
  aiBriefing: string | null
  computedAt: string
}

export interface Solution {
  id: string
  clientId: string
  clientName: string
  name: string
  description: string | null
  currentVersion: string
  latestVersion: string
  licenceKey: string | null
  licenceExpiryDate: string
  slaTier: 'Basic' | 'Standard' | 'Premium' | 'Critical'
  slaComplianceStatus: 'Compliant' | 'AtRisk' | 'Breached'
  lastMaintenanceDate: string
  isActive: boolean
  latestShi: ShiRecord | null
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string | null
  activeSolutionCount: number
  createdAt: string
}

export interface Notification {
  id: string
  solutionId: string
  solutionName: string
  type: 'Info' | 'Low' | 'Medium' | 'High' | 'Critical'
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface ChangeRequest {
  id: string
  solutionId: string
  solutionName: string
  requestedById: string
  requestedByName: string
  title: string
  description: string
  status: 'Pending' | 'InProgress' | 'Approved' | 'Rejected' | 'Completed'
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  createdAt: string
  resolvedAt: string | null
}

export interface DashboardStats {
  totalSolutions: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  avgShiScore: number
  topRiskSolutions: Solution[]
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
}

export interface NotificationPagedResult {
  items: Notification[]
  totalCount: number
  unreadCount: number
  page: number
  pageSize: number
}

export function getRiskBadgeClass(tier: string): string {
  switch (tier) {
    case 'Critical': return 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20'
    case 'High': return 'bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/20'
    case 'Medium': return 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
    case 'Low': return 'bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/20'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}

export function getSlaStatusClass(status: string): string {
  switch (status) {
    case 'Compliant': return 'bg-green-500/15 text-green-400 border-green-500/30'
    case 'AtRisk': return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case 'Breached': return 'bg-red-500/15 text-red-400 border-red-500/30'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Pending': return 'bg-slate-500/15 text-slate-400 border-slate-500/30'
    case 'InProgress': return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    case 'Approved': return 'bg-green-500/15 text-green-400 border-green-500/30'
    case 'Rejected': return 'bg-red-500/15 text-red-400 border-red-500/30'
    case 'Completed': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

export function getRiskBarColor(tier: string): string {
  switch (tier) {
    case 'Critical': return 'bg-red-500'
    case 'High': return 'bg-orange-500'
    case 'Medium': return 'bg-amber-500'
    case 'Low': return 'bg-green-500'
    default: return 'bg-primary'
  }
}
