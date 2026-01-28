import { MessageCircle, Lightbulb, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { MentalFeedback } from '@/types/mental'

interface FeedbackCardProps {
  feedback: MentalFeedback
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-indigo-500" />
          오늘의 피드백
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 rounded-full">
            <span className="text-xl">{feedback.emoji}</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{feedback.status_label}</p>
            <p className="text-gray-700 mt-1">{feedback.message}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg">
          <Heart className="w-5 h-5 text-pink-500 mt-0.5" />
          <p className="text-gray-700 italic">{feedback.encouragement}</p>
        </div>

        {feedback.suggestion && (
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
            <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 text-sm">제안</p>
              <p className="text-gray-700 text-sm mt-1">{feedback.suggestion}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
