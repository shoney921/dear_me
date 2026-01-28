import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.mental_analysis import MentalAnalysis
from app.schemas.mental import (
    MentalAnalysisResponse,
    MentalAnalysisWithFeedback,
    MentalFeedback,
    RadarChartResponse,
    MentalHistoryResponse,
    BookRecommendationResponse,
    WeeklyReportResponse,
    MonthlyReportResponse,
    FeedbackRequest,
)
from app.services.mental_service import MentalService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/current", response_model=MentalAnalysisWithFeedback)
async def get_current_mental_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """최근 멘탈 상태 조회 (피드백 포함)"""
    mental_service = MentalService(db)
    analysis = mental_service.get_current_analysis(current_user.id)

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No mental analysis found. Write a diary first.",
        )

    # 피드백 생성
    feedback = await mental_service.generate_feedback(analysis)

    return MentalAnalysisWithFeedback(
        id=analysis.id,
        user_id=analysis.user_id,
        diary_id=analysis.diary_id,
        stress_score=analysis.stress_score,
        anxiety_score=analysis.anxiety_score,
        depression_score=analysis.depression_score,
        self_esteem_score=analysis.self_esteem_score,
        positivity_score=analysis.positivity_score,
        social_connection_score=analysis.social_connection_score,
        overall_status=analysis.overall_status,
        analysis_date=analysis.analysis_date,
        created_at=analysis.created_at,
        feedback=MentalFeedback(**feedback),
    )


@router.get("/radar", response_model=RadarChartResponse)
def get_radar_chart_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """레이더 차트 데이터 조회"""
    mental_service = MentalService(db)
    radar_data = mental_service.get_radar_data(current_user.id)

    return RadarChartResponse(**radar_data)


@router.get("/history", response_model=MentalHistoryResponse)
def get_mental_history(
    days: int = Query(30, ge=1, le=365, description="조회할 기간 (일)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """멘탈 분석 이력 조회"""
    mental_service = MentalService(db)
    history = mental_service.get_history(current_user.id, days=days, skip=skip, limit=limit)

    return MentalHistoryResponse(**history)


@router.get("/reports/weekly", response_model=WeeklyReportResponse)
async def get_weekly_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """주간 리포트 조회 (없으면 생성)"""
    mental_service = MentalService(db)

    # 기존 리포트 확인
    report = mental_service.get_weekly_report(current_user.id)

    # 없으면 생성 시도
    if not report:
        report = await mental_service.generate_weekly_report(current_user.id)

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not enough data for weekly report. Write more diaries.",
        )

    # 인사이트와 추천 파싱
    insights = json.loads(report.insights) if report.insights else []
    recommendations = json.loads(report.recommendations) if report.recommendations else []

    # 주차 계산
    week_number = report.period_start.isocalendar()[1]

    return WeeklyReportResponse(
        id=report.id,
        user_id=report.user_id,
        report_type=report.report_type,
        period_start=report.period_start,
        period_end=report.period_end,
        avg_stress_score=report.avg_stress_score,
        avg_anxiety_score=report.avg_anxiety_score,
        avg_depression_score=report.avg_depression_score,
        avg_self_esteem_score=report.avg_self_esteem_score,
        avg_positivity_score=report.avg_positivity_score,
        avg_social_connection_score=report.avg_social_connection_score,
        trend=report.trend,
        insights=insights,
        recommendations=recommendations,
        created_at=report.created_at,
        week_number=week_number,
        daily_scores=None,  # 필요시 추가 구현
    )


@router.get("/reports/monthly", response_model=MonthlyReportResponse)
async def get_monthly_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """월간 리포트 조회 (없으면 생성)"""
    mental_service = MentalService(db)

    # 기존 리포트 확인
    report = mental_service.get_monthly_report(current_user.id)

    # 없으면 생성 시도
    if not report:
        report = await mental_service.generate_monthly_report(current_user.id)

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not enough data for monthly report. Write more diaries.",
        )

    # 인사이트와 추천 파싱
    insights = json.loads(report.insights) if report.insights else []
    recommendations = json.loads(report.recommendations) if report.recommendations else []

    return MonthlyReportResponse(
        id=report.id,
        user_id=report.user_id,
        report_type=report.report_type,
        period_start=report.period_start,
        period_end=report.period_end,
        avg_stress_score=report.avg_stress_score,
        avg_anxiety_score=report.avg_anxiety_score,
        avg_depression_score=report.avg_depression_score,
        avg_self_esteem_score=report.avg_self_esteem_score,
        avg_positivity_score=report.avg_positivity_score,
        avg_social_connection_score=report.avg_social_connection_score,
        trend=report.trend,
        insights=insights,
        recommendations=recommendations,
        created_at=report.created_at,
        month=report.period_start.month,
        year=report.period_start.year,
        weekly_averages=None,  # 필요시 추가 구현
    )


@router.post("/feedback", response_model=MentalFeedback)
async def generate_feedback(
    request: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """특정 분석에 대한 피드백 생성"""
    mental_service = MentalService(db)

    if request.analysis_id:
        analysis = db.query(MentalAnalysis).filter(
            MentalAnalysis.id == request.analysis_id,
            MentalAnalysis.user_id == current_user.id,
        ).first()
    else:
        analysis = mental_service.get_current_analysis(current_user.id)

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mental analysis not found.",
        )

    feedback = await mental_service.generate_feedback(analysis)

    return MentalFeedback(**feedback)


@router.get("/book-recommendations", response_model=BookRecommendationResponse)
async def get_book_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """현재 멘탈 상태에 맞는 책 추천"""
    mental_service = MentalService(db)
    recommendations = await mental_service.recommend_books(current_user.id)

    if not recommendations.get("books"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No mental analysis found. Write a diary first.",
        )

    return BookRecommendationResponse(**recommendations)


@router.get("/check-negative-trend")
def check_negative_trend(
    days: int = Query(7, ge=1, le=30, description="확인할 기간 (일)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """부정적 추세 확인 (알림용)"""
    mental_service = MentalService(db)
    is_negative = mental_service.check_negative_trend(current_user.id, days=days)

    return {
        "is_negative_trend": is_negative,
        "days_checked": days,
    }
