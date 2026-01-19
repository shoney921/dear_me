import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import { MOOD_EMOJIS, WEATHER_EMOJIS } from '@/types/diary'
import type { Diary } from '@/types/diary'

interface DiaryCardProps {
  diary: Diary
}

export function DiaryCard({ diary }: DiaryCardProps) {
  return (
    <Link to={`/diaries/${diary.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">
                  {formatDate(diary.date, 'short')}
                </span>
                {diary.mood && (
                  <span className="text-base" title={diary.mood}>
                    {MOOD_EMOJIS[diary.mood]}
                  </span>
                )}
                {diary.weather && (
                  <span className="text-base" title={diary.weather}>
                    {WEATHER_EMOJIS[diary.weather]}
                  </span>
                )}
                {diary.is_private && (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {diary.content}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
