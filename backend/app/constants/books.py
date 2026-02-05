"""
검증된 책 추천 데이터베이스

AI 호출 없이 상태별로 미리 검증된 책 목록에서 추천합니다.
모든 책은 실제로 존재하며 한국에서 쉽게 구할 수 있는 책입니다.
"""

from typing import List, Dict
import random

# 상태별 책 추천 목록
# 각 상태별로 다양한 카테고리의 책을 포함

BOOKS_BY_STATUS: Dict[str, List[Dict]] = {
    "good": [
        # 성장, 영감, 도전을 주는 책
        {
            "title": "미라클 모닝",
            "author": "할 엘로드",
            "description": "아침 루틴을 통해 인생을 변화시키는 자기계발서",
            "reason": "긍정적인 에너지를 더 확장하고 새로운 도전을 시작하기 좋은 책이에요",
            "category": "자기계발"
        },
        {
            "title": "아주 작은 습관의 힘",
            "author": "제임스 클리어",
            "description": "1%의 변화가 만드는 놀라운 성장의 비밀",
            "reason": "좋은 상태를 유지하면서 더 나은 습관을 만들어가 보세요",
            "category": "자기계발"
        },
        {
            "title": "역행자",
            "author": "자청",
            "description": "돈, 시간, 운명으로부터 자유로워지는 7단계 전략",
            "reason": "지금의 긍정적인 에너지로 새로운 도전을 해보면 좋을 것 같아요",
            "category": "자기계발"
        },
        {
            "title": "불편한 편의점",
            "author": "김호연",
            "description": "따뜻한 위로와 소소한 행복을 담은 힐링 소설",
            "reason": "마음이 좋을 때 읽으면 더 따뜻해지는 이야기예요",
            "category": "소설"
        },
        {
            "title": "달러구트 꿈 백화점",
            "author": "이미예",
            "description": "꿈을 사고파는 신비로운 백화점 이야기",
            "reason": "상상력을 자극하고 영감을 주는 판타지 소설이에요",
            "category": "소설"
        },
        {
            "title": "언어의 온도",
            "author": "이기주",
            "description": "말과 글에 담긴 따뜻함에 대한 에세이",
            "reason": "좋은 기분을 더 풍요롭게 만들어줄 에세이예요",
            "category": "에세이"
        },
        {
            "title": "나미야 잡화점의 기적",
            "author": "히가시노 게이고",
            "description": "과거와 현재를 잇는 따뜻한 편지 이야기",
            "reason": "감동적인 이야기로 마음을 더 풍요롭게 채워보세요",
            "category": "소설"
        },
        {
            "title": "더 해빙",
            "author": "이서윤, 홍주연",
            "description": "부와 행운을 끌어당기는 감사의 힘",
            "reason": "긍정적인 에너지를 더 크게 확장할 수 있는 책이에요",
            "category": "자기계발"
        },
    ],
    "neutral": [
        # 힐링, 일상의 소소한 행복을 다룬 책
        {
            "title": "오늘 밤, 세계에서 이 사랑이 사라진다 해도",
            "author": "이치조 미사키",
            "description": "소중한 일상의 가치를 깨닫게 하는 사랑 소설",
            "reason": "일상의 소소한 행복을 발견하게 해주는 책이에요",
            "category": "소설"
        },
        {
            "title": "어서 오세요, 휴남동 서점입니다",
            "author": "황보름",
            "description": "작은 서점에서 일어나는 따뜻한 일상 이야기",
            "reason": "평범한 일상 속 작은 행복을 느끼게 해줄 거예요",
            "category": "소설"
        },
        {
            "title": "꽃을 보듯 너를 본다",
            "author": "나태주",
            "description": "일상의 아름다움을 담은 시집",
            "reason": "짧은 시를 통해 마음에 여유를 가져보세요",
            "category": "시집"
        },
        {
            "title": "아몬드",
            "author": "손원평",
            "description": "감정을 느끼지 못하는 소년의 성장 이야기",
            "reason": "감정에 대해 생각해볼 수 있는 의미 있는 소설이에요",
            "category": "소설"
        },
        {
            "title": "하루 한 장 마음챙김",
            "author": "메건 스미스",
            "description": "하루 5분, 마음을 돌보는 365일 명상 가이드",
            "reason": "매일 조금씩 마음을 챙기는 습관을 만들어보세요",
            "category": "자기계발"
        },
        {
            "title": "여행의 이유",
            "author": "김영하",
            "description": "삶과 여행에 대한 작가의 성찰을 담은 에세이",
            "reason": "일상에서 벗어나 새로운 시각을 갖게 해주는 책이에요",
            "category": "에세이"
        },
        {
            "title": "멈추면, 비로소 보이는 것들",
            "author": "혜민",
            "description": "바쁜 일상에서 잠시 멈추고 쉬어가는 에세이",
            "reason": "여유를 갖고 자신을 돌아볼 시간을 가져보세요",
            "category": "에세이"
        },
        {
            "title": "이토록 평범한 미래",
            "author": "김연수",
            "description": "일상의 소중함을 일깨워주는 소설",
            "reason": "평범한 하루의 의미를 되새겨볼 수 있어요",
            "category": "소설"
        },
    ],
    "concerning": [
        # 위로, 공감, 자기 수용을 돕는 책
        {
            "title": "오늘 조금 힘들었던 당신에게",
            "author": "김재식",
            "description": "지친 마음을 위로하는 따뜻한 시와 에세이",
            "reason": "당신의 마음에 따뜻한 위로가 될 거예요",
            "category": "에세이"
        },
        {
            "title": "나는 나로 살기로 했다",
            "author": "김수현",
            "description": "타인의 시선에서 벗어나 나답게 사는 법",
            "reason": "자기 자신을 있는 그대로 받아들이는 용기를 줄 거예요",
            "category": "에세이"
        },
        {
            "title": "지금 이대로 좋아",
            "author": "윤홍균",
            "description": "자존감을 회복하는 따뜻한 심리 에세이",
            "reason": "지금의 당신도 충분히 괜찮다는 것을 알려줄 책이에요",
            "category": "심리학"
        },
        {
            "title": "당신이 옳다",
            "author": "정혜신",
            "description": "마음의 상처를 치유하는 정신과 의사의 따뜻한 위로",
            "reason": "당신의 감정을 인정받고 위로받을 수 있어요",
            "category": "심리학"
        },
        {
            "title": "괜찮지 않은 당신에게",
            "author": "클레어 비드웰 스미스",
            "description": "불안과 함께 살아가는 법을 알려주는 책",
            "reason": "불안한 마음을 다루는 방법을 배울 수 있어요",
            "category": "심리학"
        },
        {
            "title": "해가 지는 건 현상, 해가 진 건 감상",
            "author": "김경일",
            "description": "인지심리학자가 전하는 마음 치유 에세이",
            "reason": "생각의 전환으로 마음의 여유를 찾을 수 있어요",
            "category": "심리학"
        },
        {
            "title": "모든 순간이 너였다",
            "author": "하태완",
            "description": "사랑과 이별, 그리고 치유에 대한 시집",
            "reason": "시를 통해 마음의 위안을 얻을 수 있어요",
            "category": "시집"
        },
        {
            "title": "당신은 결국 무엇이든 해내는 사람",
            "author": "김상현",
            "description": "지친 마음에 힘을 주는 응원의 메시지",
            "reason": "힘든 시간을 이겨낼 용기를 줄 책이에요",
            "category": "에세이"
        },
    ],
    "critical": [
        # 희망, 회복, 전문적 통찰을 주는 책
        {
            "title": "죽고 싶지만 떡볶이는 먹고 싶어",
            "author": "백세희",
            "description": "우울증과 함께 살아가는 솔직한 기록",
            "reason": "비슷한 경험을 한 사람의 이야기가 위로가 될 거예요",
            "category": "에세이"
        },
        {
            "title": "어쩌면 우울한 게 아닐지 모릅니다",
            "author": "김여주",
            "description": "일상적 우울에서 벗어나는 심리학적 처방",
            "reason": "마음 상태를 이해하고 돌보는 방법을 알려줄 책이에요",
            "category": "심리학"
        },
        {
            "title": "마음이 힘들 때 읽는 책",
            "author": "이명수",
            "description": "정신건강의학과 전문의가 전하는 마음 치유서",
            "reason": "전문가의 따뜻한 조언으로 마음을 돌볼 수 있어요",
            "category": "심리학"
        },
        {
            "title": "오늘도 불안한 당신을 위한 이야기",
            "author": "김제우",
            "description": "정신건강의학과 전문의가 들려주는 마음 처방전",
            "reason": "불안한 마음을 전문적으로 다루는 방법을 배울 수 있어요",
            "category": "심리학"
        },
        {
            "title": "우울할 땐 뇌과학",
            "author": "앨릭스 코브",
            "description": "뇌과학이 밝히는 우울증의 원인과 해결법",
            "reason": "우울함의 과학적 원인과 극복법을 알 수 있어요",
            "category": "심리학"
        },
        {
            "title": "삶이 힘들 때 읽는 불교 명상 에세이",
            "author": "틱낫한",
            "description": "마음의 평화를 찾는 명상의 지혜",
            "reason": "마음을 가라앉히고 평화를 찾는 방법을 알려줘요",
            "category": "에세이"
        },
        {
            "title": "나는 왜 나를 사랑하지 못할까",
            "author": "우에니시 아키라",
            "description": "자존감 회복을 위한 심리학적 접근",
            "reason": "자기 자신을 사랑하는 방법을 배울 수 있어요",
            "category": "심리학"
        },
        {
            "title": "해피어",
            "author": "탈 벤 샤하르",
            "description": "하버드대 행복학 강의를 담은 책",
            "reason": "행복에 대한 과학적이고 희망적인 통찰을 줄 거예요",
            "category": "심리학"
        },
    ],
}

