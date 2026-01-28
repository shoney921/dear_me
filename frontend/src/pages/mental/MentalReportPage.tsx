import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { mentalService } from '@/services/mentalService'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageLoading } from '@/components/ui/Loading'
import { ReportCard } from '@/components/mental'

type ReportTab = 'weekly' | 'monthly'

export default function MentalReportPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('weekly')

  const { data: weeklyReport, isLoading: isLoadingWeekly, error: weeklyError } = useQuery({
    queryKey: ['mentalWeeklyReport'],
    queryFn: mentalService.getWeeklyReport,
    enabled: activeTab === 'weekly',
  })

  const { data: monthlyReport, isLoading: isLoadingMonthly, error: monthlyError } = useQuery({
    queryKey: ['mentalMonthlyReport'],
    queryFn: mentalService.getMonthlyReport,
    enabled: activeTab === 'monthly',
  })

  const isLoading = activeTab === 'weekly' ? isLoadingWeekly : isLoadingMonthly
  const error = activeTab === 'weekly' ? weeklyError : monthlyError
  const report = activeTab === 'weekly' ? weeklyReport : monthlyReport

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link to="/mental">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            뒤로
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-500" />
            멘탈 리포트
          </h1>
          <p className="text-muted-foreground mt-1">
            주간/월간 멘탈 변화를 확인해보세요
          </p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'weekly'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          주간
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'monthly'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          월간
        </button>
      </div>

      {/* 리포트 내용 */}
      {isLoading ? (
        <PageLoading />
      ) : error || !report ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {activeTab === 'weekly' ? '주간' : '월간'} 리포트가 없어요
            </h3>
            <p className="text-gray-500 mb-4">
              일기를 더 작성하면 리포트를 생성해드려요
            </p>
            <Link to="/diaries/new">
              <Button>일기 쓰러 가기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ReportCard report={report} type={activeTab} />
      )}

      {/* 안내 */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">리포트 안내</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 주간 리포트는 매주 일기 분석을 종합해서 생성돼요</li>
            <li>• 월간 리포트는 한 달간의 변화를 보여줘요</li>
            <li>• 꾸준히 일기를 쓰면 더 정확한 분석을 받을 수 있어요</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
