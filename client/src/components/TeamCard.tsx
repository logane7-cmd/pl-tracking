import type { TeamData } from '../lib/derive'
import { formatKickoff, opponentOf, resultFor, scoreLine } from '../lib/format'

const RESULT_STYLES: Record<'W' | 'D' | 'L', string> = {
  W: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  D: 'bg-slate-500/15 text-slate-500 border-slate-500/30',
  L: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
}

function FormBadges({ form }: { form: string | null }) {
  if (!form) return <p className="text-sm text-whistle">No results yet this season</p>
  const results = form
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is 'W' | 'D' | 'L' => s === 'W' || s === 'D' || s === 'L')
  return (
    <div className="flex gap-1.5">
      {results.map((r, i) => (
        <span
          key={i}
          className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${RESULT_STYLES[r]}`}
        >
          {r}
        </span>
      ))}
    </div>
  )
}

export function TeamCard({ data }: { data: TeamData }) {
  const { config, standing, liveMatch, lastMatch, nextMatch } = data

  return (
    <div
      className="flex flex-col gap-5 rounded-2xl border border-pitch-line bg-turf p-6 shadow-lg transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{ borderTopColor: config.color, borderTopWidth: 4 }}
    >
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          {standing && (
            <img src={standing.team.crest} alt="" className="h-12 w-12 object-contain" />
          )}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-whistle">
              {config.owner}
            </p>
            <h2 className="text-lg font-semibold text-chalk">{config.displayName}</h2>
          </div>
        </div>
        {standing && (
          <div className="text-right">
            <p className="inline-flex items-baseline gap-0.5 text-3xl font-bold leading-none tabular-nums text-chalk">
              {standing.position}
              <span className="text-sm font-medium text-whistle">
                {ordinalSuffix(standing.position)}
              </span>
            </p>
            <p className="text-xs tabular-nums text-whistle">{standing.points} pts</p>
          </div>
        )}
      </div>

      {standing && (
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <Stat label="P" title="Played" value={standing.playedGames} />
          <Stat label="W" title="Won" value={standing.won} />
          <Stat label="D" title="Drawn" value={standing.draw} />
          <Stat label="L" title="Lost" value={standing.lost} />
        </div>
      )}

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-whistle">Form</p>
        <FormBadges form={standing?.form ?? null} />
      </div>

      {liveMatch && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            Live now
          </p>
          <MatchLine match={liveMatch} config={config} />
        </div>
      )}

      {!liveMatch && nextMatch && (
        <div className="rounded-xl border border-pitch-line bg-pitch p-4">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-whistle">
            Next match &middot; <KickoffLabel utcDate={nextMatch.utcDate} />
          </p>
          <MatchLine match={nextMatch} config={config} />
        </div>
      )}

      {lastMatch && (
        <div className="rounded-xl border border-pitch-line p-4">
          <p className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-whistle">
            Last result
            {resultFor(config, lastMatch) && (
              <span
                className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${RESULT_STYLES[resultFor(config, lastMatch)!]}`}
              >
                {resultFor(config, lastMatch)}
              </span>
            )}
          </p>
          <MatchLine match={lastMatch} config={config} />
        </div>
      )}
    </div>
  )
}

function KickoffLabel({ utcDate }: { utcDate: string }) {
  const { primary, secondary } = formatKickoff(utcDate)
  return (
    <>
      <span className="font-semibold text-chalk">{primary}</span>
      {secondary && ` (${secondary})`}
    </>
  )
}

function MatchLine({ match, config }: { match: TeamData['nextMatch']; config: TeamData['config'] }) {
  if (!match) return null
  const { isHome, opponent } = opponentOf(config, match)
  const hasScore = match.score.fullTime.home !== null
  return (
    <div className="flex items-center gap-2 text-sm text-chalk">
      <span className="text-whistle">{isHome ? 'vs' : '@'}</span>
      <img src={opponent.crest} alt="" className="h-5 w-5 object-contain" />
      <span>{opponent.shortName || opponent.name}</span>
      {hasScore && <span className="ml-auto font-semibold tabular-nums">{scoreLine(match)}</span>}
    </div>
  )
}

function Stat({ label, title, value }: { label: string; title: string; value: number }) {
  return (
    <div className="rounded-lg bg-pitch py-2" title={title}>
      <p className="text-base font-semibold tabular-nums text-chalk">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-whistle">{label}</p>
    </div>
  )
}

function ordinalSuffix(n: number): string {
  const j = n % 10
  const k = n % 100
  if (j === 1 && k !== 11) return 'st'
  if (j === 2 && k !== 12) return 'nd'
  if (j === 3 && k !== 13) return 'rd'
  return 'th'
}
