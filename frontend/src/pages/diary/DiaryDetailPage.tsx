import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash2 } from 'lucide-react'

import { diaryService } from '@/services/diaryService'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/Loading'
import { formatDate } from '@/lib/utils'
import { MOODS, WEATHER } from '@/lib/constants'

export default function DiaryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: diary, isLoading } = useQuery({
    queryKey: ['diary', id],
    queryFn: () => diaryService.getById(Number(id)),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => diaryService.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] })
      queryClient.invalidateQueries({ queryKey: ['diaryCount'] })
      navigate('/diaries')
    },
  })

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) {
    return <PageLoading />
  }

  if (!diary) {
    return (
      <div className="text-center">
        <p>일기를 찾을 수 없습니다.</p>
        <Button onClick={() => navigate('/diaries')} className="mt-4">
          목록으로
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-muted-foreground">
            {formatDate(diary.diary_date)}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {diary.title}
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-foreground">
            {diary.content}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
