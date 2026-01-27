// Quiz related types

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: number
  question: string
  options: QuizOption[]
}

export interface QuizQuestionsResponse {
  questions: QuizQuestion[]
  total_questions: number
}

export interface QuizAnswer {
  question_id: number
  option_id: string
}

export interface QuizSubmitRequest {
  answers: QuizAnswer[]
}

export interface QuizSubmitResponse {
  success: boolean
  persona_id: number
  persona_name: string
  persona_level: string
  message: string
}

export interface PersonaLevelInfo {
  current_level: string | null
  level_name: string
  description: string
  diary_count: number
  next_level: string | null
  next_level_name: string | null
  diaries_needed: number | null
  progress_percent: number
}
