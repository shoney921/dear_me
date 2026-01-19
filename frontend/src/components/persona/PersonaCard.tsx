import { MessageCircle, Settings, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Persona } from '@/types/persona'

interface PersonaCardProps {
  persona: Persona
  onChat?: () => void
  onSettings?: () => void
  onRegenerate?: () => void
  isRegenerating?: boolean
  className?: string
}

export function PersonaCard({
  persona,
  onChat,
  onSettings,
  onRegenerate,
  isRegenerating,
  className,
}: PersonaCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white p-6 shadow-lg border border-gray-100',
        className
      )}
    >
      {/* 프로필 헤더 */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-4xl">
          😊
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {persona.name || '나의 분신'}
        </h2>
      </div>

      {/* 성격 설명 */}
      {persona.personality && (
        <p className="text-gray-600 text-center mb-6 leading-relaxed">
          "{persona.personality}"
        </p>
      )}

      {/* 특성 태그 */}
      {persona.traits && persona.traits.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {persona.traits.map((trait, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
            >
              #{trait}
            </span>
          ))}
        </div>
      )}

      {/* 말투 */}
      {persona.speaking_style && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">말투</h3>
          <p className="text-gray-700 text-sm">{persona.speaking_style}</p>
        </div>
      )}

      {/* 관심사 */}
      {persona.interests && persona.interests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">관심사</h3>
          <div className="flex flex-wrap gap-2">
            {persona.interests.map((interest, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="flex gap-3 mt-6">
        {onChat && (
          <button
            onClick={onChat}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            대화하기
          </button>
        )}

        {onSettings && (
          <button
            onClick={onSettings}
            className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            aria-label="설정"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            aria-label="재생성"
          >
            <RefreshCw
              className={cn(
                'w-5 h-5 text-gray-600',
                isRegenerating && 'animate-spin'
              )}
            />
          </button>
        )}
      </div>

      {/* 공개 상태 */}
      <div className="mt-4 text-center">
        <span
          className={cn(
            'text-xs px-2 py-1 rounded',
            persona.is_public
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-600'
          )}
        >
          {persona.is_public ? '친구에게 공개' : '비공개'}
        </span>
      </div>
    </div>
  )
}

export default PersonaCard
