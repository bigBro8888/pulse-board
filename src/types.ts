export type ProjectStatus = 'active' | 'paused' | 'completed'

export type FollowUpStatus = 'pending' | 'in_progress' | 'completed'

export interface FollowUpRecord {
  id: string
  title: string
  status: FollowUpStatus
  owner: string
  deadline: string
  notes: string
  createdAt: number
  updatedAt: number
}

export interface Project {
  id: string
  name: string
  description: string
  followUps: FollowUpRecord[]
  deadline: string
  progress: number
  status: ProjectStatus
  owner: string
  createdAt: number
  updatedAt: number
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: '进行中',
  paused: '已暂停',
  completed: '已完成',
}

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
}

export type FilterKey = 'all' | 'active' | 'paused' | 'overdue' | 'completed'
export type SortKey = 'updated' | 'deadline' | 'progress'
