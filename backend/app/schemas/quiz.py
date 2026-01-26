from typing import List, Optional
from pydantic import BaseModel, Field


class QuizOption(BaseModel):
    """퀴즈 선택지"""
    id: str
    text: str


class QuizQuestion(BaseModel):
    """퀴즈 질문"""
    id: int
    question: str
    options: List[QuizOption]


class QuizQuestionsResponse(BaseModel):
    """퀴즈 질문 목록 응답"""
    questions: List[QuizQuestion]
    total_questions: int


class QuizAnswer(BaseModel):
    """개별 퀴즈 답변"""
    question_id: int = Field(..., ge=1, le=5)
    option_id: str = Field(..., pattern="^[a-d]$")


class QuizSubmitRequest(BaseModel):
    """퀴즈 제출 요청"""
    answers: List[QuizAnswer] = Field(..., min_length=5, max_length=5)


class QuizSubmitResponse(BaseModel):
    """퀴즈 제출 응답"""
    success: bool
    persona_id: int
    persona_name: str
    persona_level: str
    message: str


class PersonaLevelInfo(BaseModel):
    """페르소나 레벨 정보"""
    current_level: str
    level_name: str
    description: str
    diary_count: int
    next_level: Optional[str]
    next_level_name: Optional[str]
    diaries_needed: Optional[int]
    progress_percent: int
