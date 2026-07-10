export type ProjectStatus = 'active' | 'paused' | 'completed'

export interface Project {
  id: string
  name: string
  description: string
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

export type FilterKey = 'all' | 'active' | 'overdue' | 'completed'
export type SortKey = 'updated' | 'deadline' | 'progress'
