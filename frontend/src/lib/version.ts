/**
 * 앱 버전 관리
 * 배포 시 버전이 변경되면 localStorage를 초기화하여 토큰 불일치 문제 방지
 */

// 버전이 변경될 때마다 이 값을 업데이트하세요
// 예: "1.0.0" -> "1.0.1" (배포 시)
export const APP_VERSION = '1.1.4'

const VERSION_KEY = 'app_version'

/**
 * 현재 앱 버전과 저장된 버전을 비교하여 버전이 변경되었는지 확인
 * 버전이 변경되었으면 localStorage를 초기화
 */
export function checkAndUpdateVersion(): boolean {
  const storedVersion = localStorage.getItem(VERSION_KEY)

  if (storedVersion !== APP_VERSION) {
    console.log(`[Version] 앱 버전 변경 감지: ${storedVersion} -> ${APP_VERSION}`)

    // 버전이 변경되었으면 localStorage 초기화 (토큰, 캐시 등)
    const keysToKeep = ['theme'] // 유지할 키가 있다면 여기에 추가
    const storage: Record<string, string> = {}

    keysToKeep.forEach(key => {
      const value = localStorage.getItem(key)
      if (value) storage[key] = value
    })

    // 전체 초기화
    localStorage.clear()

    // 유지할 데이터 복원
    Object.entries(storage).forEach(([key, value]) => {
      localStorage.setItem(key, value)
    })

    // 새 버전 저장
    localStorage.setItem(VERSION_KEY, APP_VERSION)

    return true // 버전 변경됨
  }

  return false // 버전 동일
}

/**
 * 앱 초기화 시 호출
 */
export function initVersion(): void {
  const versionChanged = checkAndUpdateVersion()

  if (versionChanged) {
    console.log('[Version] localStorage 초기화 완료')
  }
}
