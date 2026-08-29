import type { ApiMatch } from '../types'
import { isFinalScoreProvisional } from './derive'

export const LIVE_POLL_MS = 60_000
export const IDLE_POLL_MS = 15 * 60_000

const ukHourFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  hour: 'numeric',
  hourCycle: 'h23',
})

export function isUkQuietHours(now: Date): boolean {
  const hour = Number(ukHourFormatter.format(now))
  return hour >= 23 || hour < 8
}

export function isMatchLikelyActive(match: ApiMatch, nowMs: number): boolean {
  if (match.status === 'IN_PLAY' || match.status === 'PAUSED') return true
  if (match.status === 'SCHEDULED' || match.status === 'TIMED') {
    const kickoffMs = new Date(match.utcDate).getTime()
    const minsToKickoff = (kickoffMs - nowMs) / 60_000
    const hoursSinceKickoff = (nowMs - kickoffMs) / 3_600_000
    return minsToKickoff <= 5 && hoursSinceKickoff <= 3
  }
  // Keep polling at the live cadence while a final score is still
  // unconfirmed (BL-0011), so we catch an upstream correction quickly.
  if (isFinalScoreProvisional(match, nowMs)) return true
  return false
}

export function hasLiveMatch(matches: ApiMatch[] | null, nowMs: number): boolean {
  return matches?.some((m) => isMatchLikelyActive(m, nowMs)) ?? false
}

export function shouldPollNow(
  matches: ApiMatch[] | null,
  lastFetchAtMs: number,
  now: Date,
): boolean {
  const nowMs = now.getTime()
  const live = hasLiveMatch(matches, nowMs)
  if (isUkQuietHours(now) && !live) return false
  const interval = live ? LIVE_POLL_MS : IDLE_POLL_MS
  return nowMs - lastFetchAtMs >= interval
}
