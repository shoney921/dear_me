import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash2, Pencil, X, Check } from 'lucide-react'

import { diaryService } from '@/services/diaryService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/Loading'
import { formatDate } from '@/lib/utils'
import { MOODS, WEATHER } from '@/lib/constants'
import { getApiErrorMessage } from '@/lib/error'

export default function DiaryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editMood, setEditMood] = useState<string>('')
  const [editWeather, setEditWeather] = useState<string>('')
  const [error, setError] = useState('')

  const { data: diary, isLoading } = useQuery({
    queryKey: ['diary', id],
    queryFn: () => diaryService.getById(Number(id)),
    enabled: !!id,
  })

  // Initialize edit form when diary loads or edit mode starts
  useEffect(() => {
    if (diary && isEditing) {
      setEditTitle(diary.title)
      setEditContent(diary.content)
      setEditMood(diary.mood || '')
      setEditWeather(diary.weather || '')
      setError('')
    }
  }, [diary, isEditing])

  const deleteMutation = useMutation({
    mutationFn: () => diaryService.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] })
      queryClient.invalidateQueries({ queryKey: ['diaryCount'] })
      navigate('/diaries')
    },
    onError: (err) => {
      setError(getApiErrorMessage(err))
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { title: string; content: string; mood?: string; weather?: string }) =>
      diaryService.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary', id] })
      queryClient.invalidateQueries({ queryKey: ['diaries'] })
      setIsEditing(false)
      setError('')
    },
    onError: (err) => {
      setError(getApiErrorMessage(err))
    },
  })

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate()
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setError('')
  }

  const handleSaveEdit = () => {
    if (!editTitle.trim() || !editContent.trim()) {
      setError('제목과 내용을 입력해주세요.')
      return
    }
    updateMutation.mutate({
      title: editTitle,
      content: editContent,
      mood: editMood || undefined,
      weather: editWeather || undefined,
    })
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
          {isEditing ? (
            <>
              <Button variant="outline" size="icon" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                <Check className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="icon" onClick={handleEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">제목</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">오늘의 기분</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(MOODS).map(([key, { label, emoji }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditMood(editMood === key ? '' : key)}
                      className={`rounded-full px-3 py-1 text-sm transition-colors ${
                        editMood === key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">날씨</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(WEATHER).map(([key, { label, emoji }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditWeather(editWeather === key ? '' : key)}
                      className={`rounded-full px-3 py-1 text-sm transition-colors ${
                        editWeather === key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
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
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <textarea
              className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="내용을 입력하세요"
            />
          ) : (
            <div className="whitespace-pre-wrap text-foreground">
              {diary.content}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
