import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = '메시지를 입력하세요...',
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 텍스트에어리어 높이 자동 조절
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault()

    const trimmedMessage = message.trim()
    if (!trimmedMessage || disabled) return

    onSend(trimmedMessage)
    setMessage('')

    // 높이 리셋
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter로 전송 (Shift+Enter는 줄바꿈)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const canSend = message.trim().length > 0 && !disabled

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex items-end gap-2 p-4 bg-white border-t border-gray-200',
        className
      )}
    >
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
            'disabled:bg-gray-100 disabled:text-gray-500',
            'placeholder:text-gray-400'
          )}
          style={{ maxHeight: '120px' }}
        />
      </div>

      <button
        type="submit"
        disabled={!canSend}
        className={cn(
          'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all',
          canSend
            ? 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        )}
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  )
}

export default ChatInput
