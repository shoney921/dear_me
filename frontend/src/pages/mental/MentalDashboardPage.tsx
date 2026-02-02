import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Brain, BookOpen, FileText, ChevronRight, AlertCircle } from 'lucide-react'

import { mentalService } from '@/services/mentalService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageLoading } from '@/components/ui/Loading'
import { RadarChart, MentalStatusCard, MentalHistoryChart } from '@/components/mental'

export default function MentalDashboardPage() {
  const { data: currentStatus, isLoading: isLoadingStatus, error: statusError } = useQuery({
    queryKey: ['mentalCurrent'],
    queryFn: mentalService.getCurrentStatus,
  })

  const { data: radarData, isLoading: isLoadingRadar } = useQuery({
    queryKey: ['mentalRadar'],
    queryFn: mentalService.getRadarData,
  })

  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['mentalHistory'],
    queryFn: () => mentalService.getHistory(14),
  })

  const { data: negativeTrend } = useQuery({
    queryKey: ['mentalNegativeTrend'],
    queryFn: () => mentalService.checkNegativeTrend(7),
  })

  // Show page loading only when the critical status is loading
  if (isLoadingStatus) {
    return <PageLoading />
  }

  const hasNoData = statusError || !currentStatus

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-7 h-7 text-indigo-500" />
            심리 케어
          </h1>
          <p className="text-muted-foreground mt-1">
            일기를 통해 나의 마음 상태를 확인해보세요
          </p>
        </div>
      </div>

      {/* 부정적 추세 경고 */}
      {negativeTrend?.is_negative_trend && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">마음 챙김이 필요해 보여요</p>
              <p className="text-sm text-yellow-700 mt-1">
                최근 며칠간 힘든 시간을 보내고 계신 것 같아요.
                편하게 이야기 나눠보는 건 어떨까요?
              </p>
              <Link to="/persona" className="text-sm text-yellow-800 underline mt-2 inline-block">
                페르소나와 대화하기
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {hasNoData ? (
        // 데이터 없음 상태
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              아직 분석할 데이터가 없어요
            </h3>
            <p className="text-gray-500 mb-4">
              일기를 작성하면 AI가 자동으로 멘탈 상태를 분석해드려요
            </p>
            <Link to="/diaries/new">
              <Button>일기 쓰러 가기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 현재 상태 카드 */}
          {currentStatus && (
            <MentalStatusCard analysis={currentStatus} trend={radarData?.trend} />
          )}

          {/* 레이더 차트 - Progressive Loading */}
          {isLoadingRadar ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">심리 인바디 체크</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-pulse text-gray-400">
                    차트를 불러오는 중...
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : radarData ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">심리 인바디 체크</CardTitle>
              </CardHeader>
              <CardContent>
                <RadarChart
                  current={radarData.current}
                  previous={radarData.previous}
                />
                <p className="text-sm text-gray-500 text-center mt-2">
                  6가지 지표로 보는 나의 마음 상태
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* 히스토리 차트 - Progressive Loading */}
          {isLoadingHistory ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">최근 2주 변화</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse text-gray-400">
                    히스토리를 불러오는 중...
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : history && history.items.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">최근 2주 변화</CardTitle>
              </CardHeader>
              <CardContent>
                <MentalHistoryChart data={history.items} />
              </CardContent>
            </Card>
          ) : null}

          {/* 퀵 메뉴 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link to="/mental/books">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-pink-100 p-3">
                    <BookOpen className="h-5 w-5 text-pink-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">책 추천</h3>
                    <p className="text-sm text-muted-foreground">
                      현재 감정에 맞는 책
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link to="/mental/reports">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-blue-100 p-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">리포트</h3>
                    <p className="text-sm text-muted-foreground">
                      주간/월간 분석
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
