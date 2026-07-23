interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

type PagesFunction<
  Env = unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Params extends string = any,
  Data extends Record<string, unknown> = Record<string, unknown>,
> = (context: EventContext<Env, Params, Data>) => Response | Promise<Response>

interface EventContext<Env, Params, Data> {
  request: Request
  env: Env
  params: Params
  data: Data
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>
  waitUntil: (promise: Promise<unknown>) => void
}
