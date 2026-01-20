import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'

import { diaryService } from '@/services/diaryService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { MOODS, WEATHER } from '@/lib/constants'
import { getApiErrorMessage } from '@/lib/error'

export default function DiaryNewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<string>('')
  const [weather, setWeather] = useState<string>('')
  const [error, setError] = useState('')
  const [diaryDate, setDiaryDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const createMutation = useMutation({
    mutationFn: diaryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] })
      queryClient.invalidateQueries({ queryKey: ['diaryCount'] })
      queryClient.invalidateQueries({ queryKey: ['personaStatus'] })
      navigate('/diaries')
    },
    onError: (err) => {
      setError(getApiErrorMessage(err))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    createMutation.mutate({
      title,
      content,
      mood: mood || undefined,
      weather: weather || undefined,
      diary_date: diaryDate,
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">일기 쓰기</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>오늘 하루는 어땠나요?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">날짜</label>
              <Input
                type="date"
                value={diaryDate}
                onChange={(e) => setDiaryDate(e.target.value)}
                required
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">제목</label>
              <Input
                placeholder="오늘의 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Mood */}
            <div className="space-y-2">
              <label className="text-sm font-medium">오늘의 기분</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(MOODS).map(([key, { label, emoji }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMood(mood === key ? '' : key)}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      mood === key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weather */}
            <div className="space-y-2">
              <label className="text-sm font-medium">날씨</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(WEATHER).map(([key, { label, emoji }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setWeather(weather === key ? '' : key)}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      weather === key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium">내용</label>
              <textarea
                className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="오늘 있었던 일을 자유롭게 적어보세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                취소
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '저장 중...' : '저장'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
