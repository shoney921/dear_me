export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const MOODS = {
  happy: { label: '행복', emoji: '😊' },
  sad: { label: '슬픔', emoji: '😢' },
  angry: { label: '화남', emoji: '😠' },
  anxious: { label: '불안', emoji: '😰' },
  calm: { label: '평온', emoji: '😌' },
  excited: { label: '설렘', emoji: '🥰' },
  tired: { label: '피곤', emoji: '😫' },
  grateful: { label: '감사', emoji: '🙏' },
  lonely: { label: '외로움', emoji: '😔' },
  hopeful: { label: '희망', emoji: '✨' },
} as const

export const WEATHER = {
  sunny: { label: '맑음', emoji: '☀️' },
  cloudy: { label: '흐림', emoji: '☁️' },
  rainy: { label: '비', emoji: '🌧️' },
  snowy: { label: '눈', emoji: '❄️' },
  windy: { label: '바람', emoji: '💨' },
  foggy: { label: '안개', emoji: '🌫️' },
  stormy: { label: '폭풍', emoji: '⛈️' },
} as const

export const MIN_DIARIES_FOR_PERSONA = 7
