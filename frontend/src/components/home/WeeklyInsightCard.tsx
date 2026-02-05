import { TrendingUp, TrendingDown, Minus, BookOpen, Flame, Sparkles } from 'lucide-react'

import type { WeeklyInsightResponse } from '@/types/diary'
import { MOODS } from '@/lib/constants'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface WeeklyInsightCardProps {
  insight: WeeklyInsightResponse
  className?: string
}

export function WeeklyInsightCard({ insight, className }: WeeklyInsightCardProps) {
  const positivePercent = Math.round(insight.positive_ratio * 100)

  const getTrendIcon = () => {
    if (insight.positive_ratio_change === null) return null
    if (insight.positive_ratio_change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (insight.positive_ratio_change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getTrendText = () => {
    if (insight.positive_ratio_change === null) return null
    const change = Math.abs(Math.round(insight.positive_ratio_change * 100))
    if (insight.positive_ratio_change > 0) {
      return <span className="text-green-500">+{change}%</span>
    } else if (insight.positive_ratio_change < 0) {
      return <span className="text-red-500">-{change}%</span>
    }
    return <span className="text-muted-foreground">변화없음</span>
  }

  const moodInfo = insight.dominant_mood && MOODS[insight.dominant_mood as keyof typeof MOODS]

  return (
    <Card className={`flex flex-col ${className || ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          이번 주 인사이트
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Diary count */}
          <div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
            <BookOpen className="mb-1 h-5 w-5 text-blue-500" />
            <span className="text-xl font-bold">{insight.diary_count}</span>
            <span className="text-xs text-muted-foreground">일기</span>
          </div>

          {/* Positive ratio */}
          <div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
            <div className="mb-1 flex items-center gap-1">
              {getTrendIcon() || <span className="text-lg">😊</span>}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">{positivePercent}%</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              긍정 {getTrendText()}
            </div>
          </div>

          {/* Streak */}
          <div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
            <Flame className={`mb-1 h-5 w-5 ${insight.current_streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <span className="text-xl font-bold">{insight.current_streak}</span>
            <span className="text-xs text-muted-foreground">연속</span>
          </div>
        </div>

        {/* AI Summary or dominant mood */}
        {(insight.ai_summary || moodInfo) && (
          <div className="rounded-lg bg-gradient-to-r from-primary/5 to-transparent p-3">
            {insight.ai_summary ? (
              <p className="text-sm text-foreground">
                "{insight.ai_summary}"
              </p>
            ) : moodInfo ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{moodInfo.emoji}</span>
                <p className="text-sm text-foreground">
                  이번 주는 <span className="font-medium">{moodInfo.label}</span> 감정이 가장 많았어요
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Empty state */}
        {insight.diary_count === 0 && (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              이번 주 아직 일기를 쓰지 않았어요
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              오늘 첫 일기를 시작해보세요!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
