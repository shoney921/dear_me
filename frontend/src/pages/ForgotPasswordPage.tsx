import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/error'
import { cn } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [touched, setTouched] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCooldown = useCallback(() => {
    setCooldown(60)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const mutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => {
      setSent(true)
      setError('')
      startCooldown()
    },
    onError: (err) => {
      setError(getApiErrorMessage(err))
    },
  })

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError('이메일을 입력해주세요.')
      return false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('올바른 이메일 형식이 아닙니다.')
      return false
    }
    setEmailError('')
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)

    if (!validateEmail(email)) return

    mutation.mutate({ email })
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: 'url(/dearme-background.png)' }}
    >
      <div className="flex min-h-screen items-center justify-center p-4 bg-white/60 backdrop-blur-sm">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <img src="/dearme-logo.png" alt="DearMe" className="h-16 w-16" />
            </div>
            <CardTitle className="text-2xl">비밀번호 찾기</CardTitle>
            <CardDescription>가입한 이메일을 입력하면 비밀번호 초기화 링크를 보내드립니다</CardDescription>
          </CardHeader>

          {sent ? (
            <>
              <CardContent className="flex flex-col items-center py-6">
                <div className="rounded-full bg-green-100 p-3 mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-center text-muted-foreground mb-4">
                  <strong>{email}</strong>로 비밀번호 초기화 링크를 발송했습니다.<br />
                  이메일을 확인해주세요.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={mutation.isPending || cooldown > 0}
                  onClick={() => mutation.mutate({ email })}
                >
                  {mutation.isPending
                    ? '발송 중...'
                    : cooldown > 0
                      ? `재발송 (${cooldown}초)`
                      : '이메일 재발송'}
                </Button>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link to="/login" className="text-sm text-primary hover:underline">
                  로그인으로 돌아가기
                </Link>
              </CardFooter>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    이메일
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (touched) validateEmail(e.target.value)
                    }}
                    onBlur={() => {
                      setTouched(true)
                      validateEmail(email)
                    }}
                    className={cn(touched && emailError && 'border-destructive focus-visible:ring-destructive')}
                    autoComplete="email"
                    autoFocus
                  />
                  {touched && emailError && (
                    <p className="text-sm text-destructive">{emailError}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? '발송 중...' : '초기화 링크 보내기'}
                </Button>
                <Link to="/login" className="text-sm text-primary hover:underline">
                  로그인으로 돌아가기
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
