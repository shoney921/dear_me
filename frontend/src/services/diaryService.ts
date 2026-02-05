import api from '@/lib/api'
import type {
  Diary, DiaryCreate, DiaryUpdate, DiaryListResponse, DiaryStats,
  DiaryPromptSuggestionResponse, DiaryCalendarResponse, WeeklyInsightResponse
} from '@/types/diary'

export const diaryService = {
  async getList(page = 1, perPage = 10, mood?: string): Promise<DiaryListResponse> {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    })
    if (mood) params.append('mood', mood)

    const response = await api.get<DiaryListResponse>(`/diaries?${params}`)
    return response.data
  },

  async getById(id: number): Promise<Diary> {
    const response = await api.get<Diary>(`/diaries/${id}`)
    return response.data
  },

  async create(data: DiaryCreate): Promise<Diary> {
    const response = await api.post<Diary>('/diaries', data)
    return response.data
  },

  async update(id: number, data: DiaryUpdate): Promise<Diary> {
    const response = await api.patch<Diary>(`/diaries/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/diaries/${id}`)
  },

  async getCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/diaries/count')
    return response.data
  },

  async getStats(): Promise<DiaryStats> {
    const response = await api.get<DiaryStats>('/diaries/stats')
    return response.data
  },

  async getPromptSuggestions(): Promise<DiaryPromptSuggestionResponse> {
    const response = await api.get<DiaryPromptSuggestionResponse>('/diaries/prompt-suggestions')
    return response.data
  },

  async getCalendar(year: number, month: number): Promise<DiaryCalendarResponse> {
    const response = await api.get<DiaryCalendarResponse>(`/diaries/calendar?year=${year}&month=${month}`)
    return response.data
  },

  async getWeeklyInsight(): Promise<WeeklyInsightResponse> {
    const response = await api.get<WeeklyInsightResponse>('/diaries/weekly-insight')
    return response.data
  },
}
