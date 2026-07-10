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
  if (project.status === 'completed') return ''
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
