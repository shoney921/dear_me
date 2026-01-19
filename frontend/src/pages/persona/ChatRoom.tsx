import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { chatService } from '@/services/chatService'
import { ChatMessage, StreamingMessage, ChatMessageLoading } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import type { ChatMessage as ChatMessageType } from '@/types/chat'

export function ChatRoom() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // 대화 상세 조회
  const {
    data: chatDetail,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => chatService.getChat(Number(chatId)),
    enabled: !!chatId,
  })

  // 초기 메시지 설정
  useEffect(() => {
    if (chatDetail?.messages) {
      setMessages(chatDetail.messages)
    }
  }, [chatDetail])

  // 스크롤 맨 아래로
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  // 메시지 전송 (스트리밍)
  const handleSendMessage = async (content: string) => {
    if (!chatId || isStreaming) return

    // 사용자 메시지를 먼저 표시
    const userMessage: ChatMessageType = {
      id: Date.now(),
      chat_id: Number(chatId),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsStreaming(true)
    setStreamingContent('')
    setError(null)

    try {
      await chatService.sendMessageStream(
        Number(chatId),
        content,
        // onChunk
        (chunk) => {
          setStreamingContent((prev) => prev + chunk)
        },
        // onComplete
        () => {
          setStreamingContent((prev) => {
            // 스트리밍 완료된 내용을 메시지로 추가
            const assistantMessage: ChatMessageType = {
              id: Date.now() + 1,
              chat_id: Number(chatId),
              role: 'assistant',
              content: prev,
              created_at: new Date().toISOString(),
            }
            setMessages((messages) => [...messages, assistantMessage])
            return ''
          })
          setIsStreaming(false)

          // 캐시 무효화
          queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
          queryClient.invalidateQueries({ queryKey: ['chats'] })
        },
        // onError
        (errorMsg) => {
          setError(errorMsg)
          setIsStreaming(false)
          setStreamingContent('')
        }
      )
    } catch (err) {
      setError('메시지 전송에 실패했습니다.')
      setIsStreaming(false)
      setStreamingContent('')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (loadError || !chatDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-red-600 mb-4">대화를 불러오는데 실패했습니다.</p>
        <button
          onClick={() => navigate('/persona/chat')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          목록으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/persona/chat')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-lg flex-shrink-0">
              😊
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-gray-900 truncate">
                {chatDetail.persona_name || '페르소나'}
              </h1>
              {chatDetail.owner_name && (
                <p className="text-xs text-gray-500">
                  {chatDetail.owner_name}의 분신
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메시지 영역 */}
      <main
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        <div className="max-w-lg mx-auto">
          {/* 빈 상태 */}
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl">
                😊
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                대화를 시작해보세요
              </h2>
              <p className="text-gray-500 text-sm">
                무엇이든 물어보세요. 당신의 일기를 바탕으로 대화합니다.
              </p>
            </div>
          )}

          {/* 메시지 목록 */}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* 스트리밍 중인 메시지 */}
          {isStreaming && streamingContent && (
            <StreamingMessage content={streamingContent} />
          )}

          {/* 로딩 표시 (스트리밍 시작 전) */}
          {isStreaming && !streamingContent && <ChatMessageLoading />}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-center">
              {error}
            </div>
          )}

          {/* 스크롤 앵커 */}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 입력 영역 */}
      <div className="max-w-lg mx-auto w-full">
        <ChatInput
          onSend={handleSendMessage}
          disabled={isStreaming}
          placeholder={isStreaming ? '응답 중...' : '메시지를 입력하세요...'}
        />
      </div>
    </div>
  )
}

export default ChatRoom
