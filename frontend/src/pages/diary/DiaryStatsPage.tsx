import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BookOpen, Flame, Trophy, TrendingUp } from 'lucide-react'

import { diaryService } from '@/services/diaryService'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/Loading'
import { MOODS } from '@/lib/constants'

export default function DiaryStatsPage() {
  const navigate = useNavigate()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['diaryStats'],
    queryFn: () => diaryService.getStats(),
  })

  if (isLoading) {
    return <PageLoading />
  }

  if (!stats) {
    return (
      <div className="text-center">
        <p>통계를 불러올 수 없습니다.</p>
        <Button onClick={() => navigate('/diaries')} className="mt-4">
          목록으로
        </Button>
      </div>
    )
  }

  // Calculate max mood count for progress bar
  const maxMoodCount = Math.max(...Object.values(stats.mood_distribution), 1)

  // Sort monthly counts by month
  const sortedMonths = Object.entries(stats.monthly_count).sort(
    ([a], [b]) => a.localeCompare(b)
  )

  // Calculate max monthly count for chart
  const maxMonthlyCount = Math.max(...Object.values(stats.monthly_count), 1)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">일기 통계</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <BookOpen className="h-8 w-8 text-primary" />
              <p className="mt-2 text-2xl font-bold">{stats.total_count}</p>
              <p className="text-sm text-muted-foreground">총 일기</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Flame className="h-8 w-8 text-orange-500" />
              <p className="mt-2 text-2xl font-bold">{stats.current_streak}</p>
              <p className="text-sm text-muted-foreground">연속 작성일</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <p className="mt-2 text-2xl font-bold">{stats.longest_streak}</p>
              <p className="text-sm text-muted-foreground">최장 연속</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <p className="mt-2 text-2xl font-bold">{stats.weekly_average}</p>
              <p className="text-sm text-muted-foreground">주간 평균</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mood Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>감정 분포</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.mood_distribution).length === 0 ? (
            <p className="text-center text-muted-foreground">
              아직 기록된 감정이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.mood_distribution)
                .sort(([, a], [, b]) => b - a)
                .map(([mood, count]) => {
                  const moodInfo = MOODS[mood as keyof typeof MOODS]
                  const percentage = (count / maxMoodCount) * 100
                  return (
                    <div key={mood} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {moodInfo?.emoji} {moodInfo?.label || mood}
                        </span>
                        <span className="text-muted-foreground">{count}회</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>월별 작성 현황</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedMonths.length === 0 ? (
            <p className="text-center text-muted-foreground">
              아직 작성된 일기가 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedMonths.map(([month, count]) => {
                const percentage = (count / maxMonthlyCount) * 100
                const [year, monthNum] = month.split('-')
                const displayMonth = `${year}년 ${parseInt(monthNum)}월`
                return (
                  <div key={month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{displayMonth}</span>
                      <span className="text-muted-foreground">{count}개</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
