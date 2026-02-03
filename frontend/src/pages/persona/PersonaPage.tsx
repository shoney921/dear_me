import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, MessageCircle, RefreshCw, Palette, Sparkles, TrendingUp, Users, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { personaService } from '@/services/personaService'
import { chatService } from '@/services/chatService'
import { quizService } from '@/services/quizService'
import { friendService } from '@/services/friendService'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { PersonaCardSkeleton } from '@/components/ui/Skeleton'
import { PersonaCustomizeModal } from '@/components/persona/PersonaCustomizeModal'
import { MIN_DIARIES_FOR_PERSONA } from '@/lib/constants'
import { getApiErrorMessage } from '@/lib/error'
import { cn } from '@/lib/utils'

export default function PersonaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)

  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['personaStatus'],
    queryFn: personaService.getStatus,
  })

  const { data: persona, isLoading: isLoadingPersona } = useQuery({
    queryKey: ['myPersona'],
    queryFn: personaService.getMyPersona,
    enabled: status?.has_persona === true,
    retry: false,
  })

  const { data: levelInfo } = useQuery({
    queryKey: ['personaLevel'],
    queryFn: quizService.getPersonaLevel,
    enabled: status?.has_persona === true,
  })

  const { data: friendsWithPersona } = useQuery({
    queryKey: ['friendsWithPersona'],
    queryFn: friendService.getListWithPersona,
    enabled: status?.has_persona === true,
  })

  const { data: recommendations } = useQuery({
    queryKey: ['friendRecommendations'],
    queryFn: friendService.getRecommendations,
    enabled: status?.has_persona === true && friendsWithPersona?.length === 0,
  })

  const generateMutation = useMutation({
    mutationFn: personaService.generate,
    onSuccess: () => {
      toast.success('페르소나가 생성되었습니다!')
      queryClient.invalidateQueries({ queryKey: ['personaStatus'] })
      queryClient.invalidateQueries({ queryKey: ['myPersona'] })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const regenerateMutation = useMutation({
    mutationFn: personaService.regenerate,
    onSuccess: () => {
      toast.success('페르소나가 재생성되었습니다!')
      queryClient.invalidateQueries({ queryKey: ['myPersona'] })
      queryClient.invalidateQueries({ queryKey: ['personaLevel'] })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const upgradeMutation = useMutation({
    mutationFn: quizService.upgradePersona,
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['myPersona'] })
      queryClient.invalidateQueries({ queryKey: ['personaLevel'] })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const startChatMutation = useMutation({
    mutationFn: () => {
      if (!persona) {
        throw new Error('페르소나가 없습니다.')
      }
      return chatService.create(persona.id)
    },
    onSuccess: (chat) => {
      navigate(`/persona/chat/${chat.id}`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const startFriendChatMutation = useMutation({
    mutationFn: (personaId: number) => chatService.create(personaId),
    onSuccess: (chat) => {
      navigate(`/persona/chat/${chat.id}`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const sendFriendRequestMutation = useMutation({
    mutationFn: (addresseeId: number) => friendService.sendRequest(addresseeId),
    onSuccess: () => {
      toast.success('친구 요청을 보냈습니다!')
      queryClient.invalidateQueries({ queryKey: ['friendRecommendations'] })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  if (isLoadingStatus || (status?.has_persona && isLoadingPersona)) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PersonaCardSkeleton />
      </div>
    )
  }

  // 페르소나가 없는 경우
  if (!status?.has_persona) {
    const progress = ((status?.diary_count || 0) / MIN_DIARIES_FOR_PERSONA) * 100

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Quiz CTA Card */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">성격 퀴즈로 바로 시작하기</h2>
            <p className="text-muted-foreground mb-4 max-w-sm">
              간단한 5가지 질문에 답하면 임시 페르소나가 바로 생성돼요!
              <br />
              일기를 쓰면 더 나다운 페르소나로 진화해요.
            </p>
            <Link to="/quiz">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Sparkles className="mr-2 h-4 w-4" />
                퀴즈 시작하기
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Traditional persona generation card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              일기 기반 페르소나
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {status?.can_generate ? (
              <>
                <p className="text-muted-foreground">
                  일기를 충분히 작성하셨네요! 이제 나만의 AI 페르소나를 생성할 수 있습니다.
                </p>
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loading size="sm" className="mr-2" />
                      페르소나 생성 중...
                    </>
                  ) : (
                    '페르소나 생성하기'
                  )}
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  또는 일기를 {MIN_DIARIES_FOR_PERSONA}개 이상 작성하면 더 정교한 AI 페르소나가 생성됩니다.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>진행률</span>
                    <span>
                      {status?.diary_count || 0} / {MIN_DIARIES_FOR_PERSONA}개
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <Button variant="outline" onClick={() => navigate('/diaries/new')}>
                  일기 쓰러 가기
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // 페르소나가 있는 경우 - JSON.parse 안전하게 처리
  let traits: string[] = []
  if (persona?.traits) {
    if (typeof persona.traits === 'string') {
      try {
        traits = JSON.parse(persona.traits)
      } catch {
        traits = []
      }
    } else if (Array.isArray(persona.traits)) {
      traits = persona.traits
    }
  }

  // 레벨 배지 색상
  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'temporary':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'basic':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'complete':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Level Progress Card (if not complete) */}
      {levelInfo && levelInfo.current_level !== 'complete' && levelInfo.next_level && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="font-medium">페르소나 진화</span>
              </div>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getLevelBadgeColor(levelInfo.current_level || ''))}>
                {levelInfo.level_name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {levelInfo.diaries_needed && levelInfo.diaries_needed > 0 ? (
                <>일기를 <strong>{levelInfo.diaries_needed}개</strong> 더 작성하면 '{levelInfo.next_level_name}'(으)로 진화해요!</>
              ) : (
                <>페르소나를 '{levelInfo.next_level_name}'(으)로 진화시킬 수 있어요!</>
              )}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{levelInfo.level_name}</span>
                <span>{levelInfo.next_level_name}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                  style={{ width: `${levelInfo.progress_percent}%` }}
                />
              </div>
            </div>
            {levelInfo.diaries_needed === 0 && (
              <Button
                className="w-full mt-4"
                onClick={() => upgradeMutation.mutate()}
                disabled={upgradeMutation.isPending}
              >
                {upgradeMutation.isPending ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    진화 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    페르소나 진화하기
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {persona?.name}
              {/* Level Badge */}
              <span className={cn('ml-1 rounded-full px-2 py-0.5 text-xs font-medium', getLevelBadgeColor(persona?.level || 'complete'))}>
                {levelInfo?.level_name || '완전한 페르소나'}
              </span>
              {!persona?.is_public && (
                <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  비공개
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCustomizeOpen(true)}
                title="커스터마이징"
              >
                <Palette className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending}
                title="재생성"
              >
                <RefreshCw className={`h-4 w-4 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personality */}
          <div>
            <h3 className="mb-2 font-semibold">성격</h3>
            <p className="text-muted-foreground">{persona?.personality}</p>
          </div>

          {/* Traits */}
          {traits.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">특성</h3>
              <div className="flex flex-wrap gap-2">
                {traits.map((trait: string, index: number) => (
                  <span
                    key={index}
                    className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Speaking Style */}
          {persona?.speaking_style && (
            <div>
              <h3 className="mb-2 font-semibold">말투</h3>
              <p className="text-muted-foreground">{persona.speaking_style}</p>
            </div>
          )}

          {/* Customization Info */}
          {persona?.customization && (
            <div className="rounded-lg bg-secondary/50 p-4">
              <h3 className="mb-3 font-semibold">커스터마이징 설정</h3>
              <div className="space-y-2 text-sm">
                {persona.customization.speaking_style_tone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">말투 스타일</span>
                    <span>
                      {persona.customization.speaking_style_tone === 'formal' && '정중한'}
                      {persona.customization.speaking_style_tone === 'casual' && '친근한'}
                      {persona.customization.speaking_style_tone === 'cute' && '귀여운'}
                    </span>
                  </div>
                )}
                {persona.customization.speaking_style_emoji !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">이모지 사용</span>
                    <span>{persona.customization.speaking_style_emoji ? '사용' : '미사용'}</span>
                  </div>
                )}
                {persona.customization.custom_greeting && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">인사말</span>
                    <span className="max-w-[200px] truncate">
                      {persona.customization.custom_greeting}
                    </span>
                  </div>
                )}
                {persona.customization.personality_traits_override &&
                  persona.customization.personality_traits_override.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">커스텀 특성</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {persona.customization.personality_traits_override.map((trait, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Chat Button */}
          <Button
            className="w-full"
            onClick={() => startChatMutation.mutate()}
            disabled={startChatMutation.isPending}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {startChatMutation.isPending ? '채팅방 생성 중...' : '나의 페르소나와 대화하기'}
          </Button>
        </CardContent>
      </Card>

      {/* Friend Persona Chat Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            친구의 페르소나와 대화해 보세요
          </CardTitle>
        </CardHeader>
        <CardContent>
          {friendsWithPersona && friendsWithPersona.length > 0 ? (
            <div className="space-y-3">
              {friendsWithPersona.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{friend.username}</p>
                      {friend.persona_name ? (
                        <p className="text-sm text-muted-foreground">
                          {friend.persona_name}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          페르소나 없음
                        </p>
                      )}
                    </div>
                  </div>
                  {friend.persona_id && (
                    <Button
                      size="sm"
                      onClick={() => startFriendChatMutation.mutate(friend.persona_id!)}
                      disabled={startFriendChatMutation.isPending}
                    >
                      <MessageCircle className="mr-1 h-4 w-4" />
                      대화
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : recommendations && recommendations.users.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                아직 친구가 없네요. 이런 사람들은 어때요?
              </p>
              <div className="space-y-3">
                {recommendations.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.persona_name}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendFriendRequestMutation.mutate(user.id)}
                      disabled={sendFriendRequestMutation.isPending}
                    >
                      <UserPlus className="mr-1 h-4 w-4" />
                      친구 요청
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              아직 친구가 없어요. 친구를 추가해 보세요!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {persona && (
        <PersonaCustomizeModal
          isOpen={isCustomizeOpen}
          onClose={() => setIsCustomizeOpen(false)}
          persona={persona}
        />
      )}
    </div>
  )
}
