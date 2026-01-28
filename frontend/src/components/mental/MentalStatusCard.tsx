import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { MentalAnalysisWithFeedback, TrendType } from '@/types/mental'

interface MentalStatusCardProps {
  analysis: MentalAnalysisWithFeedback
  trend?: TrendType
}

const STATUS_COLORS: Record<string, string> = {
  good: 'bg-green-100 text-green-800 border-green-200',
  neutral: 'bg-blue-100 text-blue-800 border-blue-200',
  concerning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
}

const STATUS_BG_COLORS: Record<string, string> = {
  good: 'bg-green-50',
  neutral: 'bg-blue-50',
  concerning: 'bg-yellow-50',
  critical: 'bg-red-50',
}

const TrendIcon = ({ trend }: { trend?: TrendType }) => {
  if (trend === 'improving') {
    return <TrendingUp className="w-5 h-5 text-green-500" />
  }
  if (trend === 'declining') {
    return <TrendingDown className="w-5 h-5 text-red-500" />
  }
  return <Minus className="w-5 h-5 text-gray-400" />
}

const TREND_LABELS: Record<TrendType, string> = {
  improving: '좋아지는 중',
  stable: '안정적',
  declining: '주의 필요',
}

export function MentalStatusCard({ analysis, trend }: MentalStatusCardProps) {
  const { feedback } = analysis

  return (
    <Card className={STATUS_BG_COLORS[analysis.overall_status]}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {feedback?.emoji && <span className="text-2xl">{feedback.emoji}</span>}
            {feedback?.status_label || '멘탈 상태'}
          </CardTitle>
          {trend && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <TrendIcon trend={trend} />
              <span>{TREND_LABELS[trend]}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {feedback?.message && (
          <p className="text-gray-700">{feedback.message}</p>
        )}
        {feedback?.encouragement && (
          <p className="text-sm text-gray-600 italic">"{feedback.encouragement}"</p>
        )}
        {feedback?.suggestion && (
          <div className="p-3 bg-white/50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Tip: </span>
              {feedback.suggestion}
            </p>
          </div>
        )}
        <div className="pt-2 border-t border-gray-200">
          <span
            className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${STATUS_COLORS[analysis.overall_status]}`}
          >
            {analysis.analysis_date} 기준
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
