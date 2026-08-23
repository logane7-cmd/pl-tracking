import type { ApiMatch } from '../types'
import { matchesTeam, type TeamConfig as Config } from '../config/teams'

export function formatKickoff(utcDate: string): string {
  const d = new Date(utcDate)
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
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
