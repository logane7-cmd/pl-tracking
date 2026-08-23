import type { MatchesResponse, StandingsResponse } from '../types'

// Set at build time (see .env.production) to the deployed Cloudflare Worker's URL,
// e.g. https://pl-tracking-proxy.<your-subdomain>.workers.dev
const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined

async function getJson<T>(path: string): Promise<T> {
  if (!API_BASE) {
    throw new Error(
      'VITE_API_BASE_URL is not set. Point it at your deployed proxy worker (see README).',
    )
  }
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export function fetchStandings(): Promise<StandingsResponse> {
  return getJson<StandingsResponse>('/api/standings')
}

export function fetchMatches(): Promise<MatchesResponse> {
  return getJson<MatchesResponse>('/api/matches')
}
