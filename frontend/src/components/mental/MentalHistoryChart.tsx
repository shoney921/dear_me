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
  showMetrics?: ('emotional_stability' | 'vitality' | 'positivity' | 'self_esteem' | 'social_connection' | 'resilience')[]
}

const METRIC_COLORS = {
  emotional_stability: '#6366f1',
  vitality: '#22c55e',
  self_esteem: '#8b5cf6',
  positivity: '#f59e0b',
  social_connection: '#06b6d4',
  resilience: '#ef4444',
}

const METRIC_LABELS = {
  emotional_stability: '정서 안정성',
  vitality: '활력',
  self_esteem: '자존감',
  positivity: '긍정성',
  social_connection: '사회적 연결',
  resilience: '회복탄력성',
}

export function MentalHistoryChart({
  data,
  showMetrics = ['emotional_stability', 'vitality', 'positivity'],
}: MentalHistoryChartProps) {
  const chartData = data
    .map((item) => ({
      date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      emotional_stability: item.emotional_stability_score,
      vitality: item.vitality_score,
      self_esteem: item.self_esteem_score,
      positivity: item.positivity_score,
      social_connection: item.social_connection_score,
      resilience: item.resilience_score,
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
