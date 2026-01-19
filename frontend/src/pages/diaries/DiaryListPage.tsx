import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Calendar from 'react-calendar'
import { PenLine, ChevronLeft, ChevronRight, List, CalendarDays } from 'lucide-react'
import { useDiaries } from '@/hooks/useDiaries'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DiaryCard } from '@/components/diary/DiaryCard'
import { Loading } from '@/components/common/Loading'
import { formatDate, toDateString } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { MOOD_EMOJIS } from '@/types/diary'

type ViewMode = 'calendar' | 'list'

export function DiaryListPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [activeDate, setActiveDate] = useState(new Date())

  const year = activeDate.getFullYear()
  const month = activeDate.getMonth() + 1

  const { data, isLoading } = useDiaries(year, month)

  const diaryDateMap = useMemo(() => {
    if (!data?.items) return new Map()
    return new Map(data.items.map((d) => [d.date, d]))
  }, [data?.items])

  const handleDateClick = (date: Date) => {
    const dateStr = toDateString(date)
    const diary = diaryDateMap.get(dateStr)

    if (diary) {
      navigate(`/diaries/${diary.id}`)
    } else {
      navigate(`/diaries/new?date=${dateStr}`)
    }
  }

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setActiveDate((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const tileContent = ({ date }: { date: Date }) => {
    const dateStr = toDateString(date)
    const diary = diaryDateMap.get(dateStr)

    if (diary) {
      return (
        <div className="flex flex-col items-center">
          {diary.mood && (
            <span className="text-xs">{MOOD_EMOJIS[diary.mood]}</span>
          )}
          {!diary.mood && <div className="diary-dot" />}
        </div>
      )
    }
    return null
  }

  const tileClassName = ({ date }: { date: Date }) => {
    const dateStr = toDateString(date)
    const hasDiary = diaryDateMap.has(dateStr)
    return hasDiary ? 'has-diary' : ''
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">내 일기</h1>
          <p className="text-muted-foreground">
            {data?.total || 0}개의 일기
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'calendar'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
            >
              <CalendarDays className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => navigate('/diaries/new')}>
            <PenLine className="mr-2 h-4 w-4" />
            일기 쓰기
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" text="일기를 불러오는 중..." />
        </div>
      ) : viewMode === 'calendar' ? (
        /* Calendar View */
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleMonthChange('prev')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-lg">
              {formatDate(activeDate, 'month')}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleMonthChange('next')}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <Calendar
              value={activeDate}
              onClickDay={handleDateClick}
              activeStartDate={activeDate}
              onActiveStartDateChange={({ activeStartDate }) =>
                activeStartDate && setActiveDate(activeStartDate)
              }
              tileContent={tileContent}
              tileClassName={tileClassName}
              locale="ko-KR"
              formatDay={(_, date) => date.getDate().toString()}
              showNavigation={false}
              calendarType="gregory"
            />
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="diary-dot" />
                <span>일기 작성됨</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMonthChange('prev')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              이전 달
            </Button>
            <span className="font-medium">{formatDate(activeDate, 'month')}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMonthChange('next')}
            >
              다음 달
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {data?.items && data.items.length > 0 ? (
            <div className="grid gap-3">
              {data.items.map((diary) => (
                <DiaryCard key={diary.id} diary={diary} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  이 달에 작성된 일기가 없습니다.
                </p>
                <Button onClick={() => navigate('/diaries/new')}>
                  <PenLine className="mr-2 h-4 w-4" />
                  첫 일기 쓰기
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
