import { Link } from 'react-router-dom'
import { PenLine, User, Calendar, TrendingUp, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDiaryStats, useDiaryByDate } from '@/hooks/useDiaries'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Loading } from '@/components/common/Loading'
import { formatDate, toDateString } from '@/lib/utils'

export function HomePage() {
  const { user } = useAuthStore()
  const today = toDateString(new Date())
  const { data: stats, isLoading: statsLoading } = useDiaryStats()
  const { data: todayDiary, isLoading: todayLoading } = useDiaryByDate(today)

  const diaryCount = stats?.total || 0
  const canCreatePersona = diaryCount >= 7
  const progressPercent = Math.min((diaryCount / 7) * 100, 100)

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            안녕하세요, {user?.username}님!
          </h1>
          <p className="text-muted-foreground">{formatDate(new Date())}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Diary Card */}
        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              <PenLine className="inline-block h-5 w-5 mr-2" />
              오늘의 일기
            </CardTitle>
            <span className="text-sm text-muted-foreground">{formatDate(new Date(), 'short')}</span>
          </CardHeader>
          <CardContent>
            {todayLoading ? (
              <Loading size="sm" />
            ) : todayDiary ? (
              <div className="space-y-3">
                <p className="text-muted-foreground line-clamp-2">
                  {todayDiary.content.substring(0, 150)}
                  {todayDiary.content.length > 150 && '...'}
                </p>
                <Link to={`/diaries/${todayDiary.id}`}>
                  <Button variant="outline" size="sm">
                    일기 보기
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  아직 오늘 일기를 작성하지 않았어요.
                </p>
                <Link to="/diaries/new">
                  <Button>
                    <PenLine className="mr-2 h-4 w-4" />
                    일기 작성하기
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">
              <TrendingUp className="inline-block h-5 w-5 mr-2" />
              작성 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loading size="sm" />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">총 일기</span>
                  <span className="font-semibold">{stats?.total || 0}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">이번 달</span>
                  <span className="font-semibold">{stats?.this_month_count || 0}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">연속 작성</span>
                  <span className="font-semibold">{stats?.streak || 0}일</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Persona Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            <User className="inline-block h-5 w-5 mr-2" />
            내 페르소나
          </CardTitle>
          <CardDescription>
            {canCreatePersona
              ? '페르소나를 생성할 수 있습니다!'
              : `일기 ${diaryCount}/7개 작성됨`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">진행률</span>
                <span className="font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {canCreatePersona ? (
              <Link to="/persona">
                <Button className="w-full">
                  <User className="mr-2 h-4 w-4" />
                  페르소나 보기
                </Button>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                {7 - diaryCount}개 더 작성하면 페르소나를 만들 수 있어요!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-medium">
              <Calendar className="inline-block h-5 w-5 mr-2" />
              이번 달 일기
            </CardTitle>
            <CardDescription>{formatDate(new Date(), 'month')}</CardDescription>
          </div>
          <Link to="/diaries">
            <Button variant="outline" size="sm">
              전체 보기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            캘린더에서 일기를 확인하세요.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
