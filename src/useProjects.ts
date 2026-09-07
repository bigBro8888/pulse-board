import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchRemoteProjects, saveRemoteProjects, type SyncStatus } from './api'
import type {
  FilterKey,
  FollowUpRecord,
  FollowUpStatus,
  Project,
  ProjectStatus,
  SortKey,
} from './types'
import { isOverdue } from './utils'

const STORAGE_KEY = 'lpm-projects-v2'

export type ProjectInput = {
  name: string
  description: string
  deadline: string
  progress: number
  status: ProjectStatus
  owner: string
}

export type ProjectPatch = Partial<ProjectInput> & {
  followUps?: FollowUpRecord[]
}

function normalizeFollowUp(raw: unknown, fallbackId: string): FollowUpRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Partial<FollowUpRecord>
  if (!item.title || !String(item.title).trim()) return null
  const now = Date.now()
  const status: FollowUpStatus =
    item.status === 'in_progress' || item.status === 'completed'
      ? item.status
      : 'pending'
  return {
    id: String(item.id || fallbackId),
    title: String(item.title).trim(),
    status,
    owner: String(item.owner ?? '未指定').trim() || '未指定',
    deadline: String(item.deadline ?? ''),
    notes: String(item.notes ?? ''),
    createdAt: Number(item.createdAt) || now,
    updatedAt: Number(item.updatedAt) || Number(item.createdAt) || now,
  }
}

function normalize(raw: unknown): Project | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Partial<Project>
  if (!p.id || !p.name) return null
  const now = Date.now()
  const description = String(p.description ?? '')
  const storedFollowUps = Array.isArray(p.followUps)
    ? p.followUps
        .map((item, index) => normalizeFollowUp(item, `${p.id}-follow-up-${index}`))
        .filter((item): item is FollowUpRecord => item !== null)
    : []
  const followUps =
    storedFollowUps.length > 0 || !description.trim()
      ? storedFollowUps
      : [
          {
            id: `${p.id}-legacy-description`,
            title: description.trim(),
            status: 'pending' as const,
            owner: String(p.owner ?? '未指定').trim() || '未指定',
            deadline: String(p.deadline ?? ''),
            notes: '由原项目说明自动迁移',
            createdAt: Number(p.createdAt) || now,
            updatedAt: Number(p.updatedAt) || Number(p.createdAt) || now,
          },
        ]
  return {
    id: String(p.id),
    name: String(p.name),
    description,
    followUps,
    deadline: String(p.deadline ?? ''),
    progress: Math.min(100, Math.max(0, Number(p.progress) || 0)),
    status: (p.status as ProjectStatus) || 'active',
    owner: String(p.owner ?? '未指定'),
    createdAt: Number(p.createdAt) || now,
    updatedAt: Number(p.updatedAt) || Number(p.createdAt) || now,
  }
}

function normalizeList(raw: unknown[]): Project[] {
  return raw.map(normalize).filter((p): p is Project => p !== null)
}

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const legacy = localStorage.getItem('lpm-projects')
      if (!legacy) return []
      const parsed = JSON.parse(legacy) as unknown[]
      return Array.isArray(parsed) ? normalizeList(parsed) : []
    }
    const parsed = JSON.parse(raw) as unknown[]
    return Array.isArray(parsed) ? normalizeList(parsed) : []
  } catch {
    return []
  }
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

