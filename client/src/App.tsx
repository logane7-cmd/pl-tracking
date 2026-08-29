import { useEffect, useRef, useState, useCallback } from 'react'
import { TEAMS } from './config/teams'
import { fetchMatches, fetchStandings } from './lib/api'
import { deriveTeamData, type TeamData } from './lib/derive'
import { shouldPollNow } from './lib/polling'
import { TeamCard } from './components/TeamCard'
import { StandingsTable } from './components/StandingsTable'
import { ThemeToggle } from './components/ThemeToggle'
import type { ApiMatch, StandingsRow } from './types'

// Local check tick, not a network call. Actual fetch cadence is decided by
// shouldPollNow: 60s while a match is live, 15min idle, paused 23:00-08:00 UK
// (see backlog/BL-0006.md).
const TICK_MS = 60_000

export default function App() {
  const [teamData, setTeamData] = useState<TeamData[] | null>(null)
  const [standingsTable, setStandingsTable] = useState<StandingsRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const matchesRef = useRef<ApiMatch[] | null>(null)
  const lastFetchAtRef = useRef<number>(0)

  const load = useCallback(async () => {
    try {
      const [standingsRes, matchesRes] = await Promise.all([fetchStandings(), fetchMatches()])
      const table = standingsRes.standings.find((s) => s.type === 'TOTAL')?.table ?? []
      setTeamData(deriveTeamData(TEAMS, table, matchesRes.matches, Date.now()))
      setStandingsTable(table)
      setLastUpdated(new Date())
      setError(null)
      matchesRef.current = matchesRes.matches
      lastFetchAtRef.current = Date.now()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(() => {
      if (shouldPollNow(matchesRef.current, lastFetchAtRef.current, new Date())) {
        load()
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [load])

  return (
    <div className="min-h-screen bg-pitch px-4 py-10 text-chalk">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Premier League Tracker</h1>
          <p className="text-whistle">Four rivals, four tables of trash talk.</p>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <p className="text-xs text-whistle">
                Updated {lastUpdated.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </p>
            )}
            <ThemeToggle />
          </div>
        </header>

        {error && (
          <p className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-center text-sm text-rose-400">
            {error}
          </p>
        )}

        {!teamData && !error && (
          <p className="text-center text-whistle">Loading standings...</p>
        )}

        {teamData && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {teamData.map((data) => (
              <TeamCard key={data.config.owner} data={data} />
            ))}
          </div>
        )}

        {standingsTable && <StandingsTable table={standingsTable} />}
      </div>
    </div>
  )
}
