import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Crown, Check, Sparkles } from 'lucide-react'

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

  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: subscriptionService.getPlans,
  })

  const upgradeMutation = useMutation({
    mutationFn: subscriptionService.upgrade,
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] })
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
      queryClient.invalidateQueries({ queryKey: ['mySubscription'] })
    },
    onError: (err) => {
      setError(getApiErrorMessage(err))
    },
  })

  if (isLoadingStatus || isLoadingPlans) {
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
              <h4 className="font-semibold">캐릭터 스타일 변경</h4>
              <p className="text-sm text-muted-foreground">
                수채화, 픽셀 아트, 3D 등 다양한 스타일로 캐릭터를 변경할 수 있습니다.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">친구 캐릭터 무제한 열람</h4>
              <p className="text-sm text-muted-foreground">
                친구들의 캐릭터를 제한 없이 열람할 수 있습니다.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">케미 분석</h4>
              <p className="text-sm text-muted-foreground">
                AI가 친구와의 케미를 분석해드립니다.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">시즌 스킨 선행 접근</h4>
              <p className="text-sm text-muted-foreground">
                새로운 시즌 스킨을 먼저 만나보세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
