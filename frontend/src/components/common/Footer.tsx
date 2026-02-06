import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-border/20 py-3 px-4">
      <div className="text-center text-[10px] text-muted-foreground/50 whitespace-nowrap overflow-hidden">
        <p>
          듀와이브(dewibe) | 대표 이상헌 | 사업자등록번호 767-40-01715 | 통신판매업신고 준비중 | 서울특별시 마포구 와우산로 178, 503 | 01066876050 | <Link to="/privacy" className="underline hover:text-muted-foreground">개인정보처리방침</Link> | <Link to="/terms" className="underline hover:text-muted-foreground">이용약관</Link>
        </p>
      </div>
    </footer>
  )
}
