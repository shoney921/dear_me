import type { AxiosError } from 'axios'

interface ApiErrorResponse {
  detail?: string | Array<{ msg: string; loc: string[] }>
}

/**
 * API 에러를 사용자 친화적인 한국어 메시지로 변환
 */
export function getApiErrorMessage(error: unknown): string {
  // Axios 에러가 아닌 경우
  if (!isAxiosError(error)) {
    return '알 수 없는 오류가 발생했습니다.'
  }

  // 네트워크 에러
  if (!error.response) {
    return '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.'
  }

  const status = error.response.status
  const data = error.response.data as ApiErrorResponse
  const detail = data?.detail

  // 상태 코드별 처리
  switch (status) {
    case 400:
      return translateErrorDetail(detail) || '잘못된 요청입니다.'
    case 401:
      return '인증에 실패했습니다. 다시 로그인해주세요.'
    case 403:
      return translateErrorDetail(detail) || '접근 권한이 없습니다.'
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.'
    case 409:
      return '이미 존재하는 데이터입니다.'
    case 422:
      // Validation error
      if (Array.isArray(detail)) {
        return detail.map((e) => e.msg).join(', ')
      }
      return '입력값이 올바르지 않습니다.'
    case 429:
      return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    case 500:
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    case 503:
      return '서비스를 일시적으로 사용할 수 없습니다.'
    default:
      return translateErrorDetail(detail) || '요청을 처리하는 중 오류가 발생했습니다.'
  }
}

/**
 * 백엔드 에러 메시지를 한국어로 번역
 */
function translateErrorDetail(detail: string | Array<{ msg: string }> | undefined): string | null {
  if (!detail) return null

  if (Array.isArray(detail)) {
    return detail.map((e) => e.msg).join(', ')
  }

  // 영문 에러 메시지 번역
  const translations: Record<string, string> = {
    'Incorrect email or password': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'Inactive user': '비활성화된 계정입니다. 관리자에게 문의해주세요.',
    'Email already registered': '이미 등록된 이메일입니다.',
    'Username already taken': '이미 사용 중인 사용자명입니다.',
    'Diary already exists for this date': '해당 날짜에 이미 일기가 존재합니다.',
    'Cannot write diary for future dates': '미래 날짜에는 일기를 작성할 수 없습니다.',
    'Cannot write diary for dates older than 3 days': '3일 이전의 날짜에는 일기를 작성할 수 없습니다.',
    'Diary not found': '일기를 찾을 수 없습니다.',
    'Persona not found': '페르소나를 찾을 수 없습니다.',
    'Persona already exists': '이미 페르소나가 존재합니다.',
    'Chat not found': '채팅을 찾을 수 없습니다.',
    'User not found': '사용자를 찾을 수 없습니다.',
    'Already friends': '이미 친구입니다.',
    'Friend request already exists': '이미 친구 요청을 보냈습니다.',
    'Cannot send friend request to yourself': '자기 자신에게는 친구 요청을 보낼 수 없습니다.',
    'Friend request not found': '친구 요청을 찾을 수 없습니다.',
    'Friendship not found': '친구 관계를 찾을 수 없습니다.',
    'You can only view persona of your friends': '친구의 페르소나만 볼 수 있습니다.',
    'You can only chat with persona of your friends': '친구의 페르소나와만 대화할 수 있습니다.',
    'Friend does not have a persona yet': '친구가 아직 페르소나를 생성하지 않았습니다.',
    'Use /personas/me endpoint for your own persona': '내 페르소나는 다른 방법으로 조회해주세요.',
    // 이메일 인증 관련
    'Email not verified': '이메일 인증이 필요합니다. 이메일을 확인해주세요.',
    'Invalid or expired verification token': '인증 링크가 만료되었거나 유효하지 않습니다.',
    'Please wait before requesting another verification email': '잠시 후 다시 시도해주세요.',
    // 비밀번호 초기화 관련
    'Invalid or expired password reset token': '비밀번호 초기화 링크가 만료되었거나 유효하지 않습니다.',
    'Please wait before requesting another password reset email': '잠시 후 다시 시도해주세요.',
    // 구독 관련
    'Subscription not found': '구독 정보를 찾을 수 없습니다.',
    'Cannot cancel free plan': '무료 플랜은 취소할 수 없습니다.',
    'Premium subscription required for this feature': '이 기능은 프리미엄 구독이 필요합니다.',
    'Subscription already cancelled': '이미 취소된 구독입니다.',
    'Subscription already expired': '이미 만료된 구독입니다.',
    'Invalid subscription period': '유효하지 않은 구독 기간입니다.',
    // Rate Limiting
    'Too many requests. Please try again later.': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  }

  return translations[detail] || detail
}

/**
 * Axios 에러 타입 가드
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  )
}
