import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, RefreshCw, Lock, History } from 'lucide-react'

import { characterService } from '@/services/characterService'
import { subscriptionService } from '@/services/subscriptionService'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PageLoading, Loading } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { getApiErrorMessage } from '@/lib/error'
import type { CharacterStyle, CharacterStyleOption } from '@/types/character'

const MIN_DIARIES_FOR_CHARACTER = 7

export default function CharacterPage() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<CharacterStyle>('anime')
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['characterStatus'],
    queryFn: characterService.getStatus,
  })

  const { data: character, isLoading: isLoadingCharacter } = useQuery({
    queryKey: ['myCharacter'],
    queryFn: characterService.getMyCharacter,
    enabled: status?.has_character === true,
    retry: false,
  })

  const { data: characterHistory } = useQuery({
    queryKey: ['myCharacterHistory'],
    queryFn: characterService.getMyCharacterWithHistory,
    enabled: status?.has_character === true,
  })

  const { data: styles } = useQuery({
    queryKey: ['characterStyles'],
    queryFn: characterService.getStyles,
  })

  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: subscriptionService.getStatus,
  })

  const generateMutation = useMutation({
    mutationFn: () => characterService.generate({ style: selectedStyle }),
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['characterStatus'] })
      queryClient.invalidateQueries({ queryKey: ['myCharacter'] })
    },
    onError: (err) => {
      setError(getApiErrorMessage(err))
    },
  })

  const changeStyleMutation = useMutation({
    mutationFn: (style: CharacterStyle) => characterService.changeStyle({ style }),
    onSuccess: () => {
      setError('')
      setIsStyleModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['myCharacter'] })
      queryClient.invalidateQueries({ queryKey: ['myCharacterHistory'] })
    },
    onError: (err) => {
      setError(getApiErrorMessage(err))
    },
  })

  const evolveMutation = useMutation({
    mutationFn: characterService.evolve,
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['myCharacter'] })
      queryClient.invalidateQueries({ queryKey: ['myCharacterHistory'] })
      queryClient.invalidateQueries({ queryKey: ['characterStatus'] })
    },
    onError: (err) => {
      setError(getApiErrorMessage(err))
    },
  })

  if (isLoadingStatus || (status?.has_character && isLoadingCharacter)) {
    return <PageLoading />
  }

  const isPremium = subscriptionStatus?.is_premium

  // 캐릭터가 없는 경우
  if (!status?.has_character) {
    const progress = ((status?.diary_count || 0) / MIN_DIARIES_FOR_CHARACTER) * 100

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              나의 캐릭터
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {status?.can_generate ? (
              <>
                <p className="text-muted-foreground">
                  일기를 충분히 작성하셨네요! 이제 나만의 AI 캐릭터를 생성할 수 있습니다.
                </p>

                {/* 스타일 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">캐릭터 스타일</label>
                  <div className="grid grid-cols-3 gap-2">
                    {styles?.map((style: CharacterStyleOption) => (
                      <button
                        key={style.value}
                        onClick={() => style.available && setSelectedStyle(style.value)}
                        disabled={!style.available}
                        className={`relative rounded-lg border p-3 text-center text-sm transition-colors ${
                          selectedStyle === style.value
                            ? 'border-primary bg-primary/10'
                            : style.available
                              ? 'border-border hover:border-primary/50'
                              : 'cursor-not-allowed border-border bg-muted opacity-50'
                        }`}
                      >
                        {style.name}
                        {style.is_premium && !isPremium && (
                          <Lock className="absolute right-1 top-1 h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loading size="sm" className="mr-2" />
                      캐릭터 생성 중...
                    </>
                  ) : (
                    '캐릭터 생성하기'
                  )}
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  일기를 {MIN_DIARIES_FOR_CHARACTER}개 이상 작성하면 나만의 AI 캐릭터가 생성됩니다.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>진행률</span>
                    <span>
                      {status?.diary_count || 0} / {MIN_DIARIES_FOR_CHARACTER}개
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // 캐릭터가 있는 경우
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {character?.name}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryModalOpen(true)}
                title="히스토리"
              >
                <History className="h-4 w-4" />
              </Button>
              {isPremium && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsStyleModalOpen(true)}
                  title="스타일 변경"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* 캐릭터 이미지 */}
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={character?.image_url}
                alt={character?.name}
                className="h-64 w-64 rounded-lg object-cover shadow-lg"
              />
              <span className="absolute bottom-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-xs">
                {getStyleName(character?.style || 'anime')}
              </span>
            </div>
          </div>

          {/* 캐릭터 정보 */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              생성 횟수: {character?.generation_count}회
            </p>
          </div>

          {/* 진화 버튼 */}
          {status?.can_evolve && (
            <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
              <p className="mb-3 text-center text-sm">
                캐릭터 진화가 가능합니다! 일기가 쌓이면서 캐릭터가 성장합니다.
              </p>
              <Button
                className="w-full"
                onClick={() => evolveMutation.mutate()}
                disabled={evolveMutation.isPending}
              >
                {evolveMutation.isPending ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    진화 중...
                  </>
                ) : (
                  '캐릭터 진화하기'
                )}
              </Button>
            </div>
          )}

          {status?.next_evolution_at && !status?.can_evolve && (
            <p className="text-center text-sm text-muted-foreground">
              다음 진화까지 일기 {status.next_evolution_at}개 더 필요합니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 스타일 변경 모달 */}
      <Modal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        title="캐릭터 스타일 변경"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {styles?.map((style: CharacterStyleOption) => (
              <button
                key={style.value}
                onClick={() => changeStyleMutation.mutate(style.value)}
                disabled={changeStyleMutation.isPending || style.value === character?.style}
                className={`rounded-lg border p-3 text-center text-sm transition-colors ${
                  style.value === character?.style
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {style.name}
                {style.value === character?.style && ' (현재)'}
              </button>
            ))}
          </div>
          {changeStyleMutation.isPending && (
            <div className="flex items-center justify-center gap-2">
              <Loading size="sm" />
              <span className="text-sm">스타일 변경 중...</span>
            </div>
          )}
        </div>
      </Modal>

      {/* 히스토리 모달 */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="캐릭터 히스토리"
        className="max-w-lg"
      >
        <div className="max-h-96 space-y-4 overflow-y-auto">
          {characterHistory?.history?.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-lg border p-3">
              <img
                src={item.image_url}
                alt="Character"
                className="h-16 w-16 rounded object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{getStyleName(item.style)}</p>
                <p className="text-xs text-muted-foreground">
                  일기 {item.diary_count_at_generation}개 시점
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          ))}
          {(!characterHistory?.history || characterHistory.history.length === 0) && (
            <p className="text-center text-sm text-muted-foreground">
              히스토리가 없습니다.
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}

function getStyleName(style: CharacterStyle): string {
  const names: Record<CharacterStyle, string> = {
    watercolor: '수채화',
    anime: '애니메이션',
    pixel: '픽셀 아트',
    '3d': '3D',
    realistic: '실사',
    cartoon: '카툰',
  }
  return names[style] || style
}
