import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, User, Users, LogOut, Bell, Crown, House, Brain } from 'lucide-react'

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

  const { data: unreadData } = useQuery({
    queryKey: ['notificationUnreadCount'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30000, // 30초마다 갱신
  })

  const unreadCount = unreadData?.unread_count ?? 0

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        {/* Logo */}
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">DearMe</span>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn('gap-2', isActive && 'bg-secondary')}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-2">
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
          <span className="text-sm text-muted-foreground hidden sm:inline">
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
