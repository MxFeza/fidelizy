'use client'

/**
 * Chart bar "Visites hebdomadaires" — extrait de DashboardClient pour
 * permettre le lazy-load (recharts pese ~80KB gz et n'est utilise que
 * sur le dashboard). Cf. AUDIT_FLUIDITE_2026-05-13 reco 3.
 */

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export interface WeeklyVisitsDay {
  label: string
  count: number
}

interface WeeklyVisitsChartProps {
  data: WeeklyVisitsDay[]
}

export default function WeeklyVisitsChart({ data }: WeeklyVisitsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAECF0" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#667085' }} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#667085' }} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #EAECF0', fontSize: '13px' }}
          labelStyle={{ fontWeight: 600 }}
          formatter={(v) => [v, 'Visites']}
        />
        <Bar dataKey="count" fill="#7F56D9" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
