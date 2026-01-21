import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            'h-6 w-11 rounded-full bg-secondary transition-colors',
            'peer-checked:bg-primary',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            'after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5',
            'after:rounded-full after:bg-background after:transition-transform',
            'peer-checked:after:translate-x-5',
            className
          )}
        />
      </label>
    )
  }
)

Switch.displayName = 'Switch'

export { Switch }
