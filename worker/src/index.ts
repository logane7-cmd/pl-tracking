export interface Env {
  FOOTBALL_DATA_API_KEY: string
  ALLOWED_ORIGIN: string
}

const UPSTREAM = 'https://api.football-data.org'

function corsHeaders(env: Env): HeadersInit {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = corsHeaders(env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers })
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

    const upstreamRes = await fetch(`${UPSTREAM}${upstreamPath}`, {
      headers: { 'X-Auth-Token': env.FOOTBALL_DATA_API_KEY },
    })
    const body = await upstreamRes.text()

    return new Response(body, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
        ...headers,
      },
    })
  },
} satisfies ExportedHandler<Env>
