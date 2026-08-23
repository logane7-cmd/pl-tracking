export interface Env {
  FOOTBALL_DATA_API_KEY: string
  ALLOWED_ORIGIN: string
  RATE_LIMITER: RateLimit
}

const UPSTREAM = 'https://api.football-data.org'

function corsHeaders(env: Env): HeadersInit {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-Content-Type-Options': 'nosniff',
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function jsonError(message: string, status: number, headers: HeadersInit): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = corsHeaders(env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers })
    }

    const origin = request.headers.get('Origin')
    if (origin && origin !== env.ALLOWED_ORIGIN) {
      return jsonError('forbidden', 403, headers)
    }

    const url = new URL(request.url)
    let upstreamPath: string

    if (url.pathname === '/api/standings') {
      upstreamPath = '/v4/competitions/PL/standings'
    } else if (url.pathname === '/api/matches') {
      const now = new Date()
      const dateFrom = isoDate(new Date(now.getTime() - 14 * 86_400_000))
      const dateTo = isoDate(new Date(now.getTime() + 21 * 86_400_000))
      upstreamPath = `/v4/competitions/PL/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`
    } else {
      return new Response('Not found', { status: 404, headers })
    }

    const cache = caches.default
    const cacheKey = new Request(url.toString(), { method: 'GET' })
    const cached = await cache.match(cacheKey)
    if (cached) {
      return cached
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
    const { success } = await env.RATE_LIMITER.limit({ key: ip })
    if (!success) {
      return jsonError('rate limit exceeded', 429, headers)
    }

    let upstreamRes: Response
    try {
      upstreamRes = await fetch(`${UPSTREAM}${upstreamPath}`, {
        headers: { 'X-Auth-Token': env.FOOTBALL_DATA_API_KEY },
      })
    } catch {
      return jsonError('upstream unavailable', 502, headers)
    }
    const body = await upstreamRes.text()

    const response = new Response(body, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
        ...headers,
      },
    })

    if (response.ok) {
      await cache.put(cacheKey, response.clone())
    }

    return response
  },
} satisfies ExportedHandler<Env>
