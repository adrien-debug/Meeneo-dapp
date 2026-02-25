import type { ScenarioResult } from '@/types/simulation'
import { SCENARIO_COLORS, SCENARIO_LABELS } from './constants'

interface ResultsDecisionBannersProps {
  scenarios: string[]
  scenarioResults: Record<string, ScenarioResult>
}

function decisionColor(d: string) {
  if (d === 'APPROVED') return 'green'
  if (d === 'ADJUST') return 'yellow'
  return 'red'
}

export default function ResultsDecisionBanners({
  scenarios,
  scenarioResults,
}: ResultsDecisionBannersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {scenarios.map((s) => {
        const agg = scenarioResults[s]?.aggregated
        const decision = agg?.decision || 'PENDING'
        const reasons = agg?.decision_reasons || []
        const color = decisionColor(decision)
        return (
          <div
            key={s}
            className={`rounded-xl border px-4 py-3 ${
              color === 'green'
                ? 'border-green-400/40 bg-green-50'
                : color === 'yellow'
                  ? 'border-[#E8A838]/40 bg-amber-50'
                  : 'border-red-400/40 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-xs font-semibold uppercase"
                style={{ color: SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS] }}
              >
                {SCENARIO_LABELS[s] || s}
              </span>
              <span
                className={`text-xs font-bold ${
                  decision === 'APPROVED'
                    ? 'text-green-600'
                    : decision === 'ADJUST'
                      ? 'text-[#E8A838]'
                      : 'text-red-600'
                }`}
              >
                {decision}
              </span>
            </div>
            <div className="text-[10px] text-[#9EB3A8]">
              {reasons.map((r: string, i: number) => (
                <div key={i}>{r}</div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
