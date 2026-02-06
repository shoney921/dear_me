import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, User, Users, LogOut, Bell, Crown, House, Brain, MoreHorizontal } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import { notificationService } from '@/services/notificationService'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: '홈', icon: House },
  { path: '/diaries', label: '일기', icon: BookOpen },
  { path: '/persona', label: '페르소나', icon: User },
  { path: '/mental', label: '심리 케어', icon: Brain },
  { path: '/friends', label: '친구', icon: Users },
  { path: '/premium', label: '프리미엄', icon: Crown },
]

export default function Header() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [visibleCount, setVisibleCount] = useState(navItems.length)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const moreRef = useRef<HTMLDivElement>(null)

  const { data: unreadData } = useQuery({
    queryKey: ['notificationUnreadCount'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30000,
  })

  const unreadCount = unreadData?.unread_count ?? 0

  // 메뉴 항목 너비 계산 및 visible count 조정
  useEffect(() => {
    const calculateVisibleItems = () => {
      if (!navRef.current) return

      const navWidth = navRef.current.offsetWidth
      const moreButtonWidth = 100 // 더보기 버튼 예상 너비
      let totalWidth = 0
      let count = 0

      for (let i = 0; i < itemRefs.current.length; i++) {
        const item = itemRefs.current[i]
        if (item) {
          const itemWidth = item.offsetWidth + 4 // gap 포함
          if (totalWidth + itemWidth + moreButtonWidth < navWidth) {
            totalWidth += itemWidth
            count++
          } else {
            break
          }
        }
      }

      // 최소 2개는 보이도록
      setVisibleCount(Math.max(2, count))
    }

    calculateVisibleItems()

    const resizeObserver = new ResizeObserver(calculateVisibleItems)
    if (navRef.current) {
      resizeObserver.observe(navRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  // 외부 클릭 시 더보기 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false)
      }
    }

    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMoreOpen])

  const overflowItems = navItems.slice(visibleCount)
  const isOverflowActive = overflowItems.some(
    item => location.pathname === item.path ||
    (item.path !== '/' && location.pathname.startsWith(item.path))
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden sm:block">
      <div className="container mx-auto flex h-14 items-center px-4">
        {/* Logo */}
        <Link to="/" className="mr-6 flex flex-shrink-0 items-center space-x-2">
          <img src="/dearme-menu.png" alt="DearMe" className="h-5 w-auto" />
          <span className="text-xl font-bold text-primary">DearMe</span>
        </Link>

        {/* Navigation */}
        <div className="flex flex-1 items-center">
          <nav ref={navRef} className="flex flex-1 items-center space-x-1 overflow-hidden">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path))
              const isVisible = index < visibleCount

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  ref={(el) => { itemRefs.current[index] = el }}
                  className={cn(!isVisible && 'invisible absolute')}
                >
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn('gap-2 whitespace-nowrap', isActive && 'bg-secondary')}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* 더보기 버튼 - nav 바깥에 위치 */}
          {overflowItems.length > 0 && (
            <div ref={moreRef} className="relative ml-1 flex-shrink-0">
              <Button
                variant={isOverflowActive ? 'secondary' : 'ghost'}
                size="sm"
                className={cn('gap-2', isOverflowActive && 'bg-secondary')}
                onClick={() => setIsMoreOpen(!isMoreOpen)}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span>더보기</span>
              </Button>

              {/* 더보기 드롭다운 */}
              {isMoreOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-md border bg-background shadow-lg">
                  {overflowItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path ||
                      (item.path !== '/' && location.pathname.startsWith(item.path))

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMoreOpen(false)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted',
                          isActive && 'bg-secondary'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="flex flex-shrink-0 items-center gap-2 ml-2">
          <Link to="/notifications">
            <Button variant="ghost" size="icon" className="relative" title="알림">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>
          <span className="hidden text-sm text-muted-foreground lg:inline">
            {user?.username}
          </span>
          <Button variant="ghost" size="icon" onClick={logout} title="로그아웃">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
