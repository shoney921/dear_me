import { cn } from '@/lib/utils'
import { Mood, MOOD_EMOJIS, MOOD_LABELS } from '@/types/diary'

interface MoodPickerProps {
  value: Mood | null
  onChange: (mood: Mood | null) => void
  disabled?: boolean
}

const moods: Mood[] = ['happy', 'sad', 'angry', 'calm', 'excited', 'anxious']

export function MoodPicker({ value, onChange, disabled }: MoodPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">기분</label>
      <div className="flex flex-wrap gap-2">
        {moods.map((mood) => (
          <button
            key={mood}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === mood ? null : mood)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-colors',
              'hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed',
              value === mood
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-input'
            )}
          >
            <span className="text-base">{MOOD_EMOJIS[mood]}</span>
            <span>{MOOD_LABELS[mood]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
