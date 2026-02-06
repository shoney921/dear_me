import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Info, X } from 'lucide-react'

import { chatService } from '@/services/chatService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageLoading } from '@/components/ui/Loading'
import { cn } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/error'
import type { ChatWithMessages, ChatMessage } from '@/types/chat'

export default function PersonaChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  // chatId가 없으면 페르소나 페이지로 리다이렉트
  useEffect(() => {
    if (!chatId) {
      navigate('/persona')
    }
  }, [chatId, navigate])

  const { data: chat, isLoading } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => chatService.getById(Number(chatId)),
    enabled: !!chatId,
    staleTime: Infinity, // 데이터를 항상 최신으로 간주 (자동 refetch 방지)
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
  })

  const handleSendMessage = async (content: string) => {
    setIsStreaming(true)
    setStreamingMessage('')
    setError('')

    const currentChat = queryClient.getQueryData<ChatWithMessages>(['chat', chatId])
    if (!currentChat) return

    // Optimistic Update: 사용자 메시지 즉시 표시
    const tempUserMessage: ChatMessage = {
      id: Date.now(), // 임시 ID
      chat_id: Number(chatId),
      content: content,
      is_user: true,
      created_at: new Date().toISOString(),
    }

    const optimisticChat = {
      ...currentChat,
      messages: [...currentChat.messages, tempUserMessage],
    }
    queryClient.setQueryData<ChatWithMessages>(['chat', chatId], optimisticChat)

    try {
      await chatService.sendMessageStream(
        Number(chatId),
        content,
        // onChunk: 스트리밍 청크 받기
        (chunk: string) => {
          setStreamingMessage((prev) => prev + chunk)
        },
        // onUserMessage: 서버에서 확인된 사용자 메시지 (임시 메시지 교체)
        (userMessage: ChatMessage) => {
          const latestChat = queryClient.getQueryData<ChatWithMessages>(['chat', chatId])
          if (latestChat) {
            // 임시 메시지를 실제 메시지로 교체
            const updatedMessages = latestChat.messages.map(msg =>
              msg.id === tempUserMessage.id ? userMessage : msg
            )
            queryClient.setQueryData<ChatWithMessages>(['chat', chatId], {
              ...latestChat,
              messages: updatedMessages,
            })
          }
        },
        // onDone: AI 응답 완료
        (aiMessage: ChatMessage) => {
          const latestChat = queryClient.getQueryData<ChatWithMessages>(['chat', chatId])
          if (latestChat) {
            const updatedChat = {
              ...latestChat,
              messages: [...latestChat.messages, aiMessage],
            }
            queryClient.setQueryData<ChatWithMessages>(['chat', chatId], updatedChat)
          }
          setIsStreaming(false)
          setStreamingMessage('')
        },
        // onError: 에러 처리
        (errorMsg: string) => {
          setError(errorMsg)
          setIsStreaming(false)
          setStreamingMessage('')

          // 에러 시 optimistic update 롤백
          const latestChat = queryClient.getQueryData<ChatWithMessages>(['chat', chatId])
          if (latestChat) {
            const rollbackMessages = latestChat.messages.filter(msg => msg.id !== tempUserMessage.id)
            queryClient.setQueryData<ChatWithMessages>(['chat', chatId], {
              ...latestChat,
              messages: rollbackMessages,
            })
          }
        }
      )
    } catch (err) {
      setError(getApiErrorMessage(err))
      setIsStreaming(false)
      setStreamingMessage('')

      // 에러 시 optimistic update 롤백
      const latestChat = queryClient.getQueryData<ChatWithMessages>(['chat', chatId])
      if (latestChat) {
        const rollbackMessages = latestChat.messages.filter(msg => msg.id !== tempUserMessage.id)
        queryClient.setQueryData<ChatWithMessages>(['chat', chatId], {
          ...latestChat,
          messages: rollbackMessages,
        })
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isStreaming) return

    const messageToSend = message.trim()
    setMessage('') // 입력창 즉시 클리어
    handleSendMessage(messageToSend)
  }

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat?.messages, streamingMessage])

  if (isLoading) {
    return <PageLoading />
  }

  if (!chat) {
    return (
      <div className="text-center">
        <p>채팅을 찾을 수 없습니다.</p>
        <Button onClick={() => navigate('/persona')} className="mt-4">
          돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-4.5rem-var(--safe-top))] sm:h-[calc(100dvh-8rem)] max-w-2xl flex-col -mb-20 sm:mb-0">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/persona')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-semibold">페르소나 대화</h1>
          <p className="text-sm text-muted-foreground">
            {chat.is_own_persona ? '나의 페르소나' : '친구 페르소나'}
          </p>
        </div>
      </div>

      {/* AI Disclaimer */}
      {showDisclaimer && (
        <div className="mb-2 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">AI 페르소나 안내</p>
            <p className="text-xs mt-1 opacity-80">
              이 페르소나는 AI가 생성한 가상의 인격체로 실제 사람이 아닙니다.
              응답은 참고용이며, 전문적인 상담을 대체할 수 없습니다.
            </p>
          </div>
          <button
            onClick={() => setShowDisclaimer(false)}
            className="text-blue-500 hover:text-blue-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {chat.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            대화를 시작해보세요!
          </div>
        ) : (
          <div className="space-y-4">
            {chat.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.is_user ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    msg.is_user
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isStreaming && streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-secondary px-4 py-2">
                  <p className="whitespace-pre-wrap">{streamingMessage}</p>
                  <span className="animate-pulse">▊</span>
                </div>
              </div>
            )}
            {isStreaming && !streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-secondary px-4 py-2">
                  <p className="text-muted-foreground">페르소나가 생각하는 중...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t pt-2 pb-safe">
        {error && (
          <div className="mb-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="메시지를 입력하세요..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isStreaming}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || isStreaming}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
