export const SCENARIO_COLORS = {
  bear: '#ef4444',
  base: '#94a3b8',
  bull: '#22c55e',
} as const

export const SCENARIO_LABELS: Record<string, string> = {
  bear: 'Bear',
  base: 'Base',
  bull: 'Bull',
}

export const TOOLTIP_STYLE = {
  background: '#fff',
  border: '1px solid #9EB3A8',
  borderRadius: 8,
  fontSize: 11,
}

export const GRID_PROPS = { strokeDasharray: '3 3', stroke: '#9EB3A8', strokeOpacity: 0.15 }

export const AXIS_TICK = { fontSize: 10, fill: '#9EB3A8' }

export function scenarioColor(s: string): string {
  return SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS] ?? '#94a3b8'
}
