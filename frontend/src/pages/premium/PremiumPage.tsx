import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Crown, Check, Sparkles, MessageCircle, Users, Lock } from 'lucide-react'

import { subscriptionService } from '@/services/subscriptionService'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PageLoading, Loading } from '@/components/ui/Loading'
import { getApiErrorMessage } from '@/lib/error'

export default function PremiumPage() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: subscriptionService.getStatus,
  })

  const { data: usageStatus, isLoading: isLoadingUsage } = useQuery({
    queryKey: ['usageStatus'],
    queryFn: subscriptionService.getUsageStatus,
  })

  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: subscriptionService.getPlans,
  })

  const upgradeMutation = useMutation({
    mutationFn: subscriptionService.upgrade,
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] })
      queryClient.invalidateQueries({ queryKey: ['usageStatus'] })
      queryClient.invalidateQueries({ queryKey: ['mySubscription'] })
    },
    onError: (err) => {
      setError(getApiErrorMessage(err))
    },
  })

  const cancelMutation = useMutation({
    mutationFn: subscriptionService.cancel,
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] })
      queryClient.invalidateQueries({ queryKey: ['usageStatus'] })
      queryClient.invalidateQueries({ queryKey: ['mySubscription'] })
    },
    onError: (err) => {
      setError(getApiErrorMessage(err))
    },
  })

  if (isLoadingStatus || isLoadingPlans || isLoadingUsage) {
    return <PageLoading />
  }

  const isPremium = status?.is_premium

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* 현재 구독 상태 */}
      <Card className={isPremium ? 'border-yellow-500 bg-yellow-50/50' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className={`h-5 w-5 ${isPremium ? 'text-yellow-500' : 'text-muted-foreground'}`} />
            {isPremium ? '프리미엄 구독 중' : '무료 플랜'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPremium ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                프리미엄 멤버십을 이용 중입니다. 모든 기능을 자유롭게 사용하세요!
              </p>
              {status?.expires_at && (
                <p className="text-sm text-muted-foreground">
                  만료일: {new Date(status.expires_at).toLocaleDateString('ko-KR')}
                </p>
              )}
              <Button
                variant="outline"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? '처리 중...' : '구독 취소'}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              프리미엄으로 업그레이드하면 더 많은 기능을 사용할 수 있습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 사용량 현황 (무료 사용자만) */}
      {!isPremium && usageStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">오늘의 사용량</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 일일 대화 횟수 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span>일일 대화</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.min((usageStatus.daily_chat_messages.used / (usageStatus.daily_chat_messages.limit || 5)) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {usageStatus.daily_chat_messages.used}/{usageStatus.daily_chat_messages.limit}회
                </span>
              </div>
            </div>

            {/* 친구 수 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>친구</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.min((usageStatus.friends.count / (usageStatus.friends.limit || 3)) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {usageStatus.friends.count}/{usageStatus.friends.limit}명
                </span>
              </div>
            </div>

            {/* 잠긴 기능 */}
            <div className="mt-4 rounded-lg bg-muted/50 p-3">
              <p className="mb-2 flex items-center gap-1 text-sm font-medium">
                <Lock className="h-4 w-4" />
                프리미엄 전용 기능
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {!usageStatus.features.can_chat_with_friends && (
                  <li>• 친구 페르소나와 대화</li>
                )}
                {!usageStatus.features.advanced_stats && (
                  <li>• 상세 감정 분석 리포트</li>
                )}
                {!usageStatus.features.chemistry_analysis && (
                  <li>• 케미 분석</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 플랜 목록 */}
      {!isPremium && plans && (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={index === 0 ? 'border-primary' : ''}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {plan.name}
                  </span>
                  {index === 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      추천
                    </span>
                  )}
                  {index === 1 && (
                    <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                      32% 할인
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">
                    {plan.price.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    {plan.currency === 'KRW' ? '원' : plan.currency}
                    {plan.period_days === 30 ? '/월' : '/년'}
                  </span>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={index === 0 ? 'default' : 'outline'}
                  onClick={() => upgradeMutation.mutate()}
                  disabled={upgradeMutation.isPending}
                >
                  {upgradeMutation.isPending ? (
                    <>
                      <Loading size="sm" className="mr-2" />
                      처리 중...
                    </>
                  ) : (
                    '업그레이드'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 프리미엄 혜택 설명 */}
      <Card>
        <CardHeader>
          <CardTitle>프리미엄 혜택</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">무제한 페르소나 대화</h4>
              <p className="text-sm text-muted-foreground">
                일일 대화 횟수 제한 없이 페르소나와 자유롭게 대화할 수 있습니다.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">친구 페르소나 대화</h4>
              <p className="text-sm text-muted-foreground">
                친구의 페르소나와 대화할 수 있는 프리미엄 전용 기능입니다.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">상세 감정 분석 리포트</h4>
              <p className="text-sm text-muted-foreground">
                AI가 일기를 분석하여 상세한 감정 변화 리포트를 제공합니다.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">케미 분석</h4>
              <p className="text-sm text-muted-foreground">
                친구와의 케미를 AI가 분석해 재미있는 인사이트를 제공합니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
