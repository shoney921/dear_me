import { cn, formatRelativeTime } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '@/types/chat'

interface ChatMessageProps {
  message: ChatMessageType
  isStreaming?: boolean
  className?: string
}

export function ChatMessage({
  message,
  isStreaming,
  className,
}: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {/* 아바타 */}
      <div
        className={cn(
          'w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm',
          isUser
            ? 'bg-purple-100 text-purple-600'
            : 'bg-gradient-to-br from-purple-400 to-pink-400 text-white'
        )}
      >
        {isUser ? '나' : '😊'}
      </div>

      {/* 메시지 내용 */}
      <div
        className={cn(
          'max-w-[75%] flex flex-col',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'px-4 py-3 rounded-2xl',
            isUser
              ? 'bg-purple-600 text-white rounded-br-sm'
              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
          )}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse" />
            )}
          </p>
        </div>

        {/* 시간 */}
        <span className="text-xs text-gray-400 mt-1 px-1">
          {formatRelativeTime(message.created_at)}
        </span>
      </div>
    </div>
  )
}

// 스트리밍 중인 메시지 표시용
interface StreamingMessageProps {
  content: string
  className?: string
}

export function StreamingMessage({ content, className }: StreamingMessageProps) {
  return (
    <div className={cn('flex gap-3', className)}>
      {/* 아바타 */}
      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm bg-gradient-to-br from-purple-400 to-pink-400 text-white">
        😊
      </div>

      {/* 메시지 내용 */}
      <div className="max-w-[75%] flex flex-col items-start">
        <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-900 rounded-bl-sm">
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {content}
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-gray-400 animate-pulse" />
          </p>
        </div>
      </div>
    </div>
  )
}

// 로딩 표시
export function ChatMessageLoading({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-3', className)}>
      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm bg-gradient-to-br from-purple-400 to-pink-400 text-white">
        😊
      </div>

      <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200 rounded-bl-sm">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
          <div
            className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
            style={{ animationDelay: '0.1s' }}
          />
          <div
            className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
            style={{ animationDelay: '0.2s' }}
          />
        </div>
      </div>
    </div>
  )
}

export default ChatMessage
