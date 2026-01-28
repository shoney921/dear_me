import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { RadarChartData } from '@/types/mental'

interface RadarChartProps {
  current: RadarChartData
  previous?: RadarChartData
  showLegend?: boolean
}

const AXIS_LABELS: Record<keyof RadarChartData, string> = {
  stress: '스트레스',
  anxiety: '불안',
  depression: '우울',
  self_esteem: '자존감',
  positivity: '긍정성',
  social_connection: '사회적 연결',
}

export function RadarChart({ current, previous, showLegend = true }: RadarChartProps) {
  const data = Object.keys(AXIS_LABELS).map((key) => {
    const k = key as keyof RadarChartData
    return {
      subject: AXIS_LABELS[k],
      current: current[k],
      previous: previous?.[k],
      fullMark: 100,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: '#9ca3af', fontSize: 10 }}
        />
        {previous && (
          <Radar
            name="이전"
            dataKey="previous"
            stroke="#94a3b8"
            fill="#94a3b8"
            fillOpacity={0.3}
          />
        )}
        <Radar
          name="현재"
          dataKey="current"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.5}
        />
        {showLegend && <Legend />}
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}
