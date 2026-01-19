import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Lock } from 'lucide-react'
import { useCreateDiary } from '@/hooks/useDiaries'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MoodPicker } from '@/components/diary/MoodPicker'
import { WeatherPicker } from '@/components/diary/WeatherPicker'
import { formatDate, toDateString } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Mood, Weather } from '@/types/diary'

export function DiaryNewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dateParam = searchParams.get('date')

  const [content, setContent] = useState('')
  const [mood, setMood] = useState<Mood | null>(null)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [date] = useState(dateParam || toDateString(new Date()))
  const [error, setError] = useState('')

  const createDiary = useCreateDiary()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!content.trim()) {
      setError('일기 내용을 입력해주세요.')
      return
    }

    try {
      const diary = await createDiary.mutateAsync({
        content: content.trim(),
        mood,
        weather,
        date,
        is_private: isPrivate,
      })
      navigate(`/diaries/${diary.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || '일기 저장에 실패했습니다.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">일기 작성</h1>
          <p className="text-muted-foreground">{formatDate(date)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">오늘 하루는 어땠나요?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {/* Mood Picker */}
            <MoodPicker
              value={mood}
              onChange={setMood}
              disabled={createDiary.isPending}
            />

            {/* Weather Picker */}
            <WeatherPicker
              value={weather}
              onChange={setWeather}
              disabled={createDiary.isPending}
            />

            {/* Content */}
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                오늘의 일기
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="오늘 있었던 일, 느낀 점, 생각들을 자유롭게 적어보세요..."
                className={cn(
                  'flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                  'ring-offset-background placeholder:text-muted-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'resize-none'
                )}
                disabled={createDiary.isPending}
              />
            </div>

            {/* Private Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  isPrivate ? 'bg-primary' : 'bg-input'
                )}
                disabled={createDiary.isPending}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    isPrivate ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
              <div className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4" />
                <span>비공개 일기 (페르소나 생성에서 제외)</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={createDiary.isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={createDiary.isPending}>
                {createDiary.isPending ? (
                  '저장 중...'
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    저장하기
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
