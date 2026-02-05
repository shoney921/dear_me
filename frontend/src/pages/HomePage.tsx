import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, User, Users, Plus, ChevronRight, Sparkles, Brain } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import { diaryService } from '@/services/diaryService'
import { personaService } from '@/services/personaService'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/Loading'
import { StreakCard } from '@/components/diary/StreakCard'
import { PersonaGreeting, EmotionCalendar, WeeklyInsightCard } from '@/components/home'
import { MIN_DIARIES_FOR_PERSONA } from '@/lib/constants'

export default function HomePage() {
  const { user } = useAuthStore()

  const { data: diaryCount, isLoading: isLoadingDiary } = useQuery({
    queryKey: ['diaryCount'],
    queryFn: diaryService.getCount,
  })

  const { data: diaryStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['diaryStats'],
    queryFn: diaryService.getStats,
  })

  const { data: personaStatus, isLoading: isLoadingPersona } = useQuery({
    queryKey: ['personaStatus'],
    queryFn: personaService.getStatus,
  })

  const { data: myPersona } = useQuery({
    queryKey: ['myPersona'],
    queryFn: personaService.getMyPersona,
    enabled: !!personaStatus?.has_persona,
  })

  const { data: weeklyInsight, isLoading: isLoadingInsight } = useQuery({
    queryKey: ['weeklyInsight'],
    queryFn: diaryService.getWeeklyInsight,
  })

  if (isLoadingDiary || isLoadingPersona || isLoadingStats) {
    return <PageLoading />
  }

  const progress = Math.min(
    ((diaryCount?.count || 0) / MIN_DIARIES_FOR_PERSONA) * 100,
    100
  )

  return (
    <div className="space-y-5">
      {/* Persona Greeting - only show if persona exists */}
      {personaStatus?.has_persona && myPersona ? (
        <PersonaGreeting persona={myPersona} insight={weeklyInsight} />
      ) : (
        /* Default Welcome Section */
        <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <h1 className="text-2xl font-bold">
            안녕하세요, {user?.username}님!
          </h1>
          <p className="mt-2 text-muted-foreground">
            오늘도 DearMe와 함께 특별한 하루를 기록해보세요.
          </p>
        </div>
      )}

      {/* Emotion Calendar + Weekly Insight - Desktop: side by side, Mobile: stacked */}
      <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <EmotionCalendar className="h-full" />
        <div className="flex flex-col gap-4 lg:h-full">
          {!isLoadingInsight && weeklyInsight && (
            <WeeklyInsightCard insight={weeklyInsight} className="flex-1" />
          )}
          {/* Streak Card - show only if has diaries */}
          {diaryStats && diaryStats.total_count > 0 && (
            <StreakCard
              currentStreak={diaryStats.current_streak}
              longestStreak={diaryStats.longest_streak}
              totalCount={diaryStats.total_count}
              compact
            />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Write Diary */}
        <Link to="/diaries/new">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-full bg-primary/10 p-3">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">일기 쓰기</h3>
                <p className="text-xs text-muted-foreground truncate">오늘의 이야기</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>

        {/* My Diaries */}
        <Link to="/diaries">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-full bg-blue-500/10 p-3">
                <BookOpen className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">내 일기</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {diaryCount?.count || 0}개의 일기
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>

        {/* Friends */}
        <Link to="/friends">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-full bg-green-500/10 p-3">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">친구</h3>
                <p className="text-xs text-muted-foreground truncate">친구와 소통</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>

        {/* Mental Care */}
        <Link to="/mental">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-full bg-indigo-500/10 p-3">
                <Brain className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">심리 케어</h3>
                <p className="text-xs text-muted-foreground truncate">마음 상태 확인</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Persona Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            페르소나 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          {personaStatus?.has_persona ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                페르소나가 생성되었습니다! 지금 바로 대화해보세요.
              </p>
              <Link to="/persona">
                <Button>페르소나와 대화하기</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quiz CTA */}
              <div className="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">성격 퀴즈로 바로 시작!</p>
                    <p className="text-sm text-muted-foreground">간단한 5가지 질문에 답해보세요</p>
                  </div>
                  <Link to="/quiz">
                    <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      시작
                    </Button>
                  </Link>
                </div>
              </div>

              <p className="text-muted-foreground">
                또는 일기를 {MIN_DIARIES_FOR_PERSONA}개 이상 작성하면 더 정교한 AI 페르소나가 생성됩니다.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>진행률</span>
                  <span>
                    {diaryCount?.count || 0} / {MIN_DIARIES_FOR_PERSONA}개
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              {personaStatus?.can_generate && (
                <Link to="/persona">
                  <Button variant="outline">페르소나 생성하기</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
