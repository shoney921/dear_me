import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatService } from '@/services/chatService'
import type { CreateChatRequest, SendMessageRequest } from '@/types/chat'

export function useChats(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['chats', page, limit],
    queryFn: () => chatService.getChats(page, limit),
  })
}

export function useChat(chatId: number) {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => chatService.getChat(chatId),
    enabled: !!chatId,
  })
}

export function useCreateChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      personaId,
      request,
    }: {
      personaId: number
      request?: CreateChatRequest
    }) => chatService.createChat(personaId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

export function useSendMessage(chatId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: SendMessageRequest) =>
      chatService.sendMessage(chatId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatService.deleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}
