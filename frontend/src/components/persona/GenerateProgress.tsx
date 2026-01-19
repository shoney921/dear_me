import { Loader2, Sparkles, BookOpen, Brain, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GenerateProgressProps {
  diaryCount: number
  requiredCount: number
  canGenerate: boolean
  isGenerating?: boolean
  onGenerate?: () => void
  className?: string
}

export function GenerateProgress({
  diaryCount,
  requiredCount,
  canGenerate,
  isGenerating,
  onGenerate,
  className,
}: GenerateProgressProps) {
  const progress = Math.min((diaryCount / requiredCount) * 100, 100)
  const remaining = Math.max(requiredCount - diaryCount, 0)

  return (
    <div
      className={cn(
        'rounded-2xl bg-white p-6 shadow-lg border border-gray-100',
        className
      )}
    >
      {/* 아이콘 */}
      <div className="text-center mb-6">
        <div
          className={cn(
            'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center',
            canGenerate
              ? 'bg-gradient-to-br from-purple-400 to-pink-400'
              : 'bg-gray-200'
          )}
        >
          {isGenerating ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : canGenerate ? (
            <Sparkles className="w-10 h-10 text-white" />
          ) : (
            <Brain className="w-10 h-10 text-gray-400" />
          )}
        </div>

        <h2 className="text-xl font-bold text-gray-900">
          {isGenerating
            ? '페르소나 생성 중...'
            : canGenerate
              ? '페르소나를 만들 수 있어요!'
              : '내 페르소나'}
        </h2>
      </div>

      {/* 진행 상황 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>일기 작성 현황</span>
          <span>
            {diaryCount}/{requiredCount}개
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              canGenerate
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-gray-400'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 안내 메시지 */}
      {!canGenerate && !isGenerating && (
        <div className="bg-purple-50 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-purple-900 font-medium">
                일기를 {remaining}개 더 작성해주세요!
              </p>
              <p className="text-purple-700 text-sm mt-1">
                일기가 {requiredCount}개 이상 쌓이면 AI가 분석하여 나만의
                페르소나를 만들어줍니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="bg-purple-50 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-purple-600 mt-0.5 animate-pulse" />
            <div>
              <p className="text-purple-900 font-medium">
                AI가 일기를 분석하고 있어요
              </p>
              <p className="text-purple-700 text-sm mt-1">
                작성하신 일기를 바탕으로 성격, 특성, 말투를 파악하고 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 생성 버튼 */}
      {canGenerate && !isGenerating && onGenerate && (
        <button
          onClick={onGenerate}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Sparkles className="w-5 h-5" />
          내 페르소나 만들기
        </button>
      )}

      {/* 생성 불가 상태 버튼 */}
      {!canGenerate && !isGenerating && (
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gray-200 text-gray-500 rounded-xl font-medium cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
          일기를 더 작성해주세요
        </button>
      )}

      {/* 생성 중 버튼 */}
      {isGenerating && (
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-purple-400 text-white rounded-xl font-medium cursor-not-allowed"
        >
          <Loader2 className="w-5 h-5 animate-spin" />
          생성 중...
        </button>
      )}
    </div>
  )
}

export default GenerateProgress
