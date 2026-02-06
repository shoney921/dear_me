import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'

import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/error'
import { cn } from '@/lib/utils'

interface FieldErrors {
  email?: string
  username?: string
  password?: string
  confirmPassword?: string
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [registrationComplete, setRegistrationComplete] = useState(false)
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

  const resendMutation = useMutation({
    mutationFn: () => authService.resendVerification({ email }),
    onSuccess: () => {
      toast.success('인증 이메일이 재발송되었습니다.')
      startCooldown()
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      setRegistrationComplete(true)
      startCooldown()
    },
    onError: (err) => {
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
      case 'username':
        if (!value.trim()) {
          errors.username = '사용자명을 입력해주세요.'
        } else if (value.length < 2) {
          errors.username = '사용자명은 2자 이상이어야 합니다.'
        } else {
          delete errors.username
        }
        break
      case 'password':
        if (!value.trim()) {
          errors.password = '비밀번호를 입력해주세요.'
        } else if (value.length < 8) {
          errors.password = '비밀번호는 8자 이상이어야 합니다.'
        } else {
          delete errors.password
        }
        // 비밀번호 확인도 다시 검증
        if (confirmPassword && value !== confirmPassword) {
          errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
        } else if (confirmPassword) {
          delete errors.confirmPassword
        }
        break
      case 'confirmPassword':
        if (!value.trim()) {
          errors.confirmPassword = '비밀번호 확인을 입력해주세요.'
        } else if (value !== password) {
          errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
        } else {
          delete errors.confirmPassword
        }
        break
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })
    validateField(field, field === 'email' ? email : field === 'username' ? username : field === 'password' ? password : confirmPassword)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 모든 필드 터치 처리
    setTouched({ email: true, username: true, password: true, confirmPassword: true })

    // 모든 필드 검증
    const errors: FieldErrors = {}

    if (!email.trim()) {
      errors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '올바른 이메일 형식이 아닙니다.'
    }

    if (!username.trim()) {
      errors.username = '사용자명을 입력해주세요.'
    } else if (username.length < 2) {
      errors.username = '사용자명은 2자 이상이어야 합니다.'
    }

    if (!password.trim()) {
      errors.password = '비밀번호를 입력해주세요.'
    } else if (password.length < 8) {
      errors.password = '비밀번호는 8자 이상이어야 합니다.'
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = '비밀번호 확인을 입력해주세요.'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    }

    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    registerMutation.mutate({ email, username, password })
  }

  const hasError = (field: string) => touched[field] && fieldErrors[field as keyof FieldErrors]

  // 가입 완료 → 이메일 확인 안내 화면
  if (registrationComplete) {
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
              <CardTitle className="text-2xl">이메일을 확인해주세요</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-8">
              <Mail className="h-16 w-16 text-primary mb-6" />
              <p className="text-center text-muted-foreground mb-2">
                <strong>{email}</strong>으로
              </p>
              <p className="text-center text-muted-foreground mb-6">
                인증 메일을 보냈습니다.<br />
                메일의 인증 링크를 클릭하면 자동으로 로그인됩니다.
              </p>
              <Button
                variant="outline"
                disabled={resendMutation.isPending || cooldown > 0}
                onClick={() => resendMutation.mutate()}
              >
                {resendMutation.isPending
                  ? '발송 중...'
                  : cooldown > 0
                    ? `재발송 (${cooldown}초)`
                    : '인증 메일 재발송'}
              </Button>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-center text-sm text-muted-foreground">
                이미 인증하셨나요?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  로그인
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
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
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>DearMe에 오신 것을 환영합니다</CardDescription>
        </CardHeader>
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
              <label htmlFor="username" className="text-sm font-medium">
                사용자명
              </label>
              <Input
                id="username"
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (touched.username) validateField('username', e.target.value)
                }}
                onBlur={() => handleBlur('username')}
                className={cn(hasError('username') && 'border-destructive focus-visible:ring-destructive')}
                minLength={2}
                maxLength={50}
                autoComplete="username"
              />
              {hasError('username') && (
                <p className="text-sm text-destructive">{fieldErrors.username}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="8자 이상"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (touched.password) validateField('password', e.target.value)
                }}
                onBlur={() => handleBlur('password')}
                className={cn(hasError('password') && 'border-destructive focus-visible:ring-destructive')}
                minLength={8}
                autoComplete="new-password"
              />
              {hasError('password') && (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                비밀번호 확인
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (touched.confirmPassword) validateField('confirmPassword', e.target.value)
                }}
                onBlur={() => handleBlur('confirmPassword')}
                className={cn(hasError('confirmPassword') && 'border-destructive focus-visible:ring-destructive')}
                autoComplete="new-password"
              />
              {hasError('confirmPassword') && (
                <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground text-center">
              회원가입 시{' '}
              <Link to="/terms" className="text-primary hover:underline">
                이용약관
              </Link>
              {' '}및{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                개인정보처리방침
              </Link>
              에 동의하게 됩니다.
            </p>
            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? '가입 중...' : '회원가입'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-primary hover:underline">
                로그인
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  )
}
