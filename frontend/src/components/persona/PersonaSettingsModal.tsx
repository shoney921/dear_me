import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { personaService } from '@/services/personaService'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Loading } from '@/components/ui/Loading'
import { getApiErrorMessage } from '@/lib/error'
import type { Persona, PersonaUpdateRequest } from '@/types/persona'

interface PersonaSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  persona: Persona
}

export function PersonaSettingsModal({
  isOpen,
  onClose,
  persona,
}: PersonaSettingsModalProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(persona.name)
  const [isPublic, setIsPublic] = useState(persona.is_public)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setName(persona.name)
      setIsPublic(persona.is_public)
      setError('')
    }
  }, [isOpen, persona])

  const updateMutation = useMutation({
    mutationFn: (data: PersonaUpdateRequest) => personaService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPersona'] })
      onClose()
    },
    onError: (err) => {
      setError(getApiErrorMessage(err))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updates: PersonaUpdateRequest = {}
    if (name !== persona.name) {
      updates.name = name
    }
    if (isPublic !== persona.is_public) {
      updates.is_public = isPublic
    }

    if (Object.keys(updates).length === 0) {
      onClose()
      return
    }

    updateMutation.mutate(updates)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="페르소나 설정">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            페르소나 이름
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="페르소나 이름을 입력하세요"
            maxLength={100}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label htmlFor="is-public" className="text-sm font-medium">
              친구에게 공개
            </label>
            <p className="text-xs text-muted-foreground">
              비공개 시 친구가 내 페르소나와 대화할 수 없습니다
            </p>
          </div>
          <Switch
            id="is-public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
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
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
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
