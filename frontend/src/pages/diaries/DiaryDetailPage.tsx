import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Save, X, Lock, LockOpen } from 'lucide-react'
import { useDiary, useUpdateDiary, useDeleteDiary } from '@/hooks/useDiaries'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MoodPicker } from '@/components/diary/MoodPicker'
import { WeatherPicker } from '@/components/diary/WeatherPicker'
import { PageLoading } from '@/components/common/Loading'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { MOOD_EMOJIS, MOOD_LABELS, WEATHER_EMOJIS, WEATHER_LABELS } from '@/types/diary'
import type { Mood, Weather } from '@/types/diary'

export function DiaryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const diaryId = Number(id)

  const { data: diary, isLoading, error } = useDiary(diaryId)
  const updateDiary = useUpdateDiary()
  const deleteDiary = useDeleteDiary()

  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editMood, setEditMood] = useState<Mood | null>(null)
  const [editWeather, setEditWeather] = useState<Weather | null>(null)
  const [editIsPrivate, setEditIsPrivate] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [updateError, setUpdateError] = useState('')

  const startEditing = () => {
    if (diary) {
      setEditContent(diary.content)
      setEditMood(diary.mood)
      setEditWeather(diary.weather)
      setEditIsPrivate(diary.is_private)
      setIsEditing(true)
      setUpdateError('')
    }
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setUpdateError('')
  }

  const handleUpdate = async () => {
    if (!editContent.trim()) {
      setUpdateError('일기 내용을 입력해주세요.')
      return
    }

    try {
      await updateDiary.mutateAsync({
        id: diaryId,
        data: {
          content: editContent.trim(),
          mood: editMood,
          weather: editWeather,
          is_private: editIsPrivate,
        },
      })
      setIsEditing(false)
    } catch (err: any) {
      setUpdateError(err.response?.data?.detail || '수정에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteDiary.mutateAsync(diaryId)
      navigate('/diaries')
    } catch (err: any) {
      setUpdateError(err.response?.data?.detail || '삭제에 실패했습니다.')
    }
  }

  if (isLoading) {
    return <PageLoading />
  }

  if (error || !diary) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">일기를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => navigate('/diaries')}>
          목록으로 돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/diaries')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{formatDate(diary.date)}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              {diary.mood && (
                <span>
                  {MOOD_EMOJIS[diary.mood]} {MOOD_LABELS[diary.mood]}
                </span>
              )}
              {diary.mood && diary.weather && <span>·</span>}
              {diary.weather && (
                <span>
                  {WEATHER_EMOJIS[diary.weather]} {WEATHER_LABELS[diary.weather]}
                </span>
              )}
              {diary.is_private && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5" /> 비공개
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Edit2 className="h-4 w-4 mr-2" />
              수정
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="font-medium mb-3">정말 이 일기를 삭제하시겠습니까?</p>
            <p className="text-sm text-muted-foreground mb-4">
              삭제된 일기는 복구할 수 없습니다.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteDiary.isPending}
              >
                {deleteDiary.isPending ? '삭제 중...' : '삭제'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <Card>
        {isEditing ? (
          <CardContent className="p-6 space-y-6">
            {updateError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {updateError}
              </div>
            )}

            <MoodPicker
              value={editMood}
              onChange={setEditMood}
              disabled={updateDiary.isPending}
            />

            <WeatherPicker
              value={editWeather}
              onChange={setEditWeather}
              disabled={updateDiary.isPending}
            />

            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                일기 내용
              </label>
              <textarea
                id="content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={cn(
                  'flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                  'ring-offset-background placeholder:text-muted-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'resize-none'
                )}
                disabled={updateDiary.isPending}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditIsPrivate(!editIsPrivate)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  editIsPrivate ? 'bg-primary' : 'bg-input'
                )}
                disabled={updateDiary.isPending}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    editIsPrivate ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
              <div className="flex items-center gap-2 text-sm">
                {editIsPrivate ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <LockOpen className="h-4 w-4" />
                )}
                <span>비공개 일기</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={cancelEditing}
                disabled={updateDiary.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
              <Button onClick={handleUpdate} disabled={updateDiary.isPending}>
                {updateDiary.isPending ? (
                  '저장 중...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-6">
            <p className="whitespace-pre-wrap leading-relaxed">{diary.content}</p>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
