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
