import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Sparkles, Check } from 'lucide-react'

import { quizService } from '@/services/quizService'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/Loading'
import { getApiErrorMessage } from '@/lib/error'
import { cn } from '@/lib/utils'
import type { QuizAnswer } from '@/types/quiz'

export default function QuizPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(0) // 0 = intro, 1-5 = questions, 6 = submitting
  const [answers, setAnswers] = useState<Map<number, string>>(new Map())

  const { data: quizData, isLoading } = useQuery({
    queryKey: ['quiz-questions'],
    queryFn: quizService.getQuestions,
  })

  const submitMutation = useMutation({
    mutationFn: quizService.submitQuiz,
    onSuccess: (data) => {
      toast.success(data.message)
      // 페르소나 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['personaStatus'] })
      queryClient.invalidateQueries({ queryKey: ['myPersona'] })
      queryClient.invalidateQueries({ queryKey: ['personaLevel'] })
      navigate('/persona', { replace: true })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
      // 마지막 질문으로 돌아가기 (질문 수에 맞게 동적 처리)
      const totalQuestions = quizData?.questions?.length || 5
      setCurrentStep(totalQuestions)
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageLoading />
      </div>
    )
  }

  const questions = quizData?.questions || []
  const currentQuestion = currentStep > 0 && currentStep <= questions.length
    ? questions[currentStep - 1]
    : null

  const handleSelectOption = (questionId: number, optionId: string) => {
    const newAnswers = new Map(answers)
    newAnswers.set(questionId, optionId)
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentStep === 0) {
      setCurrentStep(1)
      return
    }

    if (currentQuestion && !answers.has(currentQuestion.id)) {
      toast.error('답변을 선택해주세요.')
      return
    }

    if (currentStep < questions.length) {
      setCurrentStep(currentStep + 1)
    } else {
      // Submit quiz
      const answerList: QuizAnswer[] = Array.from(answers.entries()).map(
        ([questionId, optionId]) => ({
          question_id: questionId,
          option_id: optionId,
        })
      )
      setCurrentStep(6) // submitting state
      submitMutation.mutate({ answers: answerList })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    navigate('/', { replace: true })
  }

  // Intro screen
  if (currentStep === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">나만의 페르소나를 만들어볼까요?</CardTitle>
            <CardDescription className="text-base mt-2">
              간단한 5가지 질문에 답하면
              <br />
              당신만의 AI 페르소나가 탄생해요!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4 py-6">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>성격 퀴즈로 생성된 임시 페르소나와</p>
              <p>바로 대화를 시작할 수 있어요.</p>
              <p className="text-primary font-medium mt-4">
                일기를 쓰면 더 나다운 페르소나로 진화해요!
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button onClick={handleNext} className="w-full" size="lg">
              시작하기
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              나중에 할게요
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Submitting screen
  if (currentStep === 6) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-500" />
            <p className="text-lg font-medium">페르소나를 생성하고 있어요...</p>
            <p className="text-sm text-muted-foreground mt-2">잠시만 기다려주세요</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Question screen
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-lg">
        <CardHeader className="pb-2">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              {currentStep} / {questions.length}
            </span>
            <div className="flex gap-1">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-2 w-8 rounded-full transition-colors',
                    idx < currentStep
                      ? 'bg-purple-500'
                      : idx === currentStep - 1
                      ? 'bg-purple-300'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              ))}
            </div>
          </div>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion?.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 py-4">
          {currentQuestion?.options.map((option) => {
            const isSelected = answers.get(currentQuestion.id) === option.id
            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all',
                  'hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20',
                  isSelected
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                    : 'border-gray-200 dark:border-gray-700'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(isSelected && 'text-purple-700 dark:text-purple-300 font-medium')}>
                    {option.text}
                  </span>
                  {isSelected && (
                    <Check className="h-5 w-5 text-purple-500" />
                  )}
                </div>
              </button>
            )
          })}
        </CardContent>
        <CardFooter className="flex justify-between pt-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            이전
          </Button>
          <Button
            onClick={handleNext}
            disabled={!!(currentQuestion && !answers.has(currentQuestion.id))}
          >
            {currentStep === questions.length ? '완료' : '다음'}
            {currentStep < questions.length && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
