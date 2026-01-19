export type Mood = 'happy' | 'sad' | 'angry' | 'calm' | 'excited' | 'anxious'
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy'

export interface Diary {
  id: number
  user_id: number
  content: string
  mood: Mood | null
  weather: Weather | null
  date: string
  is_private: boolean
  created_at: string
  updated_at: string | null
}

export interface DiaryCreate {
  content: string
  mood?: Mood | null
  weather?: Weather | null
  date?: string | null
  is_private?: boolean
}

export interface DiaryUpdate {
  content?: string
  mood?: Mood | null
  weather?: Weather | null
  is_private?: boolean
}

export interface DiaryListResponse {
  items: Diary[]
  total: number
  page: number
  limit: number
  has_next: boolean
}

export interface DiaryStats {
  total: number
  streak: number
  moods: Record<string, number>
  this_month_count: number
}

export const MOOD_LABELS: Record<Mood, string> = {
  happy: '행복',
  sad: '슬픔',
  angry: '화남',
  calm: '평온',
  excited: '신남',
  anxious: '불안',
}

export const MOOD_EMOJIS: Record<Mood, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  calm: '😌',
  excited: '🤩',
  anxious: '😰',
}

export const WEATHER_LABELS: Record<Weather, string> = {
  sunny: '맑음',
  cloudy: '흐림',
  rainy: '비',
  snowy: '눈',
  windy: '바람',
}

export const WEATHER_EMOJIS: Record<Weather, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
  windy: '💨',
}
