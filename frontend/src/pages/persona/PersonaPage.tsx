import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, MessageCircle, RefreshCw } from 'lucide-react'

import { personaService } from '@/services/personaService'
import { chatService } from '@/services/chatService'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PageLoading, Loading } from '@/components/ui/Loading'
import { MIN_DIARIES_FOR_PERSONA } from '@/lib/constants'

export default function PersonaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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
      queryClient.invalidateQueries({ queryKey: ['personaStatus'] })
      queryClient.invalidateQueries({ queryKey: ['myPersona'] })
    },
  })

  const regenerateMutation = useMutation({
    mutationFn: personaService.regenerate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPersona'] })
    },
  })

  const startChatMutation = useMutation({
    mutationFn: () => chatService.create(persona!.id),
    onSuccess: (chat) => {
      navigate(`/persona/chat/${chat.id}`)
    },
  })

  if (isLoadingStatus || (status?.has_persona && isLoadingPersona)) {
    return <PageLoading />
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

  // 페르소나가 있는 경우
  const traits = persona?.traits
    ? typeof persona.traits === 'string'
      ? JSON.parse(persona.traits)
      : persona.traits
    : []

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {persona?.name}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
              재생성
            </Button>
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
    </div>
  )
}
