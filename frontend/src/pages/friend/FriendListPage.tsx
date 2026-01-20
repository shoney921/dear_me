import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Search, UserPlus, Check, X } from 'lucide-react'

import { friendService } from '@/services/friendService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/Loading'

export default function FriendListPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

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

  // 사용자 검색
  const { data: searchResults, refetch: searchUsers } = useQuery({
    queryKey: ['userSearch', searchQuery],
    queryFn: () => friendService.searchUsers(searchQuery),
    enabled: false,
  })

  // 친구 요청 보내기
  const sendRequestMutation = useMutation({
    mutationFn: friendService.sendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] })
    },
  })

  // 요청 수락/거절
  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'accepted' | 'rejected' }) =>
      friendService.respondToRequest(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] })
    },
  })

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true)
      searchUsers()
    }
  }

  if (isLoadingFriends) {
    return <PageLoading />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
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
            <Button onClick={handleSearch}>검색</Button>
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
                    <span>{user.username}</span>
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
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {receivedRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span>{request.requester?.username}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      respondMutation.mutate({ id: request.id, status: 'accepted' })
                    }
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      respondMutation.mutate({ id: request.id, status: 'rejected' })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          {friends?.friends.length === 0 ? (
            <p className="text-center text-muted-foreground">아직 친구가 없습니다.</p>
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
                  <Button variant="outline" size="sm">
                    페르소나 대화
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
