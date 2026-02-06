import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { personaService } from '@/services/personaService'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Loader2, XCircle } from 'lucide-react'

type VerifyState = 'loading' | 'logging-in' | 'error'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const { setAuth } = useAuthStore()

  const [state, setState] = useState<VerifyState>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const calledRef = useRef(false)

  useEffect(() => {
    if (!token) {
      setState('error')
      setErrorMessage('인증 토큰이 없습니다.')
      return
    }

    // StrictMode 중복 호출 방지 (토큰은 1회용)
    if (calledRef.current) return
    calledRef.current = true

    authService
      .verifyEmail(token)
      .then(async (data) => {
        setState('logging-in')

        // 자동 로그인
        localStorage.setItem('access_token', data.access_token)
        const user = await authService.getMe()
        setAuth(user, data.access_token)

        // 페르소나 유무 확인 → 리다이렉트
        try {
          const personaStatus = await personaService.getStatus()
          if (!personaStatus.has_persona) {
            navigate('/quiz', { replace: true })
          } else {
            navigate('/', { replace: true })
          }
        } catch {
          navigate('/quiz', { replace: true })
        }
      })
      .catch(() => {
        setState('error')
        setErrorMessage('인증 링크가 만료되었거나 유효하지 않습니다.')
      })
  }, [token, navigate, setAuth])

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
            <CardTitle className="text-2xl">이메일 인증</CardTitle>
            <CardDescription>DearMe 계정 인증</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center py-8">
            {(state === 'loading' || state === 'logging-in') && (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">
                  {state === 'loading' ? '이메일 인증 중...' : '로그인 중...'}
                </p>
              </>
            )}

            {state === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-lg font-medium text-destructive mb-2">인증 실패</p>
                <p className="text-muted-foreground text-center">{errorMessage}</p>
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-center">
            {state === 'error' && (
              <Link to="/login" className="w-full">
                <Button className="w-full">로그인하기</Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