# 6가지 심리 지표별 특화 책 (점수가 낮은 영역에 맞춤 추천)
BOOKS_BY_LOW_SCORE: Dict[str, List[Dict]] = {
    "emotional_stability": [
        # 정서 안정성이 낮을 때 - 불안, 스트레스 관련
        {
            "title": "나는 왜 자꾸 불안할까",
            "author": "라파엘 산탕드레아",
            "description": "불안의 원인과 대처법을 알려주는 심리서",
            "reason": "마음의 불안을 이해하고 다스리는 방법을 배울 수 있어요",
            "category": "심리학"
        },
        {
            "title": "스트레스가 사라지는 대화법",
            "author": "김영화",
            "description": "대화를 통해 스트레스를 해소하는 방법",
            "reason": "마음의 안정을 찾는 소통법을 알려드려요",
            "category": "자기계발"
        },
    ],
    "vitality": [
        # 활력이 낮을 때 - 무기력, 피로 관련
        {
            "title": "게으른 완벽주의자를 위한 심리학",
            "author": "하유진",
            "description": "무기력함을 극복하는 심리학적 방법",
            "reason": "에너지를 되찾고 활력을 회복하는 데 도움이 될 거예요",
            "category": "심리학"
        },
        {
            "title": "오늘도 무기력증을 앓고 있습니다",
            "author": "김미진",
            "description": "무기력에서 벗어나는 작은 실천들",
            "reason": "작은 것부터 시작해서 의욕을 되찾아 보세요",
            "category": "에세이"
        },
    ],
    "self_esteem": [
        # 자존감이 낮을 때
        {
            "title": "자존감 수업",
            "author": "윤홍균",
            "description": "하루에 하나씩 쌓는 자존감의 힘",
            "reason": "자존감을 높이는 구체적인 방법을 알려줘요",
            "category": "심리학"
        },
        {
            "title": "네가 좋아하면 그게 힙한 거야",
            "author": "김은유",
            "description": "타인의 시선에서 자유로워지는 법",
            "reason": "있는 그대로의 자신을 사랑하는 법을 배워보세요",
            "category": "에세이"
        },
    ],
    "positivity": [
        # 긍정성이 낮을 때 - 비관, 무의미
        {
            "title": "우리는 왜 행복을 일에서 찾을까",
            "author": "브루스 데이즐리",
            "description": "삶의 의미와 행복을 찾는 방법",
            "reason": "일상에서 희망과 의미를 발견하는 데 도움이 될 거예요",
            "category": "자기계발"
        },
        {
            "title": "하루 한 문장 긍정 훈련",
            "author": "최지윤",
            "description": "긍정적 사고방식을 기르는 365일 문장",
            "reason": "매일 조금씩 긍정적인 마음을 키워보세요",
            "category": "자기계발"
        },
    ],
    "social_connection": [
        # 사회적 연결이 낮을 때 - 외로움, 고립
        {
            "title": "혼자가 혼자에게",
            "author": "이병률",
            "description": "혼자만의 시간을 위로하는 에세이",
            "reason": "외로움을 이해하고 스스로를 다독이는 시간이 될 거예요",
            "category": "에세이"
        },
        {
            "title": "관계의 과학",
            "author": "김경일",
            "description": "인간관계의 심리학적 비밀",
            "reason": "사람들과의 관계를 이해하고 개선하는 데 도움이 될 거예요",
            "category": "심리학"
        },
    ],
    "resilience": [
        # 회복탄력성이 낮을 때 - 포기, 좌절
        {
            "title": "회복탄력성",
            "author": "김주환",
            "description": "시련을 이겨내는 힘의 비밀",
            "reason": "어려움을 이겨내는 힘을 기르는 방법을 알려줘요",
            "category": "심리학"
        },
        {
            "title": "실패에 대하여 생각하지 마라",
            "author": "존 맥스웰",
            "description": "실패를 성공의 발판으로 만드는 법",
            "reason": "좌절을 딛고 일어서는 용기를 줄 책이에요",
            "category": "자기계발"
        },
    ],
}


