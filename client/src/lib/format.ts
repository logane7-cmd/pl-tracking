import type { ApiMatch } from '../types'
import { matchesTeam, type TeamConfig as Config } from '../config/teams'

export interface KickoffTime {
  primary: string
  secondary: string | null
}

const CENTRAL_TIME_ZONE = 'America/Chicago'

export function formatKickoff(utcDate: string): KickoffTime {
  const d = new Date(utcDate)
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }
  const primary = d.toLocaleString(undefined, { ...opts, timeZone: CENTRAL_TIME_ZONE })
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const secondary = localZone === CENTRAL_TIME_ZONE ? null : d.toLocaleString(undefined, opts)
  return { primary, secondary }
}

export function opponentOf(config: Config, match: ApiMatch) {
  const isHome = matchesTeam(config, match.homeTeam)
  return {
    isHome,
    opponent: isHome ? match.awayTeam : match.homeTeam,
    team: isHome ? match.homeTeam : match.awayTeam,
  }
}

export type ResultKind = 'W' | 'D' | 'L'

export function resultFor(config: Config, match: ApiMatch): ResultKind | null {
  const { fullTime } = match.score
  if (fullTime.home === null || fullTime.away === null) return null
  const { isHome } = opponentOf(config, match)
  const teamScore = isHome ? fullTime.home : fullTime.away
  const oppScore = isHome ? fullTime.away : fullTime.home
  if (teamScore > oppScore) return 'W'
  if (teamScore < oppScore) return 'L'
  return 'D'
}

export function scoreLine(match: ApiMatch): string {
  const { home, away } = match.score.fullTime
  if (home === null || away === null) return 'vs'
  return `${home} - ${away}`
}

export function formatUpdatedTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
