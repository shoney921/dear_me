# DearMe UX/UI 개선 제안서

> 현재 프론트엔드 코드 분석을 바탕으로 작성된 사용자 경험 개선 제안입니다.

---

## 목차

1. [높은 우선순위 개선](#1-높은-우선순위-개선)
2. [중간 우선순위 개선](#2-중간-우선순위-개선)
3. [낮은 우선순위 개선](#3-낮은-우선순위-개선)
4. [현재 잘 구현된 부분](#4-현재-잘-구현된-부분)

---

## 1. 높은 우선순위 개선

### 1.1 Toast/Snackbar 알림 시스템 도입

**현재 문제점:**
- 성공/에러 메시지가 페이지 내 고정 위치에 표시되어 스크롤 시 보이지 않음
- 성공 메시지 자동 해제 기능 없음 (수동으로 페이지 이동해야 사라짐)
- 친구 요청 전송, 일기 저장 등의 액션 완료 피드백이 약함

**개선 방안:**
```
추천 라이브러리: sonner 또는 react-hot-toast
- 화면 하단/상단에 고정된 토스트 메시지
- 자동 해제 (3-5초)
- 액션 버튼 포함 가능 (예: "실행 취소")
```

**적용 위치:**
- 일기 저장/수정/삭제 완료
- 친구 요청 전송/수락/거절
- 페르소나 생성/재생성 완료
- 알림 읽음 처리
- 설정 변경 저장

---

### 1.2 확인 다이얼로그 개선

**현재 문제점:**
- `window.confirm()` 사용으로 브라우저 기본 UI 표시
- 앱 디자인과 불일치
- 커스터마이징 불가 (버튼 텍스트, 아이콘 등)

**개선 방안:**
```tsx
// 커스텀 ConfirmDialog 컴포넌트 제작
<ConfirmDialog
  isOpen={showDeleteConfirm}
  title="일기 삭제"
  description="정말 이 일기를 삭제하시겠습니까? 삭제된 일기는 복구할 수 없습니다."
  confirmText="삭제"
  cancelText="취소"
  variant="destructive"
  onConfirm={handleDelete}
  onCancel={() => setShowDeleteConfirm(false)}
/>
```

**적용 위치:**
- 일기 삭제 (`DiaryDetailPage.tsx`)
- 친구 삭제 (`FriendListPage.tsx`)
- 채팅 삭제 (`PersonaChatPage.tsx`)
- 알림 삭제 (`NotificationListPage.tsx`)
- 페르소나 재생성 (`PersonaPage.tsx`)

---

### 1.3 스켈레톤 로딩 UI

**현재 문제점:**
- 모든 페이지에서 동일한 `PageLoading` (회전 스피너) 사용
- 콘텐츠 레이아웃을 예측할 수 없어 로딩 후 화면 점프 발생
- 사용자가 무엇이 로딩되는지 알 수 없음

**개선 방안:**
```tsx
// 일기 카드 스켈레톤
<div className="animate-pulse">
  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
  <div className="h-4 bg-gray-200 rounded w-5/6" />
</div>
```

**적용 위치:**
- 일기 목록 (`DiaryListPage.tsx`)
- 친구 목록 (`FriendListPage.tsx`)
- 알림 목록 (`NotificationListPage.tsx`)
- 채팅 메시지 영역 (`PersonaChatPage.tsx`)
- 통계 차트 (`DiaryStatsPage.tsx`)

---

### 1.4 폼 유효성 검사 UX 개선

**현재 문제점:**
- 에러 메시지가 폼 상단에만 표시됨
- 어떤 필드에 문제가 있는지 시각적으로 불명확
- 실시간 검증 없음 (제출 시에만 검증)

**개선 방안:**
```tsx
// 필드별 에러 표시
<div className="space-y-2">
  <Label htmlFor="email">이메일</Label>
  <Input
    id="email"
    className={errors.email ? "border-destructive" : ""}
  />
  {errors.email && (
    <p className="text-sm text-destructive">{errors.email}</p>
  )}
</div>

// 실시간 검증 (onBlur)
<Input
  onBlur={() => validateEmail(email)}
/>
```

**적용 위치:**
- 로그인 폼 (`LoginPage.tsx`)
- 회원가입 폼 (`RegisterPage.tsx`)
- 일기 작성 폼 (`DiaryNewPage.tsx`)
- 페르소나 커스터마이징 (`PersonaCustomizeModal.tsx`)

---

### 1.5 빈 입력 방지 및 가이드

**현재 문제점:**
- 채팅 입력창에서 빈 메시지 전송 시 아무 반응 없음
- 검색창에서 빈 검색어로 검색 시 불필요한 API 호출
- 사용자가 왜 동작하지 않는지 모름

**개선 방안:**
```tsx
// 비활성화 상태 시각화 + 툴팁
<Button
  disabled={!message.trim()}
  title={!message.trim() ? "메시지를 입력해주세요" : "전송"}
>
  <Send />
</Button>

// 또는 빈 상태 안내
{!message.trim() && (
  <p className="text-xs text-muted-foreground">
    메시지를 입력하면 전송할 수 있습니다
  </p>
)}
```

---

## 2. 중간 우선순위 개선

### 2.1 키보드 접근성 강화

**현재 문제점:**
- 모달에서 Tab 키가 모달 외부로 이동 가능 (포커스 트래핑 없음)
- ESC 키로 모달 닫기는 구현되어 있으나 포커스 복원 없음
- 드롭다운, 태그 선택 등에서 키보드 네비게이션 미지원

**개선 방안:**
```tsx
// 모달 포커스 트래핑
import { FocusTrap } from '@headlessui/react'

<FocusTrap>
  <Modal>
    {/* 모달 내용 */}
  </Modal>
</FocusTrap>

// Enter 키 지원 (태그 선택)
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleSelect(item)
    }
  }}
>
```

**적용 위치:**
- `Modal.tsx` 컴포넌트
- `PersonaSettingsModal.tsx`
- `PersonaCustomizeModal.tsx`
- 기분/날씨 태그 선택 버튼들

---

### 2.2 로딩 상태 세분화

**현재 문제점:**
- 페르소나 생성 시 "페르소나 생성 중..." 만 표시
- AI 처리 시간이 길어도 진행 상황을 알 수 없음
- 사용자가 작업이 멈춘 건지 진행 중인지 구분 어려움

**개선 방안:**
```tsx
// 단계별 진행 표시
const [generationStep, setGenerationStep] = useState<
  'analyzing' | 'generating' | 'finalizing'
>('analyzing')

const stepMessages = {
  analyzing: '일기를 분석하고 있어요...',
  generating: '페르소나를 생성하고 있어요...',
  finalizing: '마무리하고 있어요...',
}

<div className="flex flex-col items-center gap-2">
  <Loading size="lg" />
  <p>{stepMessages[generationStep]}</p>
  <Progress value={progressPercent} />
</div>
```

**적용 위치:**
- 페르소나 생성/재생성 (`PersonaPage.tsx`)
- 캐릭터 이미지 생성 (`CharacterPage.tsx`)
- AI 일기 주제 추천 (`DiaryNewPage.tsx`)

---

### 2.3 오프라인/네트워크 상태 표시

**현재 문제점:**
- 네트워크 연결 끊김 시 에러만 표시
- 오프라인 상태에서 작성 중인 데이터 손실 가능
- 재연결 후 자동 재시도 없음

**개선 방안:**
```tsx
// 네트워크 상태 감지
const isOnline = useOnlineStatus()

{!isOnline && (
  <div className="fixed bottom-4 left-4 right-4 bg-amber-100
                  border border-amber-300 rounded-lg p-3 z-50">
    <p className="text-amber-800">
      인터넷 연결이 끊겼습니다. 연결 후 다시 시도해주세요.
    </p>
  </div>
)}

// TanStack Query 재시도 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})
```

---

### 2.4 Pull-to-Refresh (모바일)

**현재 문제점:**
- 모바일에서 새로고침하려면 브라우저 새로고침 필요
- 데이터 갱신이 불편함

**개선 방안:**
```tsx
// 커스텀 Pull-to-Refresh 또는 라이브러리 사용
import { PullToRefresh } from 'react-js-pull-to-refresh'

<PullToRefresh
  onRefresh={async () => {
    await queryClient.invalidateQueries(['diaries'])
  }}
>
  <DiaryList />
</PullToRefresh>
```

**적용 위치:**
- 일기 목록
- 친구 목록
- 알림 목록

---

### 2.5 무한 스크롤 또는 더보기

**현재 문제점:**
- 페이지네이션 버튼으로만 이동 가능
- 많은 일기가 있을 때 탐색이 번거로움
- 모바일에서 작은 페이지 버튼 클릭이 어려움

**개선 방안:**
```tsx
// 무한 스크롤
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery({
    queryKey: ['diaries'],
    queryFn: ({ pageParam = 1 }) => diaryService.getDiaries(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })

// Intersection Observer로 자동 로드
<div ref={loadMoreRef}>
  {isFetchingNextPage && <Loading />}
</div>
```

**적용 위치:**
- 일기 목록 (`DiaryListPage.tsx`)
- 채팅 메시지 히스토리 (`PersonaChatPage.tsx`)
- 알림 목록 (`NotificationListPage.tsx`)

---

### 2.6 다크 모드 지원

**현재 문제점:**
- 라이트 모드만 지원
- 야간 사용자에게 눈 피로 유발
- 시스템 설정 반영 안됨

**개선 방안:**
```tsx
// tailwind.config.js
module.exports = {
  darkMode: 'class', // 또는 'media'
}

// ThemeProvider 구현
const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

useEffect(() => {
  const root = document.documentElement
  if (theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}, [theme])

// 컴포넌트에서 사용
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
```

---

### 2.7 입력 자동 저장 (Draft)

**현재 문제점:**
- 일기 작성 중 실수로 페이지 이탈 시 내용 손실
- 긴 일기 작성 중 브라우저 충돌 시 복구 불가

**개선 방안:**
```tsx
// localStorage에 임시 저장
useEffect(() => {
  const draft = { title, content, mood, weather }
  localStorage.setItem('diary-draft', JSON.stringify(draft))
}, [title, content, mood, weather])

// 페이지 진입 시 복구 확인
useEffect(() => {
  const draft = localStorage.getItem('diary-draft')
  if (draft) {
    const parsed = JSON.parse(draft)
    if (window.confirm('작성 중이던 일기가 있습니다. 불러올까요?')) {
      setTitle(parsed.title)
      setContent(parsed.content)
      // ...
    }
  }
}, [])

// 저장 완료 시 draft 삭제
onSuccess: () => {
  localStorage.removeItem('diary-draft')
}
```

**적용 위치:**
- 일기 작성 (`DiaryNewPage.tsx`)
- 일기 수정 (`DiaryDetailPage.tsx`)

---

## 3. 낮은 우선순위 개선

### 3.1 애니메이션 및 트랜지션

**현재 문제점:**
- 페이지 전환 시 즉각적인 변화로 어색함
- 카드 호버 외 인터랙션 애니메이션 부족

**개선 방안:**
```tsx
// 페이지 전환 애니메이션 (framer-motion)
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.2 }}
>
  <PageContent />
</motion.div>

// 리스트 아이템 애니메이션
{items.map((item, i) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: i * 0.05 }}
  >
    <ListItem item={item} />
  </motion.div>
))}
```

---

### 3.2 검색 기능 개선

**현재 문제점:**
- 친구 검색만 존재, 일기 검색 없음
- 실시간 검색 (debounce) 미적용
- 검색 결과 하이라이팅 없음

**개선 방안:**
```tsx
// 일기 검색 기능 추가
const [searchQuery, setSearchQuery] = useState('')
const debouncedQuery = useDebounce(searchQuery, 300)

const { data: searchResults } = useQuery({
  queryKey: ['diaries', 'search', debouncedQuery],
  queryFn: () => diaryService.search(debouncedQuery),
  enabled: debouncedQuery.length >= 2,
})

// 검색어 하이라이팅
const highlightText = (text: string, query: string) => {
  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200">{part}</mark>
      : part
  )
}
```

---

### 3.3 날짜 선택기 개선

**현재 문제점:**
- 기본 HTML date input 사용
- 브라우저마다 UI 다름
- 한국어 로케일 미적용

**개선 방안:**
```tsx
// react-day-picker 또는 date-fns 활용
import { DayPicker } from 'react-day-picker'
import { ko } from 'date-fns/locale'

<DayPicker
  locale={ko}
  mode="single"
  selected={selectedDate}
  onSelect={setSelectedDate}
  disabled={(date) => date > new Date()}
/>
```

---

### 3.4 이미지 미리보기 및 확대

**현재 문제점:**
- 캐릭터 이미지 클릭해도 확대 안됨
- 작은 썸네일로만 확인 가능

**개선 방안:**
```tsx
// Lightbox 컴포넌트
const [isLightboxOpen, setIsLightboxOpen] = useState(false)

<img
  src={characterImage}
  onClick={() => setIsLightboxOpen(true)}
  className="cursor-zoom-in"
/>

{isLightboxOpen && (
  <div
    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    onClick={() => setIsLightboxOpen(false)}
  >
    <img
      src={characterImage}
      className="max-w-[90vw] max-h-[90vh] object-contain"
    />
  </div>
)}
```

---

### 3.5 접근성 (A11y) 심화

**현재 문제점:**
- ARIA 라벨 부족
- 스크린 리더 지원 제한적
- 색상만으로 상태 구분 (색맹 사용자 고려 부족)

**개선 방안:**
```tsx
// ARIA 라벨 추가
<Button aria-label="알림 목록 열기">
  <Bell />
  <span className="sr-only">읽지 않은 알림 {unreadCount}개</span>
</Button>

// 색상 + 아이콘으로 상태 표시
<div className="flex items-center gap-2">
  <CheckCircle className="text-green-500" />
  <span>완료</span>
</div>

// 포커스 가시성 강화
<button className="focus:ring-2 focus:ring-offset-2 focus:ring-primary">
```

---

### 3.6 에러 바운더리

**현재 문제점:**
- 컴포넌트 에러 시 전체 앱 크래시
- 사용자에게 복구 방법 안내 없음

**개선 방안:**
```tsx
// ErrorBoundary 컴포넌트
class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2>문제가 발생했습니다</h2>
          <p>페이지를 새로고침해주세요.</p>
          <Button onClick={() => window.location.reload()}>
            새로고침
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
```

---

## 4. 현재 잘 구현된 부분

다음 항목들은 이미 잘 구현되어 있으므로 유지하면 됩니다:

### 4.1 폼 검증 다층 방어
- HTML 속성 검증 (`required`, `minLength`, `maxLength`)
- 클라이언트 JavaScript 검증
- 서버 에러 메시지 한국어 번역 (`lib/error.ts`)

### 4.2 로딩 상태 표시
- 버튼 텍스트 변경 ("로그인" → "로그인 중...")
- 버튼 `disabled` 상태
- 인라인 로딩 아이콘 (`animate-spin`)

### 4.3 빈 상태 (Empty State)
- 아이콘 + 제목 + 설명 + CTA 패턴 일관성
- 중앙 정렬 레이아웃
- 다음 행동 유도

### 4.4 반응형 디자인
- Tailwind CSS 반응형 클래스 활용 (`sm:`, `md:`, `lg:`)
- 모바일 우선 설계
- 그리드 레이아웃 적절한 사용

### 4.5 포커스 표시
- `focus-visible:ring-2` 클래스로 키보드 포커스 시각화
- 버튼, 입력 필드에 일관되게 적용

### 4.6 에러 메시지 UX
- 빨간색 배경으로 명확한 시각적 구분
- 구체적인 한국어 에러 메시지
- API 에러 코드별 적절한 메시지 매핑

---

## 구현 우선순위 요약

| 순위 | 항목 | 예상 효과 | 난이도 |
|------|------|----------|--------|
| 1 | Toast 알림 시스템 | 즉각적인 피드백 개선 | 낮음 |
| 2 | 확인 다이얼로그 커스텀 | 앱 일관성 향상 | 낮음 |
| 3 | 스켈레톤 로딩 | 체감 속도 개선 | 중간 |
| 4 | 필드별 유효성 에러 | 폼 UX 개선 | 중간 |
| 5 | 모달 포커스 트래핑 | 접근성 향상 | 낮음 |
| 6 | 로딩 단계 표시 | AI 작업 투명성 | 중간 |
| 7 | 다크 모드 | 사용자 선호 반영 | 중간 |
| 8 | 임시 저장 | 데이터 손실 방지 | 낮음 |
| 9 | 무한 스크롤 | 탐색 편의성 | 높음 |
| 10 | 애니메이션 | 시각적 완성도 | 중간 |

---

## 참고 라이브러리

| 기능 | 추천 라이브러리 |
|------|----------------|
| Toast | `sonner`, `react-hot-toast` |
| 폼 검증 | `react-hook-form` + `zod` |
| 애니메이션 | `framer-motion` |
| 날짜 선택 | `react-day-picker` |
| 접근성 | `@headlessui/react` |
| 무한 스크롤 | `@tanstack/react-query` (built-in) |

---

*문서 작성일: 2024년 1월*
*작성자: Claude Code*
