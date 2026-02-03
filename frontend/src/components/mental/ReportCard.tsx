import { TrendingUp, TrendingDown, Minus, Calendar, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { MentalReport, TrendType } from '@/types/mental'

interface ReportCardProps {
  report: MentalReport
  type: 'weekly' | 'monthly'
}

const TrendIcon = ({ trend }: { trend: TrendType }) => {
  if (trend === 'improving') {
    return <TrendingUp className="w-5 h-5 text-green-500" />
  }
  if (trend === 'declining') {
    return <TrendingDown className="w-5 h-5 text-red-500" />
  }
  return <Minus className="w-5 h-5 text-gray-400" />
}

const TREND_COLORS: Record<TrendType, string> = {
  improving: 'bg-green-100 text-green-700',
  stable: 'bg-blue-100 text-blue-700',
  declining: 'bg-red-100 text-red-700',
}

const TREND_LABELS: Record<TrendType, string> = {
  improving: '좋아지는 중',
  stable: '안정적',
  declining: '주의 필요',
}

export function ReportCard({ report, type }: ReportCardProps) {
  const periodLabel = type === 'weekly' ? '주간' : '월간'
  const startDate = new Date(report.period_start).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
  const endDate = new Date(report.period_end).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            {periodLabel} 리포트
          </CardTitle>
          <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-1 ${TREND_COLORS[report.trend]}`}>
            <TrendIcon trend={report.trend} />
            {TREND_LABELS[report.trend]}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
          <Calendar className="w-4 h-4" />
          {startDate} ~ {endDate}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 평균 점수 그리드 */}
        <div className="grid grid-cols-3 gap-3">
          <ScoreItem label="정서 안정성" score={report.avg_emotional_stability_score} />
          <ScoreItem label="활력" score={report.avg_vitality_score} />
          <ScoreItem label="자존감" score={report.avg_self_esteem_score} />
          <ScoreItem label="긍정성" score={report.avg_positivity_score} />
          <ScoreItem label="사회적 연결" score={report.avg_social_connection_score} />
          <ScoreItem label="회복탄력성" score={report.avg_resilience_score} />
        </div>

        {/* 인사이트 */}
        {report.insights && report.insights.length > 0 && (
          <div className="pt-3 border-t">
            <h4 className="font-medium text-gray-900 mb-2">인사이트</h4>
            <ul className="space-y-2">
              {report.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-indigo-500 mt-1">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 추천 */}
        {report.recommendations && report.recommendations.length > 0 && (
          <div className="pt-3 border-t">
            <h4 className="font-medium text-gray-900 mb-2">추천 활동</h4>
            <ul className="space-y-2">
              {report.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-500 mt-1">✓</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ScoreItemProps {
  label: string
  score: number
  inverse?: boolean
}

function ScoreItem({ label, score }: ScoreItemProps) {
  // 모든 지표가 높을수록 좋음
  const isGood = score > 60
  const isBad = score < 40

  const colorClass = isGood
    ? 'text-green-600'
    : isBad
      ? 'text-red-600'
      : 'text-gray-600'

  return (
    <div className="text-center p-2 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-semibold ${colorClass}`}>{score}</p>
    </div>
  )
}
