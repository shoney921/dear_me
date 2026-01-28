import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Lightbulb, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

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
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [diaryDate, setDiaryDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  // 날짜 제한: 오늘부터 3일 전까지만 허용
  const { minDate, maxDate } = useMemo(() => {
    const today = new Date()
    const min = new Date(today)
    min.setDate(today.getDate() - 3)
    return {
      minDate: min.toISOString().split('T')[0],
      maxDate: today.toISOString().split('T')[0],
    }
  }, [])

  const { data: suggestions, isLoading: isSuggestionsLoading, refetch: refetchSuggestions } = useQuery({
    queryKey: ['diaryPromptSuggestions'],
    queryFn: () => diaryService.getPromptSuggestions(),
    enabled: showSuggestions,
  })

  const createMutation = useMutation({
    mutationFn: diaryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] })
      queryClient.invalidateQueries({ queryKey: ['diaryCount'] })
      queryClient.invalidateQueries({ queryKey: ['personaStatus'] })
      queryClient.invalidateQueries({ queryKey: ['mentalCurrent'] })
      queryClient.invalidateQueries({ queryKey: ['mentalRadar'] })
      queryClient.invalidateQueries({ queryKey: ['mentalHistory'] })
      toast.success('일기가 저장되었습니다. 심리 분석이 완료되면 심리 케어에서 확인할 수 있어요!')
      navigate('/diaries')
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 날짜 유효성 검증
    if (diaryDate < minDate || diaryDate > maxDate) {
      toast.error('오늘부터 3일 전까지의 일기만 작성할 수 있습니다.')
      return
    }

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
            <div className="flex items-center justify-between">
              <CardTitle>오늘 하루는 어땠나요?</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                주제 추천
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prompt Suggestions */}
            {showSuggestions && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium">오늘의 일기 주제</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchSuggestions()}
                    disabled={isSuggestionsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isSuggestionsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                {isSuggestionsLoading ? (
                  <p className="text-sm text-muted-foreground">추천 주제를 생성하는 중...</p>
                ) : suggestions?.prompts && suggestions.prompts.length > 0 ? (
                  <div className="space-y-2">
                    {suggestions.prompts.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setTitle(suggestion.title)
                          setContent(suggestion.description + '\n\n')
                          setShowSuggestions(false)
                        }}
                        className="w-full rounded-md border bg-background p-3 text-left transition-colors hover:bg-secondary"
                      >
                        <p className="font-medium">{suggestion.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {suggestion.description}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">추천 주제를 불러올 수 없습니다.</p>
                )}
              </div>
            )}

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">날짜</label>
              <Input
                type="date"
                value={diaryDate}
                onChange={(e) => setDiaryDate(e.target.value)}
                min={minDate}
                max={maxDate}
                required
              />
              <p className="text-xs text-muted-foreground">
                오늘부터 3일 전까지의 일기만 작성할 수 있습니다.
              </p>
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
