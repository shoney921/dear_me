import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Info, X } from 'lucide-react'

import { chatService } from '@/services/chatService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageLoading } from '@/components/ui/Loading'
import { cn } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/error'
import type { ChatWithMessages, ChatMessage } from '@/types/chat'

// 임시 ID 생성 (낙관적 업데이트용)
const generateTempId = () => -Date.now()

export default function PersonaChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showDisclaimer, setShowDisclaimer] = useState(true)

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

  const sendMutation = useMutation({
    mutationFn: (content: string) => chatService.sendMessage(Number(chatId), content),

    // 즉시 사용자 메시지 표시 (낙관적 업데이트)
    onMutate: async (content: string) => {
      console.log('[onMutate] 시작 - 사용자 메시지:', content)

      await queryClient.cancelQueries({ queryKey: ['chat', chatId] })
      console.log('[onMutate] 쿼리 취소 완료')

      const previousChat = queryClient.getQueryData<ChatWithMessages>(['chat', chatId])
      console.log('[onMutate] 이전 채팅 데이터:', previousChat?.messages.length, '개 메시지')

      if (previousChat) {
        const optimisticUserMessage: ChatMessage = {
          id: generateTempId(),
          chat_id: Number(chatId),
          content: content,
          is_user: true,
          created_at: new Date().toISOString(),
        }

        const updatedChat = {
          ...previousChat,
          messages: [...previousChat.messages, optimisticUserMessage],
        }

        console.log('[onMutate] 낙관적 업데이트 적용 - 새 메시지 개수:', updatedChat.messages.length)
        queryClient.setQueryData<ChatWithMessages>(['chat', chatId], updatedChat)

        // 업데이트 후 확인
        const afterUpdate = queryClient.getQueryData<ChatWithMessages>(['chat', chatId])
        console.log('[onMutate] 업데이트 후 메시지 개수:', afterUpdate?.messages.length)
      }

      console.log('[onMutate] 완료')

      return { previousChat }
    },

    // AI 응답 추가
    onSuccess: (aiMessage) => {
      console.log('[onSuccess] AI 응답 받음:', aiMessage)

      const currentChat = queryClient.getQueryData<ChatWithMessages>(['chat', chatId])
      console.log('[onSuccess] 현재 채팅 데이터:', currentChat?.messages.length, '개 메시지')

      if (currentChat) {
        const updatedChat = {
          ...currentChat,
          messages: [...currentChat.messages, aiMessage],
        }

        console.log('[onSuccess] AI 응답 추가 - 새 메시지 개수:', updatedChat.messages.length)
        queryClient.setQueryData<ChatWithMessages>(['chat', chatId], updatedChat)
      }

      setError('')
      console.log('[onSuccess] 완료')
    },

    // 실패 시 롤백
    onError: (err, _variables, context) => {
      console.log('[onError] 에러 발생:', err)

      if (context?.previousChat) {
        queryClient.setQueryData(['chat', chatId], context.previousChat)
        console.log('[onError] 롤백 완료')
      }
      setError(getApiErrorMessage(err))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sendMutation.isPending) return

    const messageToSend = message.trim()
    setMessage('') // 입력창 즉시 클리어
    sendMutation.mutate(messageToSend)
  }

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat?.messages])

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
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
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
            {sendMutation.isPending && (
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
      <form onSubmit={handleSubmit} className="border-t pt-4">
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
            disabled={sendMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || sendMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
