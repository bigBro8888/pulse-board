const KV_KEY = 'projects'
const ACCESS_PASSWORD = 'tony1234'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders,
    },
  })
}

function unauthorized() {
  return json({ error: 'unauthorized' }, 401)
}

function isAuthorized(request) {
  const header = request.headers.get('Authorization') || ''
  return header === `Bearer ${ACCESS_PASSWORD}`
}

function getKv(env) {
  return (
    env.PROJECTS_KV ||
    env.projects_kv ||
    env.PULSE_KV ||
    env.PULSE_kv ||
    null
  )
}

function missingKvResponse(env) {
  return json(
    {
      error: 'kv_not_bound',
      projects: [],
      hint: 'Bind KV as projects_kv or PROJECTS_KV, then redeploy',
      envKeys: Object.keys(env || {}),
    },
    503,
  )
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function onRequestGet(context) {
  if (!isAuthorized(context.request)) return unauthorized()

  const kv = getKv(context.env)
  if (!kv) return missingKvResponse(context.env)

  const raw = await kv.get(KV_KEY)
  if (!raw) return json({ projects: [] })

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return json({ projects: [] })
    return json({ projects: parsed })
  } catch {
    return json({ projects: [] })
  }
}

export async function onRequestPut(context) {
  if (!isAuthorized(context.request)) return unauthorized()

  const kv = getKv(context.env)
  if (!kv) return missingKvResponse(context.env)

  let body
  try {
    body = await context.request.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const projects = body && Array.isArray(body.projects) ? body.projects : null
  if (!projects) {
    return json({ error: 'projects_array_required' }, 400)
  }

  await kv.put(KV_KEY, JSON.stringify(projects))
  return json({ ok: true, count: projects.length })
}
