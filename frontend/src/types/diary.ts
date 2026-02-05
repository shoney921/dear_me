export interface Diary {
  id: number
  user_id: number
  title: string
  content: string
  mood?: string
  weather?: string
  diary_date: string
  created_at: string
  updated_at: string
}

export interface DiaryCreate {
  title: string
  content: string
  mood?: string
  weather?: string
  diary_date: string
}

export interface DiaryUpdate {
  title?: string
  content?: string
  mood?: string
  weather?: string
}

export interface DiaryListResponse {
  items: Diary[]
  total: number
  page: number
  per_page: number
}

export interface DiaryStats {
  total_count: number
  current_streak: number
  longest_streak: number
  mood_distribution: Record<string, number>
  monthly_count: Record<string, number>
  weekly_average: number
}

export interface DiaryPromptSuggestion {
  title: string
  description: string
}

export interface DiaryPromptSuggestionResponse {
  prompts: DiaryPromptSuggestion[]
}

export interface DiaryCalendarItem {
  diary_date: string
  mood: string | null
  diary_id: number
}

export interface DiaryCalendarResponse {
  items: DiaryCalendarItem[]
  year: number
  month: number
}

export interface WeeklyInsightResponse {
  diary_count: number
  positive_ratio: number
  positive_ratio_change: number | null
  current_streak: number
  ai_summary: string | null
  last_diary_date: string | null
  dominant_mood: string | null
}
