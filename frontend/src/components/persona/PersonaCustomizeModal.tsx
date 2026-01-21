import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'

import { personaService } from '@/services/personaService'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Loading } from '@/components/ui/Loading'
import { getApiErrorMessage } from '@/lib/error'
import type { Persona, PersonaCustomizeRequest, PersonaCustomization } from '@/types/persona'

interface PersonaCustomizeModalProps {
  isOpen: boolean
  onClose: () => void
  persona: Persona
}

type ToneOption = 'formal' | 'casual' | 'cute'

const TONE_OPTIONS: { value: ToneOption; label: string; description: string }[] = [
  { value: 'formal', label: '정중한', description: '존댓말을 사용하는 차분한 말투' },
  { value: 'casual', label: '친근한', description: '반말을 사용하는 편안한 말투' },
  { value: 'cute', label: '귀여운', description: '애교 있고 귀여운 말투' },
]

const TRAIT_OPTIONS = [
  '외향적', '내향적', '감성적', '이성적', '유머러스', '진지함',
  '따뜻함', '차가움', '낙관적', '현실적', '모험적', '신중함',
]

export function PersonaCustomizeModal({
  isOpen,
  onClose,
  persona,
}: PersonaCustomizeModalProps) {
  const queryClient = useQueryClient()
  const customization = persona.customization

  const [tone, setTone] = useState<ToneOption | undefined>(customization?.speaking_style_tone)
  const [useEmoji, setUseEmoji] = useState(customization?.speaking_style_emoji ?? false)
  const [selectedTraits, setSelectedTraits] = useState<string[]>(
    customization?.personality_traits_override ?? []
  )
  const [greeting, setGreeting] = useState(customization?.custom_greeting ?? '')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setTone(customization?.speaking_style_tone)
      setUseEmoji(customization?.speaking_style_emoji ?? false)
      setSelectedTraits(customization?.personality_traits_override ?? [])
      setGreeting(customization?.custom_greeting ?? '')
      setError('')
    }
  }, [isOpen, customization])

  const customizeMutation = useMutation({
    mutationFn: (data: PersonaCustomizeRequest) => personaService.customize(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPersona'] })
      onClose()
    },
    onError: (err) => {
      setError(getApiErrorMessage(err))
    },
  })

  const handleTraitToggle = (trait: string) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(selectedTraits.filter((t) => t !== trait))
    } else if (selectedTraits.length < 10) {
      setSelectedTraits([...selectedTraits, trait])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updates: PersonaCustomizeRequest = {}

    if (tone !== customization?.speaking_style_tone) {
      updates.speaking_style_tone = tone
    }
    if (useEmoji !== customization?.speaking_style_emoji) {
      updates.speaking_style_emoji = useEmoji
    }
    if (
      JSON.stringify(selectedTraits) !==
      JSON.stringify(customization?.personality_traits_override ?? [])
    ) {
      updates.personality_traits_override = selectedTraits.length > 0 ? selectedTraits : undefined
    }
    if (greeting !== (customization?.custom_greeting ?? '')) {
      updates.custom_greeting = greeting || undefined
    }

    if (Object.keys(updates).length === 0) {
      onClose()
      return
    }

    customizeMutation.mutate(updates)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="페르소나 커스터마이징"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 말투 톤 선택 */}
        <div className="space-y-3">
          <label className="text-sm font-medium">말투 스타일</label>
          <div className="grid grid-cols-3 gap-2">
            {TONE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTone(option.value)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  tone === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 이모지 사용 */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">이모지 사용</label>
            <p className="text-xs text-muted-foreground">
              대화 시 이모지를 활용합니다
            </p>
          </div>
          <Switch checked={useEmoji} onCheckedChange={setUseEmoji} />
        </div>

        {/* 성격 특성 선택 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">성격 특성 (최대 10개)</label>
            <span className="text-xs text-muted-foreground">
              {selectedTraits.length}/10
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRAIT_OPTIONS.map((trait) => (
              <button
                key={trait}
                type="button"
                onClick={() => handleTraitToggle(trait)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  selectedTraits.includes(trait)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {trait}
                {selectedTraits.includes(trait) && (
                  <X className="ml-1 inline h-3 w-3" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 커스텀 인사말 */}
        <div className="space-y-2">
          <label htmlFor="greeting" className="text-sm font-medium">
            커스텀 인사말
          </label>
          <Input
            id="greeting"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            placeholder="안녕! 오늘도 좋은 하루야~"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            대화 시작 시 페르소나가 사용할 인사말입니다
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={customizeMutation.isPending}
          >
            {customizeMutation.isPending ? (
              <>
                <Loading size="sm" className="mr-2" />
                저장 중...
              </>
            ) : (
              '저장'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
