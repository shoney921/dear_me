import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, BookOpen } from 'lucide-react'

import { diaryService } from '@/services/diaryService'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/Loading'
import { formatDate } from '@/lib/utils'
import { MOODS, WEATHER } from '@/lib/constants'

export default function DiaryListPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['diaries', page],
    queryFn: () => diaryService.getList(page),
  })

  if (isLoading) {
    return <PageLoading />
  }

  const totalPages = Math.ceil((data?.total || 0) / 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">내 일기</h1>
          <p className="text-muted-foreground">총 {data?.total || 0}개의 일기</p>
        </div>
        <Link to="/diaries/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            일기 쓰기
          </Button>
        </Link>
      </div>

      {/* Diary List */}
      {data?.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">아직 작성된 일기가 없습니다</h3>
            <p className="mt-2 text-muted-foreground">첫 번째 일기를 작성해보세요!</p>
            <Link to="/diaries/new" className="mt-4">
              <Button>일기 쓰기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data?.items.map((diary) => (
            <Link key={diary.id} to={`/diaries/${diary.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{diary.title}</h3>
                        {diary.mood && (
                          <span title={MOODS[diary.mood as keyof typeof MOODS]?.label}>
                            {MOODS[diary.mood as keyof typeof MOODS]?.emoji}
                          </span>
                        )}
                        {diary.weather && (
                          <span title={WEATHER[diary.weather as keyof typeof WEATHER]?.label}>
                            {WEATHER[diary.weather as keyof typeof WEATHER]?.emoji}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {diary.content}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(diary.diary_date)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </Button>
          <span className="flex items-center px-4 text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}
