import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Diary, DiaryCreate, DiaryUpdate, DiaryListResponse, DiaryStats } from '@/types/diary'

export const diaryKeys = {
  all: ['diaries'] as const,
  lists: () => [...diaryKeys.all, 'list'] as const,
  list: (filters: { year?: number; month?: number; page?: number }) =>
    [...diaryKeys.lists(), filters] as const,
  details: () => [...diaryKeys.all, 'detail'] as const,
  detail: (id: number) => [...diaryKeys.details(), id] as const,
  byDate: (date: string) => [...diaryKeys.all, 'date', date] as const,
  stats: () => [...diaryKeys.all, 'stats'] as const,
}

export function useDiaries(year?: number, month?: number, page: number = 1) {
  return useQuery({
    queryKey: diaryKeys.list({ year, month, page }),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (year) params.append('year', String(year))
      if (month) params.append('month', String(month))
      params.append('page', String(page))
      params.append('limit', '31')

      const response = await api.get<DiaryListResponse>(`/diaries?${params}`)
      return response.data
    },
  })
}

export function useDiary(id: number) {
  return useQuery({
    queryKey: diaryKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Diary>(`/diaries/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useDiaryByDate(date: string) {
  return useQuery({
    queryKey: diaryKeys.byDate(date),
    queryFn: async () => {
      const response = await api.get<Diary>(`/diaries/date/${date}`)
      return response.data
    },
    enabled: !!date,
    retry: false,
  })
}

export function useDiaryStats() {
  return useQuery({
    queryKey: diaryKeys.stats(),
    queryFn: async () => {
      const response = await api.get<DiaryStats>('/diaries/stats')
      return response.data
    },
  })
}

export function useCreateDiary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: DiaryCreate) => {
      const response = await api.post<Diary>('/diaries', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diaryKeys.all })
    },
  })
}

export function useUpdateDiary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: DiaryUpdate }) => {
      const response = await api.put<Diary>(`/diaries/${id}`, data)
      return response.data
    },
    onSuccess: (diary) => {
      queryClient.invalidateQueries({ queryKey: diaryKeys.all })
      queryClient.setQueryData(diaryKeys.detail(diary.id), diary)
    },
  })
}

export function useDeleteDiary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/diaries/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diaryKeys.all })
    },
  })
}
