import { matchesTeam, type TeamConfig } from '../config/teams'
import type { ApiMatch, StandingsRow } from '../types'

export interface TeamData {
  config: TeamConfig
  standing: StandingsRow | null
  liveMatch: ApiMatch | null
  lastMatch: ApiMatch | null
  lastMatchProvisional: boolean
  nextMatch: ApiMatch | null
}

const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED'])
const UPCOMING_STATUSES = new Set(['SCHEDULED', 'TIMED'])

// football-data.org has been observed marking a match FINISHED with a score
// it then silently corrects a few minutes later (BL-0011). Treat a freshly
// finished match's score as unconfirmed until it's gone this long without a
// further update from the API.
export const FINAL_SCORE_GRACE_MS = 15 * 60_000

export function isFinalScoreProvisional(match: ApiMatch, nowMs: number): boolean {
  if (match.status !== 'FINISHED') return false
  const updatedMs = new Date(match.lastUpdated).getTime()
  return nowMs - updatedMs < FINAL_SCORE_GRACE_MS
}

export function deriveTeamData(
  configs: TeamConfig[],
  table: StandingsRow[],
  matches: ApiMatch[],
  nowMs: number = Date.now(),
): TeamData[] {
  return configs.map((config) => {
    const standing = table.find((row) => matchesTeam(config, row.team)) ?? null

    const teamMatches = matches
      .filter((m) => matchesTeam(config, m.homeTeam) || matchesTeam(config, m.awayTeam))
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())

    const liveMatch = teamMatches.find((m) => LIVE_STATUSES.has(m.status)) ?? null

    const lastMatch =
      [...teamMatches].reverse().find((m) => m.status === 'FINISHED') ?? null

    const lastMatchProvisional = lastMatch ? isFinalScoreProvisional(lastMatch, nowMs) : false

    const nextMatch =
      teamMatches.find((m) => UPCOMING_STATUSES.has(m.status)) ?? null

    return { config, standing, liveMatch, lastMatch, lastMatchProvisional, nextMatch }
  }).sort((a, b) => {
    if (a.standing === null && b.standing === null) return 0
    if (a.standing === null) return 1
    if (b.standing === null) return -1
    return a.standing.position - b.standing.position
  })
}
