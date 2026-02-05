import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { diaryService } from '@/services/diaryService'
import { MOODS } from '@/lib/constants'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

interface EmotionCalendarProps {
  className?: string
}

export function EmotionCalendar({ className }: EmotionCalendarProps) {
  const navigate = useNavigate()
  const today = new Date()
  const [currentDate, setCurrentDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  })

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['diaryCalendar', currentDate.year, currentDate.month],
    queryFn: () => diaryService.getCalendar(currentDate.year, currentDate.month),
  })

  const calendarDays = useMemo(() => {
    const { year, month } = currentDate
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days: Array<{
      date: number | null
      isToday: boolean
      mood: string | null
      diaryId: number | null
    }> = []

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, isToday: false, mood: null, diaryId: null })
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const diaryEntry = calendarData?.items.find(item => item.diary_date === dateStr)
      const isToday = today.getFullYear() === year &&
                      today.getMonth() + 1 === month &&
                      today.getDate() === day

      days.push({
        date: day,
        isToday,
        mood: diaryEntry?.mood || null,
        diaryId: diaryEntry?.diary_id || null,
      })
    }

    return days
  }, [currentDate, calendarData, today])

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 }
      }
      return { ...prev, month: prev.month - 1 }
    })
  }

  const handleNextMonth = () => {
    const now = new Date()
    const nextMonth = currentDate.month === 12 ? 1 : currentDate.month + 1
    const nextYear = currentDate.month === 12 ? currentDate.year + 1 : currentDate.year

    // Don't allow going past current month
    if (nextYear > now.getFullYear() ||
        (nextYear === now.getFullYear() && nextMonth > now.getMonth() + 1)) {
      return
    }

    setCurrentDate({ year: nextYear, month: nextMonth })
  }

  const handleDayClick = (diaryId: number | null, date: number | null, isToday: boolean) => {
    if (diaryId) {
      navigate(`/diaries/${diaryId}`)
    } else if (date) {
      // If no diary for this day, navigate to new diary page
      const dateStr = `${currentDate.year}-${String(currentDate.month).padStart(2, '0')}-${String(date).padStart(2, '0')}`

      // Allow writing for today and past 3 days
      if (isToday) {
        // Today is always writable
        navigate(`/diaries/new?date=${dateStr}`)
        return
      }

      // Check if date is within last 3 days
      const clickedDate = new Date(currentDate.year, currentDate.month - 1, date)
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0)
      clickedDate.setHours(0, 0, 0, 0)

      const minDate = new Date(todayDate)
      minDate.setDate(minDate.getDate() - 3)

      if (clickedDate <= todayDate && clickedDate >= minDate) {
        navigate(`/diaries/new?date=${dateStr}`)
      }
    }
  }

  const isNextDisabled = () => {
    const now = new Date()
    const nextMonth = currentDate.month === 12 ? 1 : currentDate.month + 1
    const nextYear = currentDate.month === 12 ? currentDate.year + 1 : currentDate.year
    return nextYear > now.getFullYear() ||
           (nextYear === now.getFullYear() && nextMonth > now.getMonth() + 1)
  }

  return (
    <Card className={`flex flex-col ${className || ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            감정 캘린더
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[100px] text-center text-sm font-medium">
              {currentDate.year}년 {currentDate.month}월
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleNextMonth}
              disabled={isNextDisabled()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-2">
        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {DAYS.map((day, i) => (
            <div
              key={day}
              className={`text-center text-xs font-medium ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-cols-7 gap-1 content-start">
          {isLoading ? (
            // Skeleton loading
            Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-md bg-muted"
              />
            ))
          ) : (
            calendarDays.map((day, i) => {
              if (day.date === null) {
                return <div key={i} className="aspect-square" />
              }

              const moodInfo = day.mood && MOODS[day.mood as keyof typeof MOODS]
              const hasEntry = !!day.diaryId
              const dayOfWeek = (i) % 7

              // Check if this date is writable (today or within last 3 days)
              const checkDate = new Date(currentDate.year, currentDate.month - 1, day.date)
              const todayCheck = new Date()
              todayCheck.setHours(0, 0, 0, 0)
              checkDate.setHours(0, 0, 0, 0)
              const minCheck = new Date(todayCheck)
              minCheck.setDate(minCheck.getDate() - 3)
              const isWritable = !hasEntry && checkDate <= todayCheck && checkDate >= minCheck

              return (
                <button
                  key={i}
                  onClick={() => handleDayClick(day.diaryId, day.date, day.isToday)}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-md
                    text-xs transition-all
                    ${day.isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                    ${hasEntry ? 'bg-primary/10 hover:bg-primary/20 cursor-pointer' : ''}
                    ${isWritable ? 'hover:bg-primary/5 cursor-pointer' : !hasEntry ? 'cursor-default' : ''}
                    ${dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : ''}
                  `}
                >
                  <span className={`text-[10px] ${day.isToday ? 'font-bold' : ''}`}>
                    {day.date}
                  </span>
                  {moodInfo && (
                    <span className="text-sm leading-none mt-0.5">
                      {moodInfo.emoji}
                    </span>
                  )}
                  {hasEntry && !moodInfo && (
                    <span className="text-sm leading-none mt-0.5">📝</span>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-primary/10" />
            <span>일기 작성</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded ring-2 ring-primary ring-offset-1" />
            <span>오늘</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
