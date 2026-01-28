import api from '@/lib/api'
import type {
  MentalAnalysisWithFeedback,
  MentalFeedback,
  RadarChartResponse,
  MentalHistoryResponse,
  BookRecommendationResponse,
  WeeklyReportResponse,
  MonthlyReportResponse,
  NegativeTrendResponse,
} from '@/types/mental'

export const mentalService = {
  async getCurrentStatus(): Promise<MentalAnalysisWithFeedback> {
    const response = await api.get<MentalAnalysisWithFeedback>('/mental/current')
    return response.data
  },

  async getRadarData(): Promise<RadarChartResponse> {
    const response = await api.get<RadarChartResponse>('/mental/radar')
    return response.data
  },

  async getHistory(days = 30, skip = 0, limit = 30): Promise<MentalHistoryResponse> {
    const params = new URLSearchParams({
      days: String(days),
      skip: String(skip),
      limit: String(limit),
    })
    const response = await api.get<MentalHistoryResponse>(`/mental/history?${params}`)
    return response.data
  },

  async getWeeklyReport(): Promise<WeeklyReportResponse> {
    const response = await api.get<WeeklyReportResponse>('/mental/reports/weekly')
    return response.data
  },

  async getMonthlyReport(): Promise<MonthlyReportResponse> {
    const response = await api.get<MonthlyReportResponse>('/mental/reports/monthly')
    return response.data
  },

  async generateFeedback(analysisId?: number): Promise<MentalFeedback> {
    const response = await api.post<MentalFeedback>('/mental/feedback', {
      analysis_id: analysisId,
    })
    return response.data
  },

  async getBookRecommendations(): Promise<BookRecommendationResponse> {
    const response = await api.get<BookRecommendationResponse>('/mental/book-recommendations')
    return response.data
  },

  async checkNegativeTrend(days = 7): Promise<NegativeTrendResponse> {
    const response = await api.get<NegativeTrendResponse>(`/mental/check-negative-trend?days=${days}`)
    return response.data
  },
}
