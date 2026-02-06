import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'

import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { personaService } from '@/services/personaService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/error'
import { cn } from '@/lib/utils'

interface FieldErrors {
  email?: string
  password?: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()

  // Check if user just registered
  const isNewUser = location.state?.newUser === true
  const verificationSent = location.state?.verificationSent === true
  const registeredEmail = location.state?.email as string | undefined

  const [email, setEmail] = useState(registeredEmail || '')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showVerificationBanner, setShowVerificationBanner] = useState(verificationSent)
  const [bannerEmail, setBannerEmail] = useState(registeredEmail || '')

  const resendMutation = useMutation({
    mutationFn: () => authService.resendVerification({ email: bannerEmail }),
    onSuccess: () => {
      toast.success('인증 이메일이 재발송되었습니다. 이메일을 확인해주세요.')
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      try {
        localStorage.setItem('access_token', data.access_token)
        const user = await authService.getMe()
        setAuth(user, data.access_token)
        toast.success('로그인되었습니다.')

        // Check if user has persona - if new user without persona, redirect to quiz
        try {
          const personaStatus = await personaService.getStatus()
          if (!personaStatus.has_persona && isNewUser) {
            navigate('/quiz', { replace: true })
            return
          }
        } catch {
          // If persona status check fails, still redirect new users to quiz
          if (isNewUser) {
            navigate('/quiz', { replace: true })
            return
          }
        }

        navigate('/', { replace: true })
      } catch {
        toast.error('사용자 정보를 불러오는데 실패했습니다. 다시 로그인해주세요.')
        localStorage.removeItem('access_token')
      }
    },
    onError: (err) => {
      // 이메일 미인증 403 감지
      if (
        isAxiosError(err) &&
        err.response?.status === 403 &&
        err.response?.data?.detail === 'Email not verified'
      ) {
        setShowVerificationBanner(true)
        setBannerEmail(email)
      }
      toast.error(getApiErrorMessage(err))
    },
  })

  const validateField = (field: string, value: string) => {
    const errors: FieldErrors = { ...fieldErrors }

    switch (field) {
      case 'email':
        if (!value.trim()) {
          errors.email = '이메일을 입력해주세요.'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = '올바른 이메일 형식이 아닙니다.'
        } else {
          delete errors.email
        }
        break
      case 'password':
        if (!value.trim()) {
          errors.password = '비밀번호를 입력해주세요.'
        } else {
          delete errors.password
        }
        break
    }

    setFieldErrors(errors)
  }

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })
    validateField(field, field === 'email' ? email : password)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setTouched({ email: true, password: true })

    const errors: FieldErrors = {}

    if (!email.trim()) {
      errors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '올바른 이메일 형식이 아닙니다.'
    }

    if (!password.trim()) {
      errors.password = '비밀번호를 입력해주세요.'
    }

    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    loginMutation.mutate({ email, password })
  }

  const hasError = (field: string) => touched[field] && fieldErrors[field as keyof FieldErrors]

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
          <CardTitle className="text-2xl">DearMe</CardTitle>
          <CardDescription>일기 기반 AI 페르소나 서비스</CardDescription>
        </CardHeader>

        {showVerificationBanner && (
          <div className="mx-6 mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800 mb-2">
              이메일 인증이 필요합니다. <strong>{bannerEmail}</strong>로 발송된 인증 메일을 확인해주세요.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={resendMutation.isPending}
              onClick={() => resendMutation.mutate()}
            >
              {resendMutation.isPending ? '발송 중...' : '인증 메일 재발송'}
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
                  if (touched.email) validateField('email', e.target.value)
                }}
                onBlur={() => handleBlur('email')}
                className={cn(hasError('email') && 'border-destructive focus-visible:ring-destructive')}
                autoComplete="email"
              />
              {hasError('email') && (
                <p className="text-sm text-destructive">{fieldErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (touched.password) validateField('password', e.target.value)
                }}
                onBlur={() => handleBlur('password')}
                className={cn(hasError('password') && 'border-destructive focus-visible:ring-destructive')}
                autoComplete="current-password"
              />
              {hasError('password') && (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? '로그인 중...' : '로그인'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              계정이 없으신가요?{' '}
              <Link to="/register" className="text-primary hover:underline">
                회원가입
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  )
}
