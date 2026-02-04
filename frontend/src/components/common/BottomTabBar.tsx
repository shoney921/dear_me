import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { House, BookOpen, User, Brain, MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import MoreMenu from './MoreMenu'

const tabs = [
  { path: '/', label: '홈', icon: House },
  { path: '/diaries', label: '일기', icon: BookOpen },
  { path: '/persona', label: '페르소나', icon: User },
  { path: '/mental', label: '심리케어', icon: Brain },
]

export default function BottomTabBar() {
  const location = useLocation()
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const isMoreActive = location.pathname.startsWith('/friends') || location.pathname.startsWith('/premium')

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe sm:hidden">
        <div className="flex h-[68px] items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab.path)
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 py-1',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            )
          })}

          {/* More Button */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-1',
              isMoreActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <MoreHorizontal className={cn('h-5 w-5', isMoreActive && 'stroke-[2.5]')} />
            <span className="text-[10px] font-medium">더보기</span>
          </button>
        </div>
      </nav>

      <MoreMenu isOpen={isMoreMenuOpen} onClose={() => setIsMoreMenuOpen(false)} />
    </>
  )
}
