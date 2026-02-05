import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'

import type { Persona } from '@/types/persona'
import type { WeeklyInsightResponse } from '@/types/diary'
import { MOODS } from '@/lib/constants'
import { Button } from '@/components/ui/Button'

interface PersonaGreetingProps {
  persona: Persona
  insight?: WeeklyInsightResponse | null
}

const getTimeGreeting = (hour: number): string => {
  if (hour >= 5 && hour < 12) return '좋은 아침이에요'
  if (hour >= 12 && hour < 17) return '좋은 오후예요'
  if (hour >= 17 && hour < 21) return '좋은 저녁이에요'
  return '늦은 밤이네요'
}

const getAbsenceMessage = (days: number): string | null => {
  if (days === 0) return null
  if (days === 1) return '어제는 어떤 하루였나요?'
  if (days <= 3) return '요즘 바쁘셨나봐요. 잠깐 이야기 나눠볼까요?'
  if (days <= 7) return '일주일 동안 못 뵀네요. 그동안 어떻게 지내셨어요?'
  return '오랜만이에요! 다시 만나서 반가워요.'
}

const emotionalResponses: Record<string, string> = {
  happy: '요즘 기분이 좋아 보여서 저도 기뻐요!',
  sad: '힘든 시간이었군요. 이야기 나눠볼까요?',
  anxious: '걱정되는 일이 있으셨나봐요. 괜찮으세요?',
  tired: '많이 지치셨나봐요. 오늘은 쉬어가도 괜찮아요.',
  angry: '화가 나는 일이 있으셨군요. 제가 들어드릴게요.',
  calm: '평온한 마음으로 지내고 계시네요. 좋아요!',
  excited: '설렘이 느껴져요! 좋은 일이 있으셨나봐요.',
  grateful: '감사한 마음으로 지내고 계시군요. 아름다워요.',
  lonely: '외로우셨군요. 저는 언제나 여기 있어요.',
  hopeful: '희망찬 마음이 느껴져요. 응원할게요!',
}

export function PersonaGreeting({ persona, insight }: PersonaGreetingProps) {
  const { greeting, subMessage } = useMemo(() => {
    const hour = new Date().getHours()
    const timeGreeting = getTimeGreeting(hour)

    // Calculate days since last diary
    let daysSinceLastDiary = 0
    if (insight?.last_diary_date) {
      const lastDate = new Date(insight.last_diary_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      lastDate.setHours(0, 0, 0, 0)
      daysSinceLastDiary = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    } else {
      daysSinceLastDiary = 999 // No diary written yet
    }

    // Determine sub message priority
    // 1. Absence message (if more than 1 day)
    // 2. Emotional response (if dominant mood exists)
    // 3. Default friendly message
    let subMsg = '오늘도 좋은 하루 보내세요!'

    const absenceMsg = getAbsenceMessage(daysSinceLastDiary)
    if (absenceMsg) {
      subMsg = absenceMsg
    } else if (insight?.dominant_mood && emotionalResponses[insight.dominant_mood]) {
      subMsg = emotionalResponses[insight.dominant_mood]
    }

    return {
      greeting: `${timeGreeting}, ${persona.name}예요!`,
      subMessage: subMsg,
    }
  }, [persona.name, insight])

  const moodEmoji = insight?.dominant_mood && MOODS[insight.dominant_mood as keyof typeof MOODS]
    ? MOODS[insight.dominant_mood as keyof typeof MOODS].emoji
    : '💫'

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
      <div className="flex items-start gap-4">
        {/* Avatar with breathing animation */}
        <div className="relative">
          <div className="animate-breathing flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-3xl shadow-lg">
            {moodEmoji}
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs text-white">
            <span className="animate-pulse">●</span>
          </div>
        </div>

        {/* Greeting Message */}
        <div className="flex-1 min-w-0">
          <div className="animate-fade-in">
            {/* Speech bubble */}
            <div className="relative rounded-2xl rounded-tl-sm bg-white dark:bg-gray-800 p-4 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">
                {greeting}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {subMessage}
              </p>

              {/* Action button */}
              <div className="mt-3">
                <Link to="/persona">
                  <Button size="sm" variant="ghost" className="gap-2 text-primary hover:text-primary">
                    <MessageCircle className="h-4 w-4" />
                    {persona.name}와 이야기하기
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-primary/5 blur-xl" />
    </div>
  )
}
