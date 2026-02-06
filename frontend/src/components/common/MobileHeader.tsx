import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'

import { notificationService } from '@/services/notificationService'
import { Button } from '@/components/ui/Button'
import ProfileDropdown from './ProfileDropdown'

export default function MobileHeader() {
  const { data: unreadData } = useQuery({
    queryKey: ['notificationUnreadCount'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30000,
  })

  const unreadCount = unreadData?.unread_count ?? 0

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:hidden pt-safe">
      <div className="flex h-12 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/dearme-menu.png" alt="DearMe" className="h-5 w-auto" />
          <span className="text-lg font-bold text-primary">DearMe</span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <Link to="/notifications">
            <Button variant="ghost" size="icon" className="relative h-9 w-9" title="알림">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>
          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}
