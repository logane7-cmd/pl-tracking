import { matchesTeam, type TeamConfig } from '../config/teams'
import type { ApiMatch, StandingsRow } from '../types'

export interface TeamData {
  config: TeamConfig
  standing: StandingsRow | null
  liveMatch: ApiMatch | null
  lastMatch: ApiMatch | null
  nextMatch: ApiMatch | null
}

const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED'])
const UPCOMING_STATUSES = new Set(['SCHEDULED', 'TIMED'])

export function deriveTeamData(
  configs: TeamConfig[],
  table: StandingsRow[],
  matches: ApiMatch[],
): TeamData[] {
  return configs.map((config) => {
    const standing = table.find((row) => matchesTeam(config, row.team)) ?? null

    const teamMatches = matches
      .filter((m) => matchesTeam(config, m.homeTeam) || matchesTeam(config, m.awayTeam))
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())

    const liveMatch = teamMatches.find((m) => LIVE_STATUSES.has(m.status)) ?? null

    const lastMatch =
      [...teamMatches].reverse().find((m) => m.status === 'FINISHED') ?? null

    const nextMatch =
      teamMatches.find((m) => UPCOMING_STATUSES.has(m.status)) ?? null

    return { config, standing, liveMatch, lastMatch, nextMatch }
  }).sort((a, b) => {
    if (a.standing === null && b.standing === null) return 0
    if (a.standing === null) return 1
    if (b.standing === null) return -1
    return a.standing.position - b.standing.position
  })
}
