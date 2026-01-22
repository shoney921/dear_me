import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, RefreshCw, Lock, History, User } from 'lucide-react'

import { characterService } from '@/services/characterService'
import { subscriptionService } from '@/services/subscriptionService'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PageLoading, Loading } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { getApiErrorMessage } from '@/lib/error'
import type { CharacterStyle, CharacterStyleOption } from '@/types/character'

// 상수
const MIN_DIARIES_FOR_CHARACTER = 7

// 스타일 이름 매핑
const STYLE_NAMES: Record<CharacterStyle, string> = {
  watercolor: '수채화',
  anime: '애니메이션',
  pixel: '픽셀 아트',
  '3d': '3D',
  realistic: '실사',
  cartoon: '카툰',
}

function getStyleName(style: CharacterStyle): string {
  return STYLE_NAMES[style] || style
}

export default function CharacterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // State
  const [error, setError] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<CharacterStyle>('anime')
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  // Queries
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

  // Mutations
  const generateMutation = useMutation({
    mutationFn: () => characterService.generate({ style: selectedStyle }),
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['characterStatus'] })
      queryClient.invalidateQueries({ queryKey: ['myCharacter'] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const changeStyleMutation = useMutation({
    mutationFn: (style: CharacterStyle) => characterService.changeStyle({ style }),
    onSuccess: () => {
      setError('')
      setIsStyleModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['myCharacter'] })
      queryClient.invalidateQueries({ queryKey: ['myCharacterHistory'] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const evolveMutation = useMutation({
    mutationFn: characterService.evolve,
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['myCharacter'] })
      queryClient.invalidateQueries({ queryKey: ['myCharacterHistory'] })
      queryClient.invalidateQueries({ queryKey: ['characterStatus'] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  // Loading
  if (isLoadingStatus || (status?.has_character && isLoadingCharacter)) {
    return <PageLoading />
  }

  const isPremium = subscriptionStatus?.is_premium
  const diaryCount = status?.diary_count || 0
  const hasEnoughDiaries = diaryCount >= MIN_DIARIES_FOR_CHARACTER
  const hasPersona = status?.has_persona ?? false

  // 캐릭터가 없는 경우
  if (!status?.has_character) {
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
            {/* 페르소나가 없는 경우 */}
            {!hasPersona && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">
                      먼저 페르소나를 생성해주세요
                    </p>
                    <p className="mt-1 text-sm text-amber-700">
                      캐릭터는 페르소나 정보를 기반으로 생성됩니다.
                      {!hasEnoughDiaries && ` 일기 ${MIN_DIARIES_FOR_CHARACTER}개 이상 작성 후 페르소나를 생성할 수 있습니다.`}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => navigate('/persona')}
                    >
                      페르소나 페이지로 이동
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 캐릭터 생성 가능한 경우 */}
            {status?.can_generate && (
              <>
                <p className="text-muted-foreground">
                  페르소나와 일기를 기반으로 나만의 AI 캐릭터를 생성합니다.
                </p>

                <StyleSelector
                  styles={styles || []}
                  selectedStyle={selectedStyle}
                  onSelectStyle={setSelectedStyle}
                  isPremium={isPremium}
                />

                <ErrorMessage message={error} />

                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="w-full"
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
            )}

            {/* 일기가 부족한 경우 */}
            {!status?.can_generate && hasPersona && (
              <DiaryProgress current={diaryCount} required={MIN_DIARIES_FOR_CHARACTER} />
            )}

            {/* 페르소나도 없고 일기도 부족한 경우 */}
            {!hasPersona && !hasEnoughDiaries && (
              <DiaryProgress current={diaryCount} required={MIN_DIARIES_FOR_CHARACTER} />
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
                title="진화 히스토리"
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
          <ErrorMessage message={error} />

          <CharacterImage
            imageUrl={character?.image_url}
            name={character?.name}
            style={character?.style || 'anime'}
          />

          <p className="text-center text-sm text-muted-foreground">
            {character?.generation_count}세대 캐릭터
          </p>

          <EvolutionSection
            canEvolve={status?.can_evolve || false}
            nextEvolutionAt={status?.next_evolution_at}
            isEvolving={evolveMutation.isPending}
            onEvolve={() => evolveMutation.mutate()}
          />

          {!isPremium && (
            <div className="rounded-lg bg-secondary/50 p-3 text-center text-sm">
              <span className="text-muted-foreground">
                프리미엄 구독 시 다양한 스타일로 변경할 수 있습니다.{' '}
              </span>
              <button
                type="button"
                className="text-primary underline hover:text-primary/80"
                onClick={() => navigate('/premium')}
              >
                프리미엄 알아보기
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 스타일 변경 모달 */}
      <StyleChangeModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        styles={styles || []}
        currentStyle={character?.style || 'anime'}
        isChanging={changeStyleMutation.isPending}
        onChangeStyle={(style) => changeStyleMutation.mutate(style)}
      />

      {/* 히스토리 모달 */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={characterHistory?.history || []}
      />
    </div>
  )
}

// 서브 컴포넌트들

function ErrorMessage({ message }: { message: string }) {
  if (!message) return null
  return (
    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
      {message}
    </div>
  )
}

function DiaryProgress({ current, required }: { current: number; required: number }) {
  const progress = Math.min((current / required) * 100, 100)

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground">
        일기를 {required}개 이상 작성하면 캐릭터를 생성할 수 있습니다.
      </p>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>진행률</span>
          <span>{current} / {required}개</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function StyleSelector({
  styles,
  selectedStyle,
  onSelectStyle,
  isPremium,
}: {
  styles: CharacterStyleOption[]
  selectedStyle: CharacterStyle
  onSelectStyle: (style: CharacterStyle) => void
  isPremium?: boolean
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">캐릭터 스타일</label>
      <div className="grid grid-cols-3 gap-2">
        {styles.map((style) => (
          <button
            key={style.value}
            type="button"
            onClick={() => style.available && onSelectStyle(style.value)}
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
  )
}

function CharacterImage({
  imageUrl,
  name,
  style,
}: {
  imageUrl?: string
  name?: string
  style: CharacterStyle
}) {
  return (
    <div className="flex justify-center">
      <div className="relative">
        <img
          src={imageUrl || 'https://placehold.co/256x256/6366f1/white?text=?'}
          alt={name || '캐릭터'}
          className="h-64 w-64 rounded-lg object-cover shadow-lg"
        />
        <span className="absolute bottom-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-xs">
          {getStyleName(style)}
        </span>
      </div>
    </div>
  )
}

function EvolutionSection({
  canEvolve,
  nextEvolutionAt,
  isEvolving,
  onEvolve,
}: {
  canEvolve: boolean
  nextEvolutionAt?: number
  isEvolving: boolean
  onEvolve: () => void
}) {
  if (canEvolve) {
    return (
      <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
        <p className="mb-3 text-center text-sm">
          캐릭터 진화가 가능합니다! 일기가 쌓이면서 캐릭터도 함께 성장합니다.
        </p>
        <Button className="w-full" onClick={onEvolve} disabled={isEvolving}>
          {isEvolving ? (
            <>
              <Loading size="sm" className="mr-2" />
              진화 중...
            </>
          ) : (
            '캐릭터 진화하기'
          )}
        </Button>
      </div>
    )
  }

  if (nextEvolutionAt && nextEvolutionAt > 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        다음 진화까지 일기 {nextEvolutionAt}개 더 필요합니다.
      </p>
    )
  }

  return null
}

function StyleChangeModal({
  isOpen,
  onClose,
  styles,
  currentStyle,
  isChanging,
  onChangeStyle,
}: {
  isOpen: boolean
  onClose: () => void
  styles: CharacterStyleOption[]
  currentStyle: CharacterStyle
  isChanging: boolean
  onChangeStyle: (style: CharacterStyle) => void
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="캐릭터 스타일 변경">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          변경할 스타일을 선택하세요. 캐릭터가 새롭게 생성됩니다.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {styles.map((style) => (
            <button
              key={style.value}
              type="button"
              onClick={() => onChangeStyle(style.value)}
              disabled={isChanging || style.value === currentStyle}
              className={`rounded-lg border p-3 text-center text-sm transition-colors ${
                style.value === currentStyle
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              } ${isChanging ? 'opacity-50' : ''}`}
            >
              {style.name}
              {style.value === currentStyle && ' (현재)'}
            </button>
          ))}
        </div>
        {isChanging && (
          <div className="flex items-center justify-center gap-2">
            <Loading size="sm" />
            <span className="text-sm">스타일 변경 중...</span>
          </div>
        )}
      </div>
    </Modal>
  )
}

function HistoryModal({
  isOpen,
  onClose,
  history,
}: {
  isOpen: boolean
  onClose: () => void
  history: Array<{
    id: number
    image_url: string
    style: CharacterStyle
    diary_count_at_generation?: number
    created_at: string
  }>
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="캐릭터 진화 히스토리" className="max-w-lg">
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {history.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            진화 히스토리가 없습니다.
          </p>
        ) : (
          history.map((item, index) => (
            <div key={item.id} className="flex items-center gap-4 rounded-lg border p-3">
              <img
                src={item.image_url}
                alt={`${index + 1}세대 캐릭터`}
                className="h-16 w-16 rounded object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {index + 1}세대 - {getStyleName(item.style)}
                </p>
                {item.diary_count_at_generation && (
                  <p className="text-xs text-muted-foreground">
                    일기 {item.diary_count_at_generation}개 시점
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  )
}
