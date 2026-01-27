# 구독 플랜별 제한 상수

FREE_PLAN_LIMITS = {
    "daily_chat_messages": 5,     # 하루 내 페르소나 대화 횟수
    "max_friends": 3,              # 최대 친구 수
    "can_chat_with_friends": False,  # 친구 페르소나 대화 불가
    "advanced_stats": False,       # 고급 통계 불가
    "character_styles": False,     # 캐릭터 스타일 변경 불가
    "chemistry_analysis": False,   # 케미 분석 불가
}

PREMIUM_PLAN_LIMITS = {
    "daily_chat_messages": None,   # 무제한
    "max_friends": None,           # 무제한
    "can_chat_with_friends": True,  # 친구 페르소나 대화 가능
    "advanced_stats": True,        # 고급 통계 가능
    "character_styles": True,      # 캐릭터 스타일 변경 가능
    "chemistry_analysis": True,    # 케미 분석 가능
}

PREMIUM_FEATURES = [
    "무제한 페르소나 대화",
    "친구 페르소나 대화",
    "상세 감정 분석 리포트",
    "캐릭터 스타일 변경",
    "케미 분석",
    "무제한 친구 추가",
]

# 가격 정보 (KRW)
PREMIUM_MONTHLY_PRICE = 4900
PREMIUM_YEARLY_PRICE = 39900
PREMIUM_YEARLY_DISCOUNT_PERCENT = 32
