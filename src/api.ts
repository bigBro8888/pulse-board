import { getAuthHeader } from './auth'
import type { Project } from './types'

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error'

async function requestProjects(
  method: 'GET' | 'PUT',
  projects?: Project[],
): Promise<Project[] | null> {
  const init: RequestInit = {
    method,
    headers: {
      Authorization: getAuthHeader(),
      Accept: 'application/json',
    },
  }

  if (method === 'PUT') {
    init.headers = {
      ...init.headers,
      'Content-Type': 'application/json',
    }
    init.body = JSON.stringify({ projects: projects ?? [] })
  }

  const res = await fetch('/api/projects', init)
  const contentType = res.headers.get('content-type') || ''
  const text = await res.text()

  if (!contentType.includes('application/json')) {
    throw new Error(`sync_not_json_${res.status}`)
  }

  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw new Error(`sync_bad_json_${res.status}`)
  }

  if (!res.ok) {
    const err =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : `sync_failed_${res.status}`
    throw new Error(err)
  }

  if (method === 'GET') {
    const projectsField =
      data && typeof data === 'object' && 'projects' in data
        ? (data as { projects: unknown }).projects
        : null
    return Array.isArray(projectsField) ? (projectsField as Project[]) : []
  }

  return projects ?? []
}

export async function fetchRemoteProjects(): Promise<Project[]> {
  const list = await requestProjects('GET')
  return list ?? []
}

export async function saveRemoteProjects(projects: Project[]): Promise<void> {
  await requestProjects('PUT', projects)
}
