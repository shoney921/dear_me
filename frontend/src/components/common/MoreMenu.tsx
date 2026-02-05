import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Crown, X } from 'lucide-react'

import { cn } from '@/lib/utils'

interface MoreMenuProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  { path: '/friends', label: '친구', icon: Users, description: '친구와 소통하기' },
  { path: '/premium', label: '프리미엄', icon: Crown, description: '구독 & 혜택' },
]

export default function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
      document.body.style.overflow = 'hidden'
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 200)
      document.body.style.overflow = ''
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/50 sm:hidden transition-opacity duration-200",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Menu Panel - 화면 하단에서 올라오는 바텀 시트 */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl border-t bg-background sm:hidden transition-transform duration-200 ease-out",
          isAnimating ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-medium text-muted-foreground">더보기</span>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted active:bg-muted/80"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-2 pb-safe">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-muted active:bg-muted/80"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </Link>
            )
          })}
          {/* 탭바 높이만큼 여백 추가 */}
          <div className="h-[68px]" />
        </div>
      </div>
    </>
  )
}
