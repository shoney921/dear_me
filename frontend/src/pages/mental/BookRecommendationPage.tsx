import { useQuery } from '@tanstack/react-query'
import { BookOpen, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { mentalService } from '@/services/mentalService'
import { Card, CardContent } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'
import { BookList } from '@/components/mental'

const STATUS_LABELS: Record<string, string> = {
  good: '좋은',
  neutral: '평온한',
  concerning: '힘든',
  critical: '많이 지친',
}

export default function BookRecommendationPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bookRecommendations'],
    queryFn: mentalService.getBookRecommendations,
  })

  if (isLoading) {
    return <PageLoading />
  }

  const statusLabel = data?.based_on_status ? STATUS_LABELS[data.based_on_status] || data.based_on_status : ''

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
            <BookOpen className="w-7 h-7 text-pink-500" />
            책 추천
          </h1>
          <p className="text-muted-foreground mt-1">
            현재 감정에 맞는 책을 추천해드려요
          </p>
        </div>
      </div>

      {error || !data?.books?.length ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              추천할 책이 없어요
            </h3>
            <p className="text-gray-500 mb-4">
              일기를 작성하면 감정에 맞는 책을 추천해드려요
            </p>
            <Link to="/diaries/new">
              <Button>일기 쓰러 가기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 상태 안내 */}
          <Card className="bg-gradient-to-r from-pink-50 to-purple-50">
            <CardContent className="p-4">
              <p className="text-gray-700">
                <span className="font-medium">{statusLabel}</span> 상태의 당신을 위해
                {' '}AI가 엄선한 책들이에요.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                책을 통해 마음의 위안을 얻어보세요.
              </p>
            </CardContent>
          </Card>

          {/* 책 목록 */}
          <BookList books={data.books} />

          {/* 추가 안내 */}
          <Card className="bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600">
                추천된 책이 마음에 들지 않나요?
              </p>
              <p className="text-xs text-gray-500 mt-1">
                일기를 더 작성하면 더 정확한 추천을 받을 수 있어요
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
