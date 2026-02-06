import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function PaymentPolicyPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">결제 및 환불 정책</h1>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
        <p className="text-muted-foreground">최종 수정일: 2026년 2월 6일</p>

        <section>
          <h2>제1조 (목적)</h2>
          <p>
            본 정책은 DearMe(이하 "서비스")가 제공하는 유료 서비스의 결제, 환불 및
            구독 관리에 관한 이용자의 권리와 의무를 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2>제2조 (유료 서비스의 종류 및 요금)</h2>
          <ol>
            <li>서비스는 다음과 같은 유료 구독 플랜을 제공합니다:
              <ul>
                <li><strong>프리미엄 월간</strong>: ₩4,900 / 30일</li>
                <li><strong>프리미엄 연간</strong>: ₩39,900 / 365일</li>
              </ul>
            </li>
            <li>각 플랜의 요금 및 제공 기능은 서비스 내 프리미엄 페이지에서 확인할 수 있습니다.</li>
            <li>회사는 요금을 변경할 수 있으며, 변경 시 최소 30일 전에 공지합니다. 기존 구독 중인 이용자에게는 현재 구독 기간 만료 시점부터 변경된 요금이 적용됩니다.</li>
          </ol>
        </section>

        <section>
          <h2>제3조 (결제 방법)</h2>
          <ol>
            <li>이용자는 다음과 같은 방법으로 유료 서비스 요금을 결제할 수 있습니다:
              <ul>
                <li>신용카드 / 체크카드</li>
                <li>간편결제 (카카오페이, 네이버페이, 토스페이 등)</li>
                <li>기타 회사가 정하는 결제 수단</li>
              </ul>
            </li>
            <li>결제 통화는 대한민국 원(KRW)입니다.</li>
          </ol>
        </section>

        <section>
          <h2>제4조 (서비스 제공 시기)</h2>
          <ol>
            <li>유료 서비스는 결제 완료 즉시 활성화됩니다.</li>
            <li>기술적 사유로 즉시 활성화되지 않는 경우, 결제 완료 후 24시간 이내에 프리미엄 기능이 제공됩니다.</li>
            <li>24시간이 경과하여도 서비스가 제공되지 않는 경우, 이용자는 전액 환불을 요청할 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2>제5조 (청약철회 및 환불)</h2>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
            <p className="font-semibold text-blue-800 dark:text-blue-300">환불 안내</p>
            <ol className="text-blue-700 dark:text-blue-400">
              <li>이용자는 결제일로부터 7일 이내에 유료 서비스를 이용하지 않은 경우 전액 환불을 요청할 수 있습니다.</li>
              <li>결제일로부터 7일 이내라도 유료 서비스를 이용한 경우, 이용 일수를 차감한 금액을 일할 계산하여 환불합니다.</li>
              <li>결제일로부터 7일이 경과한 경우, 남은 이용 기간에 대해 일할 계산하여 환불합니다.</li>
            </ol>
          </div>
          <p className="mt-4">다음의 경우에는 환불이 제한됩니다:</p>
          <ul>
            <li>이용자의 귀책사유로 서비스 이용이 제한된 경우</li>
            <li>이용 기간이 만료된 경우</li>
            <li>무료 프로모션 또는 이벤트로 제공된 서비스</li>
          </ul>
        </section>

        <section>
          <h2>제6조 (구독 취소)</h2>
          <ol>
            <li>이용자는 구독 기간 중 언제든지 구독을 취소할 수 있습니다.</li>
            <li>구독 취소 시, 이미 결제된 구독 기간의 만료일까지 프리미엄 기능을 계속 이용할 수 있습니다 (유예 기간).</li>
            <li>유예 기간이 종료되면 자동으로 무료 플랜으로 전환됩니다.</li>
            <li>유예 기간 중 다시 구독하면 남은 기간이 보존됩니다.</li>
          </ol>
        </section>

        <section>
          <h2>제7조 (교환)</h2>
          <p>
            본 서비스는 디지털 콘텐츠 서비스의 특성상 교환이 불가합니다.
            다만, 구독 기간 중 다른 플랜(월간 ↔ 연간)으로의 변경을 원하는 경우,
            기존 구독을 취소하고 새 플랜으로 재구독할 수 있습니다.
          </p>
        </section>

        <section>
          <h2>제8조 (서비스 장애 시 보상)</h2>
          <ol>
            <li>회사의 귀책사유로 24시간 이상 연속하여 서비스가 중단된 경우, 해당 중단 기간만큼 이용 기간을 무상으로 연장합니다.</li>
            <li>서비스 장애에 대한 보상은 유료 구독 이용자에 한합니다.</li>
            <li>천재지변, 불가항력적 사유에 의한 서비스 중단은 보상 대상에서 제외됩니다.</li>
          </ol>
        </section>

        <section>
          <h2>제9조 (환불 절차)</h2>
          <ol>
            <li>환불을 원하는 이용자는 고객센터 이메일(support@dearme.app)로 환불 요청을 접수합니다.</li>
            <li>환불 요청 시 다음 정보를 포함해야 합니다:
              <ul>
                <li>가입 이메일 주소</li>
                <li>결제일 및 결제 금액</li>
                <li>환불 사유</li>
              </ul>
            </li>
            <li>환불 요청은 접수 후 3영업일 이내에 처리됩니다.</li>
            <li>환불 금액은 원래 결제 수단으로 반환되며, 결제 수단별 환불 소요 기간은 다음과 같습니다:
              <ul>
                <li>신용카드: 3~7영업일</li>
                <li>체크카드: 3~5영업일</li>
                <li>간편결제: 1~3영업일</li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2>제10조 (기타)</h2>
          <ol>
            <li>본 정책에서 정하지 않은 사항은 전자상거래 등에서의 소비자보호에 관한 법률, 콘텐츠산업 진흥법 등 관련 법령에 따릅니다.</li>
            <li>본 정책과 이용약관이 상충하는 경우, 결제 및 환불에 관해서는 본 정책이 우선 적용됩니다.</li>
          </ol>
        </section>

        <section>
          <h2>부칙</h2>
          <p>본 정책은 2026년 2월 6일부터 시행됩니다.</p>
        </section>
      </div>
    </div>
  )
}
