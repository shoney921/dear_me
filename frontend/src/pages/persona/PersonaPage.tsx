import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, MessageCircle, RefreshCw, Settings, Palette } from 'lucide-react'
import { toast } from 'sonner'

import { personaService } from '@/services/personaService'
import { chatService } from '@/services/chatService'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { PersonaCardSkeleton } from '@/components/ui/Skeleton'
import { PersonaSettingsModal } from '@/components/persona/PersonaSettingsModal'
import { PersonaCustomizeModal } from '@/components/persona/PersonaCustomizeModal'
import { MIN_DIARIES_FOR_PERSONA } from '@/lib/constants'
import { getApiErrorMessage } from '@/lib/error'

export default function PersonaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              나의 페르소나
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
                  일기를 {MIN_DIARIES_FOR_PERSONA}개 이상 작성하면 나만의 AI 페르소나가 생성됩니다.
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
                <Button onClick={() => navigate('/diaries/new')}>
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {persona?.name}
              {!persona?.is_public && (
                <span className="ml-2 rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  비공개
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
                title="설정"
              >
                <Settings className="h-4 w-4" />
              </Button>
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
            {startChatMutation.isPending ? '채팅방 생성 중...' : '대화 시작하기'}
          </Button>
        </CardContent>
      </Card>

      {/* Modals */}
      {persona && (
        <>
          <PersonaSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            persona={persona}
          />
          <PersonaCustomizeModal
            isOpen={isCustomizeOpen}
            onClose={() => setIsCustomizeOpen(false)}
            persona={persona}
          />
        </>
      )}
    </div>
  )
}
