import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">개인정보처리방침</h1>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="text-muted-foreground">최종 수정일: 2026년 1월 26일</p>

        <h2>1. 개인정보의 수집 및 이용 목적</h2>
        <p>DearMe(이하 "서비스")는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
        <ul>
          <li><strong>회원 관리</strong>: 회원제 서비스 이용에 따른 본인확인, 개인 식별</li>
          <li><strong>서비스 제공</strong>: 일기 작성, AI 페르소나 생성, 채팅 서비스 제공</li>
          <li><strong>서비스 개선</strong>: 서비스 이용 통계 분석, 서비스 품질 향상</li>
        </ul>

        <h2>2. 수집하는 개인정보 항목</h2>
        <h3>필수 수집 항목</h3>
        <ul>
          <li>이메일 주소</li>
          <li>사용자명(닉네임)</li>
          <li>비밀번호(암호화하여 저장)</li>
        </ul>
        <h3>서비스 이용 과정에서 생성되는 정보</h3>
        <ul>
          <li>일기 내용 및 작성일</li>
          <li>감정 및 날씨 태그</li>
          <li>페르소나 정보</li>
          <li>채팅 내역</li>
          <li>서비스 이용 기록</li>
        </ul>

        <h2>3. 개인정보의 보유 및 이용 기간</h2>
        <p>회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
        <ul>
          <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
          <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
          <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
        </ul>

        <h2>4. 개인정보의 제3자 제공</h2>
        <p>DearMe는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다:</p>
        <ul>
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
        </ul>

        <h2>5. 개인정보처리의 위탁</h2>
        <p>DearMe는 서비스 향상을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다:</p>
        <ul>
          <li><strong>OpenAI</strong>: AI 페르소나 생성 및 대화 응답 생성 (일기 내용 분석)</li>
        </ul>
        <p className="text-destructive font-medium">
          * 중요: AI 서비스 제공을 위해 일기 내용이 OpenAI에 전송될 수 있습니다.
          OpenAI는 API를 통해 전송된 데이터를 모델 학습에 사용하지 않습니다.
        </p>

        <h2>6. 정보주체의 권리·의무 및 행사방법</h2>
        <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다:</p>
        <ul>
          <li>개인정보 열람 요구</li>
          <li>오류 등이 있을 경우 정정 요구</li>
          <li>삭제 요구</li>
          <li>처리정지 요구</li>
        </ul>
        <p>권리 행사는 서비스 내 설정 또는 이메일을 통해 가능합니다.</p>

        <h2>7. 개인정보 보호를 위한 기술적·관리적 대책</h2>
        <ul>
          <li>비밀번호 암호화 저장 (bcrypt)</li>
          <li>SSL/TLS를 통한 데이터 암호화 전송</li>
          <li>접근 권한 관리</li>
          <li>정기적인 보안 점검</li>
        </ul>

        <h2>8. 개인정보 보호책임자</h2>
        <p>개인정보 보호 관련 문의는 아래로 연락해 주세요:</p>
        <ul>
          <li>이메일: privacy@dearme.app</li>
        </ul>

        <h2>9. 개인정보처리방침 변경</h2>
        <p>본 방침은 관련 법령 및 지침, 서비스 변경사항을 반영하여 변경될 수 있습니다. 변경 시 서비스 내 공지를 통해 알려드립니다.</p>
      </div>
    </div>
  )
}
