import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  Trash2,
  MoreVertical,
} from 'lucide-react'
import { chatService } from '@/services/chatService'
import { personaService } from '@/services/personaService'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { PersonaChat } from '@/types/chat'

export function ChatList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)

  // 페르소나 조회
  const { data: persona } = useQuery({
    queryKey: ['persona'],
    queryFn: personaService.getMyPersona,
  })

  // 대화 목록 조회
  const {
    data: chatListData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['chats'],
    queryFn: () => chatService.getChats(1, 50),
  })

  // 새 대화 생성
  const createChatMutation = useMutation({
    mutationFn: () => {
      if (!persona) throw new Error('페르소나가 없습니다.')
      return chatService.createChat(persona.id)
    },
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      navigate(`/persona/chat/${chat.id}`)
    },
  })

  // 대화 삭제
  const deleteChatMutation = useMutation({
    mutationFn: chatService.deleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      setMenuOpenId(null)
    },
  })

  const handleNewChat = () => {
    createChatMutation.mutate()
  }

  const handleOpenChat = (chatId: number) => {
    navigate(`/persona/chat/${chatId}`)
  }

  const handleDeleteChat = (chatId: number) => {
    if (confirm('이 대화를 삭제하시겠습니까?')) {
      deleteChatMutation.mutate(chatId)
    }
  }

  const toggleMenu = (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpenId(menuOpenId === chatId ? null : chatId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  const chats = chatListData?.chats || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/persona')}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              페르소나 대화
            </h1>
          </div>

          {persona && (
            <button
              onClick={handleNewChat}
              disabled={createChatMutation.isPending}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 text-purple-600" />
            </button>
          )}
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-lg mx-auto">
        {/* 에러 메시지 */}
        {error && (
          <div className="p-4 m-4 bg-red-50 text-red-700 rounded-xl">
            대화 목록을 불러오는데 실패했습니다.
          </div>
        )}

        {/* 빈 상태 */}
        {chats.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              아직 대화가 없어요
            </h2>
            <p className="text-gray-500 text-center mb-6">
              페르소나와 첫 대화를 시작해보세요!
            </p>
            {persona && (
              <button
                onClick={handleNewChat}
                disabled={createChatMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                새 대화 시작
              </button>
            )}
          </div>
        )}

        {/* 대화 목록 */}
        {chats.length > 0 && (
          <div className="divide-y divide-gray-100">
            {chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isMenuOpen={menuOpenId === chat.id}
                onOpen={() => handleOpenChat(chat.id)}
                onToggleMenu={(e) => toggleMenu(chat.id, e)}
                onDelete={() => handleDeleteChat(chat.id)}
                isDeleting={
                  deleteChatMutation.isPending &&
                  deleteChatMutation.variables === chat.id
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

interface ChatListItemProps {
  chat: PersonaChat
  isMenuOpen: boolean
  onOpen: () => void
  onToggleMenu: (e: React.MouseEvent) => void
  onDelete: () => void
  isDeleting: boolean
}

function ChatListItem({
  chat,
  isMenuOpen,
  onOpen,
  onToggleMenu,
  onDelete,
  isDeleting,
}: ChatListItemProps) {
  return (
    <div
      onClick={onOpen}
      className="relative flex items-center gap-4 p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
    >
      {/* 아바타 */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xl flex-shrink-0">
        😊
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900 truncate">
            {chat.title || chat.persona_name || '페르소나와의 대화'}
          </h3>
          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
            {formatRelativeTime(chat.updated_at || chat.created_at)}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">
          {chat.last_message || '대화를 시작해보세요'}
        </p>
        <span className="text-xs text-gray-400">
          메시지 {chat.message_count}개
        </span>
      </div>

      {/* 메뉴 버튼 */}
      <button
        onClick={onToggleMenu}
        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <MoreVertical className="w-5 h-5 text-gray-400" />
      </button>

      {/* 드롭다운 메뉴 */}
      {isMenuOpen && (
        <div
          className="absolute right-4 top-14 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className={cn(
              'flex items-center gap-2 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 transition-colors',
              isDeleting && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ChatList
