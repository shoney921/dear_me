import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { MentalHistoryItem } from '@/types/mental'

interface MentalHistoryChartProps {
  data: MentalHistoryItem[]
  showMetrics?: ('stress' | 'positivity' | 'self_esteem')[]
}

const METRIC_COLORS = {
  stress: '#ef4444',
  positivity: '#22c55e',
  self_esteem: '#6366f1',
  anxiety: '#f59e0b',
  depression: '#8b5cf6',
  social_connection: '#06b6d4',
}

const METRIC_LABELS = {
  stress: '스트레스',
  positivity: '긍정성',
  self_esteem: '자존감',
  anxiety: '불안',
  depression: '우울',
  social_connection: '사회적 연결',
}

export function MentalHistoryChart({
  data,
  showMetrics = ['stress', 'positivity', 'self_esteem'],
}: MentalHistoryChartProps) {
  const chartData = data
    .map((item) => ({
      date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      stress: item.stress_score,
      positivity: item.positivity_score,
      self_esteem: item.self_esteem_score,
      anxiety: item.anxiety_score,
      depression: item.depression_score,
      social_connection: item.social_connection_score,
    }))
    .reverse()

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          tickLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          tickLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Legend />
        {showMetrics.map((metric) => (
          <Line
            key={metric}
            type="monotone"
            dataKey={metric}
            name={METRIC_LABELS[metric]}
            stroke={METRIC_COLORS[metric]}
            strokeWidth={2}
            dot={{ fill: METRIC_COLORS[metric], strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
