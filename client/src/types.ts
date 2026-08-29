export interface ApiTeam {
  id: number
  name: string
  shortName: string
  tla: string
  crest: string
}

export interface StandingsRow {
  position: number
  team: ApiTeam
  playedGames: number
  form: string | null
  won: number
  draw: number
  lost: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

export interface StandingsResponse {
  season: { startDate: string; endDate: string; currentMatchday: number | null }
  standings: Array<{
    stage: string
    type: 'TOTAL' | 'HOME' | 'AWAY'
    table: StandingsRow[]
  }>
}

export type MatchStatus =
  | 'SCHEDULED'
  | 'TIMED'
  | 'IN_PLAY'
  | 'PAUSED'
  | 'FINISHED'
  | 'POSTPONED'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'AWARDED'

export interface ApiMatch {
  id: number
  utcDate: string
  status: MatchStatus
  matchday: number | null
  lastUpdated: string
  homeTeam: ApiTeam
  awayTeam: ApiTeam
  score: {
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
  }
}

export interface MatchesResponse {
  matches: ApiMatch[]
}
