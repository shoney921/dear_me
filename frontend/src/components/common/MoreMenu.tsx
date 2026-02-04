import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Crown, X } from 'lucide-react'

interface MoreMenuProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  { path: '/friends', label: '친구', icon: Users, description: '친구와 소통하기' },
  { path: '/premium', label: '프리미엄', icon: Crown, description: '구독 & 혜택' },
]

export default function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 sm:hidden"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed bottom-14 left-0 right-0 z-50 animate-slide-up rounded-t-2xl border-t bg-background pb-safe sm:hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">더보기</span>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-muted"
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
        </div>
      </div>
    </>
  )
}
