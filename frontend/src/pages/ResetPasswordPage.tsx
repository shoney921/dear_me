import { useState, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/error'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'

interface FieldErrors {
  password?: string
  confirmPassword?: string
}

type PageState = 'form' | 'success' | 'error'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [pageState, setPageState] = useState<PageState>(token ? 'form' : 'error')
  const [errorMessage, setErrorMessage] = useState(token ? '' : '유효하지 않은 링크입니다.')
  const submittedRef = useRef(false)

  const mutation = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      setPageState('success')
    },
    onError: (err) => {
      setPageState('error')
      setErrorMessage(getApiErrorMessage(err))
    },
  })

  const validateField = (field: string, value: string) => {
    const errors: FieldErrors = { ...fieldErrors }

    switch (field) {
      case 'password':
        if (!value.trim()) {
          errors.password = '새 비밀번호를 입력해주세요.'
        } else if (value.length < 8) {
          errors.password = '비밀번호는 8자 이상이어야 합니다.'
        } else {
          delete errors.password
        }
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
  }

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })
    validateField(field, field === 'password' ? password : confirmPassword)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // StrictMode 중복 제출 방지
    if (submittedRef.current) return

    setTouched({ password: true, confirmPassword: true })

    const errors: FieldErrors = {}

    if (!password.trim()) {
      errors.password = '새 비밀번호를 입력해주세요.'
    } else if (password.length < 8) {
      errors.password = '비밀번호는 8자 이상이어야 합니다.'
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = '비밀번호 확인을 입력해주세요.'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    }

    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) return

    submittedRef.current = true
    mutation.mutate({ token: token!, password })
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
            <CardTitle className="text-2xl">비밀번호 재설정</CardTitle>
            <CardDescription>
              {pageState === 'form' && '새로운 비밀번호를 입력해주세요'}
              {pageState === 'success' && '비밀번호 변경 완료'}
              {pageState === 'error' && '비밀번호 재설정 실패'}
            </CardDescription>
          </CardHeader>

          {pageState === 'success' && (
            <>
              <CardContent className="flex flex-col items-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium text-green-700 mb-2">변경 완료!</p>
                <p className="text-muted-foreground text-center">
                  비밀번호가 성공적으로 변경되었습니다.<br />
                  새 비밀번호로 로그인해주세요.
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link to="/login" className="w-full">
                  <Button className="w-full">로그인하기</Button>
                </Link>
              </CardFooter>
            </>
          )}

          {pageState === 'error' && (
            <>
              <CardContent className="flex flex-col items-center py-8">
                <XCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-lg font-medium text-destructive mb-2">재설정 실패</p>
                <p className="text-muted-foreground text-center">{errorMessage}</p>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 items-center">
                <Link to="/forgot-password" className="w-full">
                  <Button className="w-full" variant="outline">다시 요청하기</Button>
                </Link>
                <Link to="/login" className="text-sm text-primary hover:underline">
                  로그인으로 돌아가기
                </Link>
              </CardFooter>
            </>
          )}

          {pageState === 'form' && (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    새 비밀번호
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
                    autoFocus
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? '변경 중...' : '비밀번호 변경'}
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
