import api from '@/lib/api'
import type {
  QuizQuestionsResponse,
  QuizSubmitRequest,
  QuizSubmitResponse,
  PersonaLevelInfo,
} from '@/types/quiz'

export const quizService = {
  // Get quiz questions
  getQuestions: async (): Promise<QuizQuestionsResponse> => {
    const response = await api.get<QuizQuestionsResponse>('/quiz/questions')
    return response.data
  },

  // Submit quiz answers
  submitQuiz: async (data: QuizSubmitRequest): Promise<QuizSubmitResponse> => {
    const response = await api.post<QuizSubmitResponse>('/quiz/submit', data)
    return response.data
  },

  // Get persona level info
  getPersonaLevel: async (): Promise<PersonaLevelInfo> => {
    const response = await api.get<PersonaLevelInfo>('/quiz/persona-level')
    return response.data
  },

  // Upgrade persona level
  upgradePersona: async (): Promise<{
    success: boolean
    new_level: string
    level_name: string
    message: string
  }> => {
    const response = await api.post('/quiz/upgrade-persona')
    return response.data
  },
}
