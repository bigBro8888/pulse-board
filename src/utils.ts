import type { Project } from './types'

export function daysLeft(project: Project): number | null {
  if (!project.deadline || project.status === 'completed') return null
  const end = new Date(project.deadline + 'T23:59:59')
  if (Number.isNaN(end.getTime())) return null
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const deadlineStart = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.round((deadlineStart.getTime() - todayStart.getTime()) / 86400000)
}

export function deadlineAlertClass(project: Project): string {
  if (project.status === 'completed' || project.status === 'paused') return ''
  const left = daysLeft(project)
  if (left === null) return ''
  if (left === 2) return 'deadline-warn-2d'
  if (left === 1 || left === 0) return 'deadline-warn-1d'
  return ''
}

export function isOverdue(project: Project): boolean {
  const left = daysLeft(project)
  return left !== null && left < 0
}

export function isDueSoon(project: Project, withinDays = 7): boolean {
  if (!project.deadline || project.status === 'completed') return false
  const end = new Date(project.deadline + 'T23:59:59')
  const now = Date.now()
  const diff = end.getTime() - now
  return diff >= 0 && diff <= withinDays * 86400000
}

export function formatDeadline(deadline: string): string {
  if (!deadline) return '未设置'
  return deadline
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return new Date(ts).toLocaleDateString('zh-CN')
}

export function ownerInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  return trimmed.slice(0, 1).toUpperCase()
}

/** P0 已逾期 · P1 三天内 · P2 约一周(4–9天) · P3 十天及以上/无截止日期 */
export type Priority = 'P0' | 'P1' | 'P2' | 'P3'

export const PRIORITY_LABELS: Record<Priority, string> = {
  P0: '已逾期',
  P1: '三天内',
  P2: '约一周',
  P3: '较充裕',
}

export function getPriority(project: Project): Priority {
  if (project.status === 'completed') return 'P3'
  const left = daysLeft(project)
  if (left === null) return 'P3'
  if (left < 0) return 'P0'
  if (left <= 3) return 'P1'
  if (left <= 9) return 'P2'
  return 'P3'
}

export function normalizeAttachmentUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const parsed = new URL(withProto)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

export function inferAttachmentName(url: string): string {
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/').filter(Boolean)
    let last = parts[parts.length - 1] || ''
    last = decodeURIComponent(last.replace(/\+/g, ' '))
    if (!last || /^(view|edit|preview|d|file|document|open|share)$/i.test(last)) {
      return `${parsed.hostname.replace(/^www\./, '')} 文档`
    }
    return last.length > 48 ? `${last.slice(0, 45)}…` : last
  } catch {
    return '附件'
  }
}

export function countProjectAttachments(project: Project): number {
  return project.followUps.reduce(
    (sum, item) => sum + (item.attachments?.length ?? 0),
    0,
  )
}