function sortProjects(list: Project[], sort: SortKey): Project[] {
  const copy = [...list]
  if (sort === 'updated') {
    return copy.sort((a, b) => b.updatedAt - a.updatedAt)
  }
  if (sort === 'deadline') {
    return copy.sort((a, b) => {
      if (!a.deadline && !b.deadline) return b.updatedAt - a.updatedAt
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return a.deadline.localeCompare(b.deadline)
    })
  }
  return copy.sort((a, b) => b.progress - a.progress)
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects())
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncError, setSyncError] = useState('')
  const hydrated = useRef(false)

  useEffect(() => {
    saveProjects(projects)
  }, [projects])

  useEffect(() => {
    let cancelled = false

    async function hydrateFromCloud() {
      setSyncStatus('syncing')
      setSyncError('')
      try {
        const remote = normalizeList(await fetchRemoteProjects())
        if (cancelled) return

        const local = loadProjects()
        if (remote.length > 0) {
          setProjects(remote)
          saveProjects(remote)
          await saveRemoteProjects(remote)
          if (cancelled) return
        } else if (local.length > 0) {
          await saveRemoteProjects(local)
          if (cancelled) return
        }

        hydrated.current = true
        setSyncStatus('ok')
      } catch {
        if (cancelled) return
        hydrated.current = true
        setSyncStatus('error')
        setSyncError('云端同步失败，数据仍保存在本机。请确认已绑定 PROJECTS_KV 并重新部署。')
      }
    }

    void hydrateFromCloud()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated.current) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        setSyncStatus('syncing')
        try {
          await saveRemoteProjects(projects)
          if (cancelled) return
          setSyncStatus('ok')
          setSyncError('')
        } catch {
          if (cancelled) return
          setSyncStatus('error')
          setSyncError('云端同步失败，数据仍保存在本机。请确认已绑定 PROJECTS_KV 并重新部署。')
        }
      })()
    }, 400)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [projects])

  const addProject = useCallback((input: ProjectInput) => {
    const now = Date.now()
    const description = input.description.trim()
    const project: Project = {
      id: crypto.randomUUID(),
      ...input,
      name: input.name.trim(),
      description,
      followUps: description
        ? [
            {
              id: crypto.randomUUID(),
              title: description,
              status: 'pending',
              owner: input.owner.trim() || '未指定',
              deadline: input.deadline,
              notes: '',
              createdAt: now,
              updatedAt: now,
            },
          ]
        : [],
      owner: input.owner.trim() || '未指定',
      progress: Math.min(100, Math.max(0, input.progress)),
      createdAt: now,
      updatedAt: now,
    }
    setProjects((prev) => [project, ...prev])
  }, [])

  const updateProject = useCallback((id: string, patch: ProjectPatch) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const next: Project = {
          ...p,
          ...patch,
          updatedAt: Date.now(),
        }
        if (patch.progress !== undefined) {
          next.progress = Math.min(100, Math.max(0, patch.progress))
        }
        if (patch.owner !== undefined) {
          next.owner = patch.owner.trim() || '未指定'
        }
        if (patch.name !== undefined) next.name = patch.name.trim() || p.name
        if (patch.description !== undefined) {
          next.description = patch.description.trim()
        }
        return next
      }),
    )
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status === 'active')
    const completed = projects.filter((p) => p.status === 'completed')
    const dueSoon = projects.filter((p) => {
      if (p.status === 'completed' || p.status === 'paused' || !p.deadline) return false
      const end = new Date(p.deadline + 'T23:59:59').getTime()
      const diff = end - Date.now()
      return diff >= 0 && diff <= 7 * 86400000
    })
    const overdue = projects.filter(
      (p) => p.status !== 'paused' && isOverdue(p),
    )
    const avg =
      projects.length === 0
        ? 0
        : Math.round(
            projects.reduce((sum, p) => sum + p.progress, 0) / projects.length,
          )
    return {
      active: active.length,
      completed: completed.length,
      dueSoon: dueSoon.length + overdue.length,
      avgProgress: avg,
      overdue: overdue.length,
    }
  }, [projects])

  const queryProjects = useCallback(
    (opts: { filter: FilterKey; sort: SortKey; search: string }) => {
      const q = opts.search.trim().toLowerCase()
      let list = projects.filter((p) => {
        if (opts.filter === 'active') return p.status === 'active'
        if (opts.filter === 'paused') return p.status === 'paused'
        if (opts.filter === 'completed') return p.status === 'completed'
        if (opts.filter === 'overdue') {
          return p.status !== 'paused' && isOverdue(p)
        }
        return true
      })
      if (q) {
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.owner.toLowerCase().includes(q),
        )
      }
      return sortProjects(list, opts.sort)
    },
    [projects],
  )

  return {
    projects,
    stats,
    syncStatus,
    syncError,
    addProject,
    updateProject,
    deleteProject,
    queryProjects,
  }
}
