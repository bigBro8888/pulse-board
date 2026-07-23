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
  if (!res.ok) {
    throw new Error(`sync_failed_${res.status}`)
  }

  if (method === 'GET') {
    const data = (await res.json()) as { projects?: unknown }
    return Array.isArray(data.projects) ? (data.projects as Project[]) : []
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
