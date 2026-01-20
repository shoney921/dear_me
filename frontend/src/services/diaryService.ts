import api from '@/lib/api'
import type { Diary, DiaryCreate, DiaryUpdate, DiaryListResponse } from '@/types/diary'

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
}