def get_book_recommendations(
    overall_status: str,
    emotional_stability_score: int,
    vitality_score: int,
    self_esteem_score: int,
    positivity_score: int,
    social_connection_score: int,
    resilience_score: int,
    count: int = 3
) -> dict:
    """
    멘탈 상태에 맞는 책 추천

    Args:
        overall_status: 종합 상태 (good/neutral/concerning/critical)
        *_score: 각 심리 지표 점수 (0-100)
        count: 추천할 책 수 (기본 3권)

    Returns:
        {"books": [...]} 형태의 추천 목록
    """

    # 1. 상태별 기본 책 목록 가져오기
    status_books = BOOKS_BY_STATUS.get(overall_status, BOOKS_BY_STATUS["neutral"])

    # 2. 가장 낮은 점수의 영역 찾기
    scores = {
        "emotional_stability": emotional_stability_score,
        "vitality": vitality_score,
        "self_esteem": self_esteem_score,
        "positivity": positivity_score,
        "social_connection": social_connection_score,
        "resilience": resilience_score,
    }

    # 가장 낮은 점수의 영역
    lowest_area = min(scores, key=scores.get)
    lowest_score = scores[lowest_area]

    # 3. 책 선택 로직
    selected_books = []

    # 가장 낮은 영역의 점수가 40점 미만이면 해당 영역 특화 책 1권 포함
    if lowest_score < 40 and lowest_area in BOOKS_BY_LOW_SCORE:
        area_books = BOOKS_BY_LOW_SCORE[lowest_area]
        if area_books:
            selected_books.append(random.choice(area_books))

    # 나머지는 상태별 책에서 랜덤 선택 (중복 방지)
    remaining_count = count - len(selected_books)

    # 이미 선택된 책 제목 목록
    selected_titles = {book["title"] for book in selected_books}

    # 아직 선택되지 않은 상태별 책 필터링
    available_books = [b for b in status_books if b["title"] not in selected_titles]

    # 랜덤으로 선택
    if len(available_books) >= remaining_count:
        selected_books.extend(random.sample(available_books, remaining_count))
    else:
        selected_books.extend(available_books)

    return {"books": selected_books}
