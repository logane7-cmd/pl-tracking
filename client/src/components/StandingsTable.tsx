import { TEAMS, matchesTeam } from '../config/teams'
import type { StandingsRow } from '../types'

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-gold"
      aria-hidden="true"
    >
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a2 2 0 0 0 2 4" />
      <path d="M17 5h3a2 2 0 0 1-2 4" />
    </svg>
  )
}

export function StandingsTable({ table }: { table: StandingsRow[] }) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-pitch-line bg-turf shadow-lg">
      <div className="flex items-center gap-2 border-b border-pitch-line px-5 py-4">
        <TrophyIcon />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-chalk">Full Standings</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-pitch-line text-left text-[11px] font-medium uppercase tracking-wide text-whistle">
              <th className="px-3 py-3 text-center">#</th>
              <th className="px-2 py-3">Team</th>
              <th className="px-2 py-3 text-center" title="Played">
                P
              </th>
              <th className="px-2 py-3 text-center" title="Won">
                W
              </th>
              <th className="px-2 py-3 text-center" title="Drawn">
                D
              </th>
              <th className="px-2 py-3 text-center" title="Lost">
                L
              </th>
              <th className="px-2 py-3 text-center" title="Goal difference">
                GD
              </th>
              <th className="px-3 py-3 text-center" title="Points">
                Pts
              </th>
            </tr>
          </thead>
          <tbody>
            {table.map((row) => {
              const config = TEAMS.find((t) => matchesTeam(t, row.team))
              return (
                <tr
                  key={row.team.id}
                  className="border-b border-pitch-line last:border-b-0"
                  style={
                    config
                      ? {
                          borderLeft: `3px solid ${config.color}`,
                          backgroundColor: `${config.color}14`,
                        }
                      : undefined
                  }
                >
                  <td className="px-3 py-2 text-center tabular-nums text-chalk">{row.position}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <img src={row.team.crest} alt="" className="h-5 w-5 flex-shrink-0 object-contain" />
                      <span
                        className={`truncate text-chalk ${config ? 'font-semibold' : ''}`}
                      >
                        {row.team.shortName || row.team.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-chalk">{row.playedGames}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-chalk">{row.won}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-chalk">{row.draw}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-chalk">{row.lost}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-chalk">
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td className="px-3 py-2 text-center font-semibold tabular-nums text-chalk">
                    {row.points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
