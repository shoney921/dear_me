import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Eye, EyeOff, Pencil, Check, X } from 'lucide-react'
import { personaService } from '@/services/personaService'
import { PersonaCard } from '@/components/persona/PersonaCard'
import { GenerateProgress } from '@/components/persona/GenerateProgress'
import { cn } from '@/lib/utils'

export function PersonaProfile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editIsPublic, setEditIsPublic] = useState(true)

  // 페르소나 상태 조회
  const { data: status, isLoading: isStatusLoading } = useQuery({
    queryKey: ['personaStatus'],
    queryFn: personaService.getStatus,
  })

  // 페르소나 조회
  const {
    data: persona,
    isLoading: isPersonaLoading,
    error: personaError,
  } = useQuery({
    queryKey: ['persona'],
    queryFn: personaService.getMyPersona,
    enabled: status?.has_persona,
    retry: false,
  })

  // 페르소나 생성
  const generateMutation = useMutation({
    mutationFn: () => personaService.generate({ force_regenerate: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persona'] })
      queryClient.invalidateQueries({ queryKey: ['personaStatus'] })
    },
  })

  // 페르소나 재생성
  const regenerateMutation = useMutation({
    mutationFn: () => personaService.generate({ force_regenerate: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persona'] })
      queryClient.invalidateQueries({ queryKey: ['personaStatus'] })
    },
  })

  // 페르소나 수정
  const updateMutation = useMutation({
    mutationFn: personaService.updateMyPersona,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persona'] })
      setIsEditing(false)
    },
  })

  const handleGenerate = () => {
    generateMutation.mutate()
  }

  const handleRegenerate = () => {
    if (confirm('페르소나를 재생성하시겠습니까? 기존 페르소나 정보가 덮어씌워집니다.')) {
      regenerateMutation.mutate()
    }
  }

  const handleChat = () => {
    if (persona) {
      // 새 대화 시작 또는 대화 목록으로 이동
      navigate('/persona/chat')
    }
  }

  const handleStartEdit = () => {
    if (persona) {
      setEditName(persona.name || '')
      setEditIsPublic(persona.is_public)
      setIsEditing(true)
    }
  }

  const handleSaveEdit = () => {
    updateMutation.mutate({
      name: editName || undefined,
      is_public: editIsPublic,
    })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const isLoading = isStatusLoading || isPersonaLoading
  const isGenerating = generateMutation.isPending || regenerateMutation.isPending

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">내 페르소나</h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* 페르소나가 있는 경우 */}
        {status?.has_persona && persona && !isEditing && (
          <PersonaCard
            persona={persona}
            onChat={handleChat}
            onSettings={handleStartEdit}
            onRegenerate={handleRegenerate}
            isRegenerating={regenerateMutation.isPending}
          />
        )}

        {/* 페르소나 수정 모드 */}
        {status?.has_persona && persona && isEditing && (
          <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              페르소나 설정
            </h2>

            {/* 이름 수정 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                페르소나 이름
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="나의 분신"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* 공개 설정 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                공개 설정
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditIsPublic(true)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors',
                    editIsPublic
                      ? 'bg-purple-50 border-purple-500 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Eye className="w-5 h-5" />
                  친구에게 공개
                </button>
                <button
                  onClick={() => setEditIsPublic(false)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors',
                    !editIsPublic
                      ? 'bg-purple-50 border-purple-500 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <EyeOff className="w-5 h-5" />
                  비공개
                </button>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelEdit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5" />
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                저장
              </button>
            </div>
          </div>
        )}

        {/* 페르소나가 없는 경우 - 생성 진행 UI */}
        {!status?.has_persona && status && (
          <GenerateProgress
            diaryCount={status.diary_count}
            requiredCount={status.required_count}
            canGenerate={status.can_generate}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
          />
        )}

        {/* 에러 메시지 */}
        {(generateMutation.error || regenerateMutation.error) && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl">
            {generateMutation.error?.message ||
              regenerateMutation.error?.message ||
              '오류가 발생했습니다.'}
          </div>
        )}
      </main>
    </div>
  )
}

export default PersonaProfile
