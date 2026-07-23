interface Env {
  PROJECTS_KV: KVNamespace
}

const KV_KEY = 'projects'
const ACCESS_PASSWORD = 'tony1234'

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function unauthorized(): Response {
  return json({ error: 'unauthorized' }, 401)
}

function isAuthorized(request: Request): boolean {
  const header = request.headers.get('Authorization') || ''
  return header === `Bearer ${ACCESS_PASSWORD}`
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!isAuthorized(context.request)) return unauthorized()

  if (!context.env.PROJECTS_KV) {
    return json({ error: 'kv_not_bound', projects: [] }, 503)
  }

  const raw = await context.env.PROJECTS_KV.get(KV_KEY)
  if (!raw) return json({ projects: [] })

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return json({ projects: [] })
    return json({ projects: parsed })
  } catch {
    return json({ projects: [] })
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  if (!isAuthorized(context.request)) return unauthorized()

  if (!context.env.PROJECTS_KV) {
    return json({ error: 'kv_not_bound' }, 503)
  }

  let body: unknown
  try {
    body = await context.request.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const projects =
    body && typeof body === 'object' && Array.isArray((body as { projects?: unknown }).projects)
      ? (body as { projects: unknown[] }).projects
      : null

  if (!projects) {
    return json({ error: 'projects_array_required' }, 400)
  }

  await context.env.PROJECTS_KV.put(KV_KEY, JSON.stringify(projects))
  return json({ ok: true, count: projects.length })
}
