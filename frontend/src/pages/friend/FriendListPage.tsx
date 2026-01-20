import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Search, UserPlus, Check, X, Clock, UserMinus, MessageCircle } from 'lucide-react'

import { friendService } from '@/services/friendService'
import { chatService } from '@/services/chatService'
import { personaService } from '@/services/personaService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PageLoading, Loading } from '@/components/ui/Loading'
import { getApiErrorMessage } from '@/lib/error'

export default function FriendListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // 친구 목록
  const { data: friends, isLoading: isLoadingFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: friendService.getList,
  })

  // 받은 요청
  const { data: receivedRequests } = useQuery({
    queryKey: ['friendRequests', 'received'],
    queryFn: friendService.getReceivedRequests,
  })

  // 보낸 요청
  const { data: sentRequests } = useQuery({
    queryKey: ['friendRequests', 'sent'],
    queryFn: friendService.getSentRequests,
  })

  // 사용자 검색
  const { data: searchResults, refetch: searchUsers, isFetching: isSearchFetching } = useQuery({
    queryKey: ['userSearch', searchQuery],
    queryFn: () => friendService.searchUsers(searchQuery),
    enabled: false,
  })

  // 친구 요청 보내기
  const sendRequestMutation = useMutation({
    mutationFn: friendService.sendRequest,
    onSuccess: () => {
      setError('')
      setSuccessMessage('친구 요청을 보냈습니다.')
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] })
      queryClient.invalidateQueries({ queryKey: ['userSearch'] })
    },
    onError: (err) => {
      setSuccessMessage('')
      setError(getApiErrorMessage(err))
    },
  })

  // 요청 수락/거절
  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'accepted' | 'rejected' }) =>
      friendService.respondToRequest(id, status),
    onSuccess: (_, variables) => {
      setError('')
      setSuccessMessage(variables.status === 'accepted' ? '친구 요청을 수락했습니다.' : '친구 요청을 거절했습니다.')
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] })
    },
    onError: (err) => {
      setSuccessMessage('')
      setError(getApiErrorMessage(err))
    },
  })

  // 친구 삭제
  const removeFriendMutation = useMutation({
    mutationFn: friendService.removeFriend,
    onSuccess: () => {
      setError('')
      setSuccessMessage('친구를 삭제했습니다.')
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
    onError: (err) => {
      setSuccessMessage('')
      setError(getApiErrorMessage(err))
    },
  })

  // 친구 페르소나와 대화
  const startChatMutation = useMutation({
    mutationFn: async (friendId: number) => {
      // 친구의 페르소나 조회
      const persona = await personaService.getFriendPersona(friendId)
      // 채팅 생성
      const chat = await chatService.createWithFriend(persona.id)
      return chat
    },
    onSuccess: (chat) => {
      navigate(`/persona/chat/${chat.id}`)
    },
    onError: (err) => {
      setSuccessMessage('')
      setError(getApiErrorMessage(err))
    },
  })

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true)
      setError('')
      setSuccessMessage('')
      searchUsers()
    }
  }

  const handleRemoveFriend = (friendId: number, friendName: string) => {
    if (window.confirm(`${friendName}님을 친구에서 삭제하시겠습니까?`)) {
      removeFriendMutation.mutate(friendId)
    }
  }

  if (isLoadingFriends) {
    return <PageLoading />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Messages */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
          {successMessage}
        </div>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            친구 찾기
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="사용자명으로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearchFetching}>
              {isSearchFetching ? <Loading size="sm" /> : '검색'}
            </Button>
          </div>

          {/* Search Results */}
          {isSearching && searchResults && (
            <div className="mt-4 space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendRequestMutation.mutate(user.id)}
                      disabled={sendRequestMutation.isPending}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      친구 요청
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Received Requests */}
      {receivedRequests && receivedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              받은 친구 요청
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {receivedRequests.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {receivedRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{request.requester?.username}</p>
                  <p className="text-sm text-muted-foreground">{request.requester?.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      respondMutation.mutate({ id: request.id, status: 'accepted' })
                    }
                    disabled={respondMutation.isPending}
                    title="수락"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      respondMutation.mutate({ id: request.id, status: 'rejected' })
                    }
                    disabled={respondMutation.isPending}
                    title="거절"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sent Requests */}
      {sentRequests && sentRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              보낸 친구 요청
              <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs">
                {sentRequests.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{request.addressee?.username}</p>
                  <p className="text-sm text-muted-foreground">{request.addressee?.email}</p>
                </div>
                <span className="text-sm text-muted-foreground">대기 중</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Friend List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            친구 목록
            {friends && friends.total > 0 && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {friends.total}명
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {friends?.friends.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              아직 친구가 없습니다.<br />
              위에서 친구를 검색해 추가해보세요!
            </p>
          ) : (
            <div className="space-y-2">
              {friends?.friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{friend.username}</p>
                    <p className="text-sm text-muted-foreground">{friend.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startChatMutation.mutate(friend.id)}
                      disabled={startChatMutation.isPending}
                      title="페르소나 대화"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      대화
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFriend(friend.id, friend.username)}
                      disabled={removeFriendMutation.isPending}
                      title="친구 삭제"
                    >
                      <UserMinus className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
