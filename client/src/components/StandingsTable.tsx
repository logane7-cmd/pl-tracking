import { TEAMS, matchesTeam } from '../config/teams'
import type { StandingsRow } from '../types'

export function StandingsTable({ table }: { table: StandingsRow[] }) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-pitch-line bg-turf shadow-lg">
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
