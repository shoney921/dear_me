export type OverallStatus = 'good' | 'neutral' | 'concerning' | 'critical'
export type TrendType = 'improving' | 'stable' | 'declining'
export type ReportType = 'weekly' | 'monthly'

export interface RadarChartData {
  emotional_stability: number
  vitality: number
  self_esteem: number
  positivity: number
  social_connection: number
  resilience: number
}

export interface MentalAnalysis {
  id: number
  user_id: number
  diary_id?: number
  emotional_stability_score: number
  vitality_score: number
  self_esteem_score: number
  positivity_score: number
  social_connection_score: number
  resilience_score: number
  overall_status: OverallStatus
  analysis_date: string
  created_at: string
}

export interface MentalFeedback {
  status_label: string
  message: string
  encouragement: string
  suggestion?: string
  emoji: string
}

export interface MentalAnalysisWithFeedback extends MentalAnalysis {
  feedback?: MentalFeedback
}

export interface RadarChartResponse {
  current: RadarChartData
  previous?: RadarChartData
  trend: TrendType
}

export interface MentalHistoryItem {
  date: string
  overall_status: OverallStatus
  emotional_stability_score: number
  vitality_score: number
  self_esteem_score: number
  positivity_score: number
  social_connection_score: number
  resilience_score: number
}

export interface MentalHistoryResponse {
  items: MentalHistoryItem[]
  total: number
}

export interface BookRecommendation {
  title: string
  author: string
  description: string
  reason: string
  category: string
}

export interface BookRecommendationResponse {
  books: BookRecommendation[]
  based_on_status: OverallStatus
}

export interface MentalReport {
  id: number
  user_id: number
  report_type: ReportType
  period_start: string
  period_end: string
  avg_emotional_stability_score: number
  avg_vitality_score: number
  avg_self_esteem_score: number
  avg_positivity_score: number
  avg_social_connection_score: number
  avg_resilience_score: number
  trend: TrendType
  insights?: string[]
  recommendations?: string[]
  created_at: string
}

export interface WeeklyReportResponse extends MentalReport {
  week_number: number
  daily_scores?: Record<string, number>[]
}

export interface MonthlyReportResponse extends MentalReport {
  month: number
  year: number
  weekly_averages?: Record<string, number>[]
}

export interface NegativeTrendResponse {
  is_negative_trend: boolean
  days_checked: number
}
