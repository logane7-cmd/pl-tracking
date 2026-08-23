import type { ApiTeam } from '../types'

export interface TeamConfig {
  owner: string
  displayName: string
  /** Substrings matched case-insensitively against the API team's name/shortName/tla. */
  matchNames: string[]
  color: string
}

export const TEAMS: TeamConfig[] = [
  {
    owner: 'Logan',
    displayName: 'Tottenham Hotspur',
    matchNames: ['tottenham'],
    color: '#132257',
  },
  {
    owner: 'Kathleen',
    displayName: 'Aston Villa',
    matchNames: ['aston villa'],
    color: '#670E36',
  },
  {
    owner: 'David',
    displayName: 'Nottingham Forest',
    matchNames: ['nottingham forest'],
    color: '#DD0000',
  },
  {
    owner: 'Sam',
    displayName: 'Ipswich Town',
    matchNames: ['ipswich'],
    color: '#3A64A3',
  },
]

export function matchesTeam(config: TeamConfig, team: ApiTeam): boolean {
  const haystack = `${team.name} ${team.shortName} ${team.tla}`.toLowerCase()
  return config.matchNames.some((needle) => haystack.includes(needle))
}
