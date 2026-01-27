import { Flame, Trophy, Award, Star, Crown, Medal } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface StreakCardProps {
  currentStreak: number
  longestStreak: number
  totalCount: number
  compact?: boolean
}

// Badge definitions
const BADGES = [
  {
    id: 'beginner',
    name: '시작이 반',
    description: '첫 일기 작성',
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    requirement: 1,
  },
  {
    id: 'writer_10',
    name: '열정 작가',
    description: '일기 10개 작성',
    icon: Award,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    requirement: 10,
  },
  {
    id: 'writer_30',
    name: '습관 형성',
    description: '일기 30개 작성',
    icon: Medal,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    requirement: 30,
  },
  {
    id: 'writer_100',
    name: '일기 마스터',
    description: '일기 100개 작성',
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    requirement: 100,
  },
  {
    id: 'streak_7',
    name: '일주일 연속',
    description: '7일 연속 작성',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    requirement: 7,
    type: 'streak',
  },
  {
    id: 'streak_30',
    name: '한 달 연속',
    description: '30일 연속 작성',
    icon: Trophy,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    requirement: 30,
    type: 'streak',
  },
]

export function StreakCard({ currentStreak, longestStreak, totalCount, compact = false }: StreakCardProps) {
  // Calculate earned badges
  const earnedBadges = BADGES.filter((badge) => {
    if (badge.type === 'streak') {
      return longestStreak >= badge.requirement
    }
    return totalCount >= badge.requirement
  })

  const nextBadge = BADGES.find((badge) => {
    if (badge.type === 'streak') {
      return longestStreak < badge.requirement
    }
    return totalCount < badge.requirement
  })

  if (compact) {
    return (
      <Card className={cn(
        'border-orange-200 dark:border-orange-800',
        currentStreak > 0 && 'bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20'
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                currentStreak > 0
                  ? 'bg-gradient-to-br from-orange-500 to-red-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              )}>
                <Flame className={cn(
                  'h-6 w-6',
                  currentStreak > 0 ? 'text-white' : 'text-gray-400'
                )} />
              </div>
              <div>
                <p className="text-2xl font-bold">{currentStreak}일</p>
                <p className="text-sm text-muted-foreground">연속 작성 중</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">최장 기록</p>
              <p className="text-lg font-semibold">{longestStreak}일</p>
            </div>
          </div>
          {currentStreak > 0 && currentStreak === longestStreak && (
            <p className="mt-2 text-center text-sm text-orange-600 dark:text-orange-400 font-medium">
              최장 기록 갱신 중!
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Streak Display */}
      <Card className={cn(
        'border-orange-200 dark:border-orange-800',
        currentStreak > 0 && 'bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20'
      )}>
        <CardContent className="py-6">
          <div className="flex flex-col items-center text-center">
            <div className={cn(
              'mb-4 flex h-20 w-20 items-center justify-center rounded-full',
              currentStreak > 0
                ? 'bg-gradient-to-br from-orange-500 to-red-500 animate-pulse'
                : 'bg-gray-200 dark:bg-gray-700'
            )}>
              <Flame className={cn(
                'h-10 w-10',
                currentStreak > 0 ? 'text-white' : 'text-gray-400'
              )} />
            </div>
            <p className="text-4xl font-bold">{currentStreak}일</p>
            <p className="text-muted-foreground">연속 작성 중</p>
            {currentStreak > 0 && currentStreak === longestStreak && (
              <p className="mt-2 text-sm text-orange-600 dark:text-orange-400 font-medium">
                최장 기록 갱신 중!
              </p>
            )}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{longestStreak}일</p>
              <p className="text-sm text-muted-foreground">최장 기록</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{totalCount}개</p>
              <p className="text-sm text-muted-foreground">총 일기</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardContent className="py-4">
          <h3 className="font-semibold mb-3">획득한 배지</h3>
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {earnedBadges.map((badge) => {
                const Icon = badge.icon
                return (
                  <div
                    key={badge.id}
                    className={cn(
                      'flex flex-col items-center p-3 rounded-lg',
                      badge.bgColor
                    )}
                    title={badge.description}
                  >
                    <Icon className={cn('h-6 w-6 mb-1', badge.color)} />
                    <span className="text-xs font-medium text-center">{badge.name}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              아직 획득한 배지가 없어요. 일기를 작성해보세요!
            </p>
          )}

          {/* Next badge progress */}
          {nextBadge && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">다음 배지: {nextBadge.name}</span>
                <span className="font-medium">
                  {nextBadge.type === 'streak'
                    ? `${longestStreak}/${nextBadge.requirement}일`
                    : `${totalCount}/${nextBadge.requirement}개`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn('h-full transition-all', nextBadge.bgColor.replace('bg-', 'bg-').replace('100', '500').replace('/30', ''))}
                  style={{
                    width: `${Math.min(100, ((nextBadge.type === 'streak' ? longestStreak : totalCount) / nextBadge.requirement) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-2 py-1 text-xs font-medium text-white">
      <Flame className="h-3 w-3" />
      {streak}일
    </div>
  )
}
