import { cn } from '@/lib/utils'
import { Weather, WEATHER_EMOJIS, WEATHER_LABELS } from '@/types/diary'

interface WeatherPickerProps {
  value: Weather | null
  onChange: (weather: Weather | null) => void
  disabled?: boolean
}

const weathers: Weather[] = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy']

export function WeatherPicker({ value, onChange, disabled }: WeatherPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">날씨</label>
      <div className="flex flex-wrap gap-2">
        {weathers.map((weather) => (
          <button
            key={weather}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === weather ? null : weather)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-colors',
              'hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed',
              value === weather
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-input'
            )}
          >
            <span className="text-base">{WEATHER_EMOJIS[weather]}</span>
            <span>{WEATHER_LABELS[weather]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
