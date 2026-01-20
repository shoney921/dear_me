import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, User, Users, Plus, ChevronRight } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import { diaryService } from '@/services/diaryService'
import { personaService } from '@/services/personaService'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/Loading'
import { MIN_DIARIES_FOR_PERSONA } from '@/lib/constants'

export default function HomePage() {
  const { user } = useAuthStore()

  const { data: diaryCount, isLoading: isLoadingDiary } = useQuery({
    queryKey: ['diaryCount'],
    queryFn: diaryService.getCount,
  })

  const { data: personaStatus, isLoading: isLoadingPersona } = useQuery({
    queryKey: ['personaStatus'],
    queryFn: personaService.getStatus,
  })

  if (isLoadingDiary || isLoadingPersona) {
    return <PageLoading />
  }

  const progress = Math.min(
    ((diaryCount?.count || 0) / MIN_DIARIES_FOR_PERSONA) * 100,
    100
  )

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-6">
        <h1 className="text-2xl font-bold">
          안녕하세요, {user?.username}님!
        </h1>
        <p className="mt-2 text-muted-foreground">
          오늘도 DearMe와 함께 특별한 하루를 기록해보세요.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Write Diary */}
        <Link to="/diaries/new">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-primary/10 p-3">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">일기 쓰기</h3>
                <p className="text-sm text-muted-foreground">오늘의 이야기를 기록하세요</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        {/* My Diaries */}
        <Link to="/diaries">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-blue-500/10 p-3">
                <BookOpen className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">내 일기</h3>
                <p className="text-sm text-muted-foreground">
                  {diaryCount?.count || 0}개의 일기
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        {/* Friends */}
        <Link to="/friends">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-green-500/10 p-3">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">친구</h3>
                <p className="text-sm text-muted-foreground">친구와 소통하세요</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
              <p className="text-muted-foreground">
                일기를 {MIN_DIARIES_FOR_PERSONA}개 이상 작성하면 나만의 AI 페르소나가 생성됩니다.
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
                  <Button>페르소나 생성하기</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
