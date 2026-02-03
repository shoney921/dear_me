import json
import logging
from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.constants.prompts import (
    MENTAL_ANALYSIS_PROMPT,
    FEEDBACK_GENERATION_PROMPT,
    BOOK_RECOMMENDATION_PROMPT,
    MENTAL_REPORT_INSIGHTS_PROMPT,
)
from app.models.diary import Diary
from app.models.mental_analysis import MentalAnalysis, OverallStatus
from app.models.mental_report import MentalReport, ReportType, TrendType
from app.models.user import User

logger = logging.getLogger(__name__)


class MentalService:
    def __init__(self, db: Session):
        self.db = db

    async def analyze_diary(self, user: User, diary: Diary) -> MentalAnalysis:
        """일기를 분석하여 멘탈 분석 결과 생성"""
        analysis_data = await self._analyze_with_ai(diary)

        analysis = MentalAnalysis(
            user_id=user.id,
            diary_id=diary.id,
            emotional_stability_score=analysis_data.get("emotional_stability_score", 50),
            vitality_score=analysis_data.get("vitality_score", 50),
            self_esteem_score=analysis_data.get("self_esteem_score", 50),
            positivity_score=analysis_data.get("positivity_score", 50),
            social_connection_score=analysis_data.get("social_connection_score", 50),
            resilience_score=analysis_data.get("resilience_score", 50),
            overall_status=analysis_data.get("overall_status", OverallStatus.NEUTRAL.value),
            ai_analysis_raw=json.dumps(analysis_data, ensure_ascii=False),
            analysis_date=diary.diary_date,
        )

        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)

        return analysis

    async def _analyze_with_ai(self, diary: Diary) -> dict:
        """AI를 사용하여 일기 분석"""
        if not settings.OPENAI_API_KEY:
            return self._get_default_analysis()

        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            prompt = MENTAL_ANALYSIS_PROMPT.format(
                diary_date=str(diary.diary_date),
                mood=diary.mood or "없음",
                weather=diary.weather or "없음",
                title=diary.title,
                content=diary.content,
            )

            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a mental health analysis expert. Always respond in valid JSON format."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=800,
            )

            content = response.choices[0].message.content
            return json.loads(content)

        except Exception as e:
            logger.error(f"Mental analysis AI failed: {e}")
            return self._get_default_analysis()

    def _get_default_analysis(self) -> dict:
        """기본 분석 결과 (AI 실패 시)"""
        return {
            "emotional_stability_score": 50,
            "vitality_score": 50,
            "self_esteem_score": 50,
            "positivity_score": 50,
            "social_connection_score": 50,
            "resilience_score": 50,
            "overall_status": OverallStatus.NEUTRAL.value,
            "analysis_summary": "일기 분석이 완료되었습니다.",
        }

    def get_current_analysis(self, user_id: int) -> Optional[MentalAnalysis]:
        """최근 멘탈 분석 결과 조회"""
        return self.db.query(MentalAnalysis).filter(
            MentalAnalysis.user_id == user_id
        ).order_by(MentalAnalysis.created_at.desc()).first()

    def get_radar_data(self, user_id: int) -> dict:
        """레이더 차트 데이터 조회 (최적화된 단일 쿼리)"""
        # 최근 2개의 분석을 한 번에 조회
        analyses = self.db.query(MentalAnalysis).filter(
            MentalAnalysis.user_id == user_id
        ).order_by(MentalAnalysis.created_at.desc()).limit(2).all()

        if not analyses:
            return {
                "current": {
                    "emotional_stability": 50,
                    "vitality": 50,
                    "self_esteem": 50,
                    "positivity": 50,
                    "social_connection": 50,
                    "resilience": 50,
                },
                "previous": None,
                "trend": TrendType.STABLE.value,
            }

        current = analyses[0]
        previous = analyses[1] if len(analyses) > 1 else None

        current_data = {
            "emotional_stability": current.emotional_stability_score,
            "vitality": current.vitality_score,
            "self_esteem": current.self_esteem_score,
            "positivity": current.positivity_score,
            "social_connection": current.social_connection_score,
            "resilience": current.resilience_score,
        }

        previous_data = None
        if previous:
            previous_data = {
                "emotional_stability": previous.emotional_stability_score,
                "vitality": previous.vitality_score,
                "self_esteem": previous.self_esteem_score,
                "positivity": previous.positivity_score,
                "social_connection": previous.social_connection_score,
                "resilience": previous.resilience_score,
            }

        trend = self._calculate_trend(current_data, previous_data)

        return {
            "current": current_data,
            "previous": previous_data,
            "trend": trend,
        }

    def _calculate_trend(self, current: dict, previous: Optional[dict]) -> str:
        """추세 계산 (모든 지표가 높을수록 좋음)"""
        if not previous:
            return TrendType.STABLE.value

        # 모든 지표가 긍정적 (높을수록 좋음)
        all_metrics = ["emotional_stability", "vitality", "self_esteem", "positivity", "social_connection", "resilience"]

        score_diff = 0

        for metric in all_metrics:
            score_diff += current[metric] - previous[metric]

        if score_diff > 15:
            return TrendType.IMPROVING.value
        elif score_diff < -15:
            return TrendType.DECLINING.value
        else:
            return TrendType.STABLE.value

    def get_history(self, user_id: int, days: int = 30, skip: int = 0, limit: int = 30) -> dict:
        """멘탈 분석 이력 조회"""
        since_date = date.today() - timedelta(days=days)

        query = self.db.query(MentalAnalysis).filter(
            MentalAnalysis.user_id == user_id,
            MentalAnalysis.analysis_date >= since_date
        ).order_by(MentalAnalysis.analysis_date.desc())

        total = query.count()
        items = query.offset(skip).limit(limit).all()

        return {
            "items": [
                {
                    "date": item.analysis_date,
                    "overall_status": item.overall_status,
                    "emotional_stability_score": item.emotional_stability_score,
                    "vitality_score": item.vitality_score,
                    "self_esteem_score": item.self_esteem_score,
                    "positivity_score": item.positivity_score,
                    "social_connection_score": item.social_connection_score,
                    "resilience_score": item.resilience_score,
                }
                for item in items
            ],
            "total": total,
        }

    async def generate_feedback(self, analysis: MentalAnalysis) -> dict:
        """멘탈 분석 결과에 대한 피드백 생성"""
        feedback_data = await self._generate_feedback_with_ai(analysis)
        return feedback_data

    async def _generate_feedback_with_ai(self, analysis: MentalAnalysis) -> dict:
        """AI를 사용하여 피드백 생성"""
        if not settings.OPENAI_API_KEY:
            return self._get_default_feedback(analysis.overall_status)

        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            prompt = FEEDBACK_GENERATION_PROMPT.format(
                emotional_stability_score=analysis.emotional_stability_score,
                vitality_score=analysis.vitality_score,
                self_esteem_score=analysis.self_esteem_score,
                positivity_score=analysis.positivity_score,
                social_connection_score=analysis.social_connection_score,
                resilience_score=analysis.resilience_score,
                overall_status=analysis.overall_status,
            )

            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a warm and empathetic mental health counselor. Always respond in valid JSON format."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500,
            )

            content = response.choices[0].message.content
            return json.loads(content)

        except Exception as e:
            logger.error(f"Feedback generation AI failed: {e}")
            return self._get_default_feedback(analysis.overall_status)

    def _get_default_feedback(self, status: str) -> dict:
        """기본 피드백 (AI 실패 시)"""
        feedbacks = {
            OverallStatus.GOOD.value: {
                "status_label": "좋아요",
                "message": "오늘 하루가 정말 좋았나 봐요! 당신의 긍정적인 에너지가 느껴져요.",
                "encouragement": "이 좋은 기분을 오래오래 간직하세요!",
                "suggestion": None,
                "emoji": "😊",
            },
            OverallStatus.NEUTRAL.value: {
                "status_label": "괜찮아요",
                "message": "평범한 하루를 보내셨군요. 때로는 평범함도 소중한 거예요.",
                "encouragement": "내일은 더 좋은 일이 있을 거예요!",
                "suggestion": None,
                "emoji": "🙂",
            },
            OverallStatus.CONCERNING.value: {
                "status_label": "조금 힘들어 보여요",
                "message": "오늘 좀 힘드셨나 봐요. 괜찮아요, 누구나 그런 날이 있어요.",
                "encouragement": "당신은 충분히 잘하고 있어요.",
                "suggestion": "가벼운 산책이나 좋아하는 음악을 들어보는 건 어떨까요?",
                "emoji": "🤗",
            },
            OverallStatus.CRITICAL.value: {
                "status_label": "많이 지쳐 보여요",
                "message": "많이 힘드시죠? 당신의 마음이 느껴져요. 혼자 감당하지 않아도 돼요.",
                "encouragement": "당신은 소중한 사람이에요. 힘든 시간도 지나갈 거예요.",
                "suggestion": "믿을 수 있는 사람과 이야기를 나눠보세요. 전문 상담도 좋은 방법이에요.",
                "emoji": "💙",
            },
        }
        return feedbacks.get(status, feedbacks[OverallStatus.NEUTRAL.value])

    async def recommend_books(self, user_id: int) -> dict:
        """현재 멘탈 상태에 맞는 책 추천"""
        analysis = self.get_current_analysis(user_id)

        if not analysis:
            return {
                "books": [],
                "based_on_status": "unknown",
            }

        books_data = await self._recommend_books_with_ai(analysis)
        return {
            "books": books_data.get("books", []),
            "based_on_status": analysis.overall_status,
        }

    async def _recommend_books_with_ai(self, analysis: MentalAnalysis) -> dict:
        """AI를 사용하여 책 추천"""
        if not settings.OPENAI_API_KEY:
            return self._get_default_books(analysis.overall_status)

        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            prompt = BOOK_RECOMMENDATION_PROMPT.format(
                overall_status=analysis.overall_status,
                emotional_stability_score=analysis.emotional_stability_score,
                vitality_score=analysis.vitality_score,
                self_esteem_score=analysis.self_esteem_score,
                positivity_score=analysis.positivity_score,
                social_connection_score=analysis.social_connection_score,
                resilience_score=analysis.resilience_score,
            )

            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a bibliotherapy expert. Recommend real, existing books. Always respond in valid JSON format."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000,
            )

            content = response.choices[0].message.content
            return json.loads(content)

        except Exception as e:
            logger.error(f"Book recommendation AI failed: {e}")
            return self._get_default_books(analysis.overall_status)

    def _get_default_books(self, status: str) -> dict:
        """기본 책 추천 (AI 실패 시)"""
        default_books = {
            OverallStatus.GOOD.value: [
                {
                    "title": "미라클 모닝",
                    "author": "할 엘로드",
                    "description": "아침 루틴을 통해 인생을 변화시키는 방법",
                    "reason": "긍정적인 에너지를 더 확장해보세요",
                    "category": "자기계발"
                },
            ],
            OverallStatus.NEUTRAL.value: [
                {
                    "title": "오늘 밤, 세계에서 이 사랑이 사라진다 해도",
                    "author": "이치조 미사키",
                    "description": "소중한 일상의 가치를 깨닫게 하는 소설",
                    "reason": "일상의 소소한 행복을 발견해보세요",
                    "category": "소설"
                },
            ],
            OverallStatus.CONCERNING.value: [
                {
                    "title": "오늘 조금 힘들었던 당신에게",
                    "author": "김재식",
                    "description": "지친 마음을 위로하는 따뜻한 에세이",
                    "reason": "당신의 마음에 따뜻한 위로가 필요해 보여요",
                    "category": "에세이"
                },
            ],
            OverallStatus.CRITICAL.value: [
                {
                    "title": "죽고 싶지만 떡볶이는 먹고 싶어",
                    "author": "백세희",
                    "description": "우울과 함께 살아가는 이야기",
                    "reason": "비슷한 경험을 한 사람의 이야기가 위로가 될 거예요",
                    "category": "에세이"
                },
            ],
        }
        return {"books": default_books.get(status, default_books[OverallStatus.NEUTRAL.value])}

    async def generate_weekly_report(self, user_id: int) -> Optional[MentalReport]:
        """주간 리포트 생성"""
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        # 이미 해당 주간 리포트가 있는지 확인
        existing = self.db.query(MentalReport).filter(
            MentalReport.user_id == user_id,
            MentalReport.report_type == ReportType.WEEKLY.value,
            MentalReport.period_start == week_start,
        ).first()

        if existing:
            return existing

        # 해당 기간의 분석 데이터 조회
        analyses = self.db.query(MentalAnalysis).filter(
            MentalAnalysis.user_id == user_id,
            MentalAnalysis.analysis_date >= week_start,
            MentalAnalysis.analysis_date <= week_end,
        ).all()

        if not analyses:
            return None

        # 평균 계산
        avg_emotional_stability = sum(a.emotional_stability_score for a in analyses) // len(analyses)
        avg_vitality = sum(a.vitality_score for a in analyses) // len(analyses)
        avg_self_esteem = sum(a.self_esteem_score for a in analyses) // len(analyses)
        avg_positivity = sum(a.positivity_score for a in analyses) // len(analyses)
        avg_social = sum(a.social_connection_score for a in analyses) // len(analyses)
        avg_resilience = sum(a.resilience_score for a in analyses) // len(analyses)

        # 추세 계산 (이전 주와 비교)
        prev_week_start = week_start - timedelta(days=7)
        prev_week_end = week_start - timedelta(days=1)
        prev_analyses = self.db.query(MentalAnalysis).filter(
            MentalAnalysis.user_id == user_id,
            MentalAnalysis.analysis_date >= prev_week_start,
            MentalAnalysis.analysis_date <= prev_week_end,
        ).all()

        trend = TrendType.STABLE.value
        if prev_analyses:
            prev_avg_emotional_stability = sum(a.emotional_stability_score for a in prev_analyses) // len(prev_analyses)
            prev_avg_positivity = sum(a.positivity_score for a in prev_analyses) // len(prev_analyses)

            if avg_emotional_stability > prev_avg_emotional_stability + 10 or avg_positivity > prev_avg_positivity + 10:
                trend = TrendType.IMPROVING.value
            elif avg_emotional_stability < prev_avg_emotional_stability - 10 or avg_positivity < prev_avg_positivity - 10:
                trend = TrendType.DECLINING.value

        # AI 인사이트 생성
        daily_scores = [
            {
                "date": str(a.analysis_date),
                "emotional_stability": a.emotional_stability_score,
                "vitality": a.vitality_score,
                "self_esteem": a.self_esteem_score,
                "positivity": a.positivity_score,
                "social_connection": a.social_connection_score,
                "resilience": a.resilience_score,
            }
            for a in analyses
        ]

        insights_data = await self._generate_report_insights(
            report_type="주간",
            period_start=week_start,
            period_end=week_end,
            daily_scores=daily_scores,
            avg_emotional_stability=avg_emotional_stability,
            avg_vitality=avg_vitality,
            avg_self_esteem=avg_self_esteem,
            avg_positivity=avg_positivity,
            avg_social_connection=avg_social,
            avg_resilience=avg_resilience,
            trend=trend,
        )

        report = MentalReport(
            user_id=user_id,
            report_type=ReportType.WEEKLY.value,
            period_start=week_start,
            period_end=week_end,
            avg_emotional_stability_score=avg_emotional_stability,
            avg_vitality_score=avg_vitality,
            avg_self_esteem_score=avg_self_esteem,
            avg_positivity_score=avg_positivity,
            avg_social_connection_score=avg_social,
            avg_resilience_score=avg_resilience,
            trend=trend,
            insights=json.dumps(insights_data.get("insights", []), ensure_ascii=False),
            recommendations=json.dumps(insights_data.get("recommendations", []), ensure_ascii=False),
        )

        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)

        return report

    async def generate_monthly_report(self, user_id: int) -> Optional[MentalReport]:
        """월간 리포트 생성"""
        today = date.today()
        month_start = today.replace(day=1)
        if today.month == 12:
            month_end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)

        # 이미 해당 월간 리포트가 있는지 확인
        existing = self.db.query(MentalReport).filter(
            MentalReport.user_id == user_id,
            MentalReport.report_type == ReportType.MONTHLY.value,
            MentalReport.period_start == month_start,
        ).first()

        if existing:
            return existing

        # 해당 기간의 분석 데이터 조회
        analyses = self.db.query(MentalAnalysis).filter(
            MentalAnalysis.user_id == user_id,
            MentalAnalysis.analysis_date >= month_start,
            MentalAnalysis.analysis_date <= month_end,
        ).all()

        if not analyses:
            return None

        # 평균 계산
        avg_emotional_stability = sum(a.emotional_stability_score for a in analyses) // len(analyses)
        avg_vitality = sum(a.vitality_score for a in analyses) // len(analyses)
        avg_self_esteem = sum(a.self_esteem_score for a in analyses) // len(analyses)
        avg_positivity = sum(a.positivity_score for a in analyses) // len(analyses)
        avg_social = sum(a.social_connection_score for a in analyses) // len(analyses)
        avg_resilience = sum(a.resilience_score for a in analyses) // len(analyses)

        # 추세 계산 (이전 달과 비교)
        if month_start.month == 1:
            prev_month_start = month_start.replace(year=month_start.year - 1, month=12)
        else:
            prev_month_start = month_start.replace(month=month_start.month - 1)
        prev_month_end = month_start - timedelta(days=1)

        prev_analyses = self.db.query(MentalAnalysis).filter(
            MentalAnalysis.user_id == user_id,
            MentalAnalysis.analysis_date >= prev_month_start,
            MentalAnalysis.analysis_date <= prev_month_end,
        ).all()

        trend = TrendType.STABLE.value
        if prev_analyses:
            prev_avg_emotional_stability = sum(a.emotional_stability_score for a in prev_analyses) // len(prev_analyses)
            prev_avg_positivity = sum(a.positivity_score for a in prev_analyses) // len(prev_analyses)

            if avg_emotional_stability > prev_avg_emotional_stability + 10 or avg_positivity > prev_avg_positivity + 10:
                trend = TrendType.IMPROVING.value
            elif avg_emotional_stability < prev_avg_emotional_stability - 10 or avg_positivity < prev_avg_positivity - 10:
                trend = TrendType.DECLINING.value

        # AI 인사이트 생성
        daily_scores = [
            {
                "date": str(a.analysis_date),
                "emotional_stability": a.emotional_stability_score,
                "vitality": a.vitality_score,
                "self_esteem": a.self_esteem_score,
                "positivity": a.positivity_score,
                "social_connection": a.social_connection_score,
                "resilience": a.resilience_score,
            }
            for a in analyses
        ]

        insights_data = await self._generate_report_insights(
            report_type="월간",
            period_start=month_start,
            period_end=month_end,
            daily_scores=daily_scores,
            avg_emotional_stability=avg_emotional_stability,
            avg_vitality=avg_vitality,
            avg_self_esteem=avg_self_esteem,
            avg_positivity=avg_positivity,
            avg_social_connection=avg_social,
            avg_resilience=avg_resilience,
            trend=trend,
        )

        report = MentalReport(
            user_id=user_id,
            report_type=ReportType.MONTHLY.value,
            period_start=month_start,
            period_end=month_end,
            avg_emotional_stability_score=avg_emotional_stability,
            avg_vitality_score=avg_vitality,
            avg_self_esteem_score=avg_self_esteem,
            avg_positivity_score=avg_positivity,
            avg_social_connection_score=avg_social,
            avg_resilience_score=avg_resilience,
            trend=trend,
            insights=json.dumps(insights_data.get("insights", []), ensure_ascii=False),
            recommendations=json.dumps(insights_data.get("recommendations", []), ensure_ascii=False),
        )

        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)

        return report

    async def _generate_report_insights(
        self,
        report_type: str,
        period_start: date,
        period_end: date,
        daily_scores: list,
        avg_emotional_stability: int,
        avg_vitality: int,
        avg_self_esteem: int,
        avg_positivity: int,
        avg_social_connection: int,
        avg_resilience: int,
        trend: str,
    ) -> dict:
        """AI를 사용하여 리포트 인사이트 생성"""
        if not settings.OPENAI_API_KEY:
            return self._get_default_insights(trend)

        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            prompt = MENTAL_REPORT_INSIGHTS_PROMPT.format(
                report_type=report_type,
                period_start=str(period_start),
                period_end=str(period_end),
                daily_scores=json.dumps(daily_scores, ensure_ascii=False),
                avg_emotional_stability=avg_emotional_stability,
                avg_vitality=avg_vitality,
                avg_self_esteem=avg_self_esteem,
                avg_positivity=avg_positivity,
                avg_social_connection=avg_social_connection,
                avg_resilience=avg_resilience,
                trend=trend,
            )

            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a mental health analyst. Always respond in valid JSON format."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=800,
            )

            content = response.choices[0].message.content
            return json.loads(content)

        except Exception as e:
            logger.error(f"Report insights AI failed: {e}")
            return self._get_default_insights(trend)

    def _get_default_insights(self, trend: str) -> dict:
        """기본 인사이트 (AI 실패 시)"""
        insights_map = {
            TrendType.IMPROVING.value: {
                "insights": [
                    "전반적으로 긍정적인 변화가 관찰됩니다.",
                    "스트레스 관리가 잘 되고 있어요.",
                    "계속해서 좋은 습관을 유지해보세요.",
                ],
                "recommendations": [
                    "현재의 좋은 루틴을 유지해보세요.",
                    "새로운 도전을 시작해보는 것도 좋아요.",
                    "주변 사람들과 긍정적인 에너지를 나눠보세요.",
                ],
            },
            TrendType.STABLE.value: {
                "insights": [
                    "안정적인 멘탈 상태를 유지하고 있습니다.",
                    "큰 변화 없이 평온한 시기입니다.",
                    "자기 관리를 잘 하고 계세요.",
                ],
                "recommendations": [
                    "규칙적인 생활 패턴을 유지해보세요.",
                    "가끔 자신을 위한 작은 보상을 해보세요.",
                    "새로운 취미나 활동을 시도해보는 것도 좋아요.",
                ],
            },
            TrendType.DECLINING.value: {
                "insights": [
                    "최근 스트레스가 증가한 것으로 보입니다.",
                    "마음이 조금 지쳐있을 수 있어요.",
                    "자기 케어에 더 신경을 써보세요.",
                ],
                "recommendations": [
                    "충분한 휴식을 취해보세요.",
                    "가벼운 운동이나 산책을 추천드려요.",
                    "필요하다면 주변 사람들에게 도움을 요청해보세요.",
                ],
            },
        }
        return insights_map.get(trend, insights_map[TrendType.STABLE.value])

    def check_negative_trend(self, user_id: int, days: int = 7) -> bool:
        """최근 N일간 부정적인 추세인지 확인"""
        since_date = date.today() - timedelta(days=days)

        analyses = self.db.query(MentalAnalysis).filter(
            MentalAnalysis.user_id == user_id,
            MentalAnalysis.analysis_date >= since_date,
        ).all()

        if len(analyses) < 3:
            return False

        concerning_count = sum(
            1 for a in analyses
            if a.overall_status in [OverallStatus.CONCERNING.value, OverallStatus.CRITICAL.value]
        )

        return concerning_count >= len(analyses) * 0.5

    def get_weekly_report(self, user_id: int) -> Optional[MentalReport]:
        """최근 주간 리포트 조회"""
        return self.db.query(MentalReport).filter(
            MentalReport.user_id == user_id,
            MentalReport.report_type == ReportType.WEEKLY.value,
        ).order_by(MentalReport.created_at.desc()).first()

    def get_monthly_report(self, user_id: int) -> Optional[MentalReport]:
        """최근 월간 리포트 조회"""
        return self.db.query(MentalReport).filter(
            MentalReport.user_id == user_id,
            MentalReport.report_type == ReportType.MONTHLY.value,
        ).order_by(MentalReport.created_at.desc()).first()
