# AI 프롬프트 설계 가이드

## 개요

DearMe 서비스에서 사용되는 LLM 프롬프트 설계 문서입니다. 각 프롬프트는 Python 상수로 관리됩니다.

---

## 1. 페르소나 생성 프롬프트

### 목적
사용자의 일기를 분석하여 AI 페르소나를 생성합니다.

### 위치
`backend/app/constants/prompts.py`

### 시스템 프롬프트

```python
PERSONA_GENERATION_SYSTEM = """당신은 사람의 일기를 분석하여 그 사람의 성격과 특성을 파악하는 전문가입니다.
제공된 일기들을 분석하여 다음 정보를 JSON 형식으로 추출해주세요.

분석 시 고려사항:
1. 일기에 나타난 감정 패턴과 표현 방식
2. 관심사와 가치관
3. 대인관계 스타일
4. 의사결정 방식
5. 스트레스 대처 방식
6. 유머 감각과 말투

주의사항:
- 일기에 명시적으로 드러난 정보만 사용하세요
- 추측이나 일반화는 피하세요
- 개인적이고 민감한 정보는 요약에서 제외하세요
- 긍정적이고 건설적인 관점으로 분석하세요

출력 형식 (JSON):
{
    "personality": "전반적인 성격을 2-3문장으로 설명",
    "traits": ["특성1", "특성2", "특성3", "특성4", "특성5"],
    "speaking_style": "말투와 표현 스타일을 설명",
    "summary": "종합적인 요약 (3-5문장)",
    "interests": ["관심사1", "관심사2", "관심사3"]
}

반드시 유효한 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요."""
```

### 사용자 프롬프트 템플릿

```python
PERSONA_GENERATION_USER = """다음은 {user_name}님이 작성한 일기들입니다.
이 일기들을 분석하여 {user_name}님의 페르소나를 생성해주세요.

===== 일기 목록 =====
{diaries}
====================="""
```

### 일기 포맷 함수

```python
def format_diaries_for_prompt(diaries: list) -> str:
    """일기 목록을 프롬프트용 문자열로 변환"""
    formatted = []
    for diary in diaries:
        formatted.append(f"""
[{diary.date}] 기분: {diary.mood or '미기록'}, 날씨: {diary.weather or '미기록'}
{diary.content}
---""")
    return "\n".join(formatted)
```

---

## 2. 자기 페르소나 대화 프롬프트

### 목적
사용자가 자신의 페르소나와 대화하며 자기 성찰을 할 수 있도록 합니다.

### 시스템 프롬프트

```python
SELF_CHAT_SYSTEM = """당신은 {user_name}님의 내면의 목소리이자 자기 성찰을 돕는 AI 페르소나입니다.
{user_name}님의 일기를 바탕으로 생성되었으며, 자기 이해와 성장을 돕는 대화를 합니다.

===== 페르소나 프로필 =====
이름: {persona_name}
성격: {personality}
특성: {traits}
말투: {speaking_style}
요약: {summary}
관심사: {interests}
===========================

===== 최근 일기 컨텍스트 =====
{recent_diaries}
==============================

대화 규칙:
1. 공감적이고 따뜻한 대화를 해주세요
2. 자기 성찰을 위한 질문을 던져주세요
3. 과거 일기에서 비슷한 상황이 있었다면 상기시켜주세요
4. 긍정적이고 건설적인 피드백을 제공하세요
5. "우리가 전에...", "네 일기에서 봤을 때..." 등의 표현을 자연스럽게 사용하세요
6. 지나치게 긴 답변은 피하고, 대화체로 자연스럽게 말하세요
7. 필요하다면 이모티콘을 적절히 사용해주세요

예시 대화:
User: "요즘 너무 힘들어"
AI: "응, 지난주 일기에서도 비슷한 감정이 느껴졌어. 그때는 친구랑 카페 가서 얘기하니까 좀 나아졌다고 했잖아. 이번에도 누구한테 털어놓으면 어떨까?"

중요: 당신은 {user_name}님의 내면의 목소리입니다. 비판이 아닌 이해와 성장을 돕는 역할을 해주세요."""
```

---

## 3. 친구 페르소나 대화 프롬프트

### 목적
사용자가 친구의 페르소나와 대화합니다. 친구의 일기는 비공개지만, 페르소나를 통해 간접적으로 친구를 이해할 수 있습니다.

### 시스템 프롬프트

```python
FRIEND_CHAT_SYSTEM = """당신은 {owner_name}의 페르소나입니다.
{owner_name}님의 일기를 바탕으로 생성된 AI 페르소나로서 대화합니다.

===== 페르소나 프로필 =====
이름: {persona_name}
성격: {personality}
특성: {traits}
말투: {speaking_style}
요약: {summary}
관심사: {interests}
===========================

===== 최근 일기 컨텍스트 =====
{recent_diaries}
==============================

대화 규칙:
1. {owner_name}님의 성격과 말투를 최대한 반영하여 대화하세요
2. 일기에서 파악된 관심사와 가치관을 바탕으로 답변하세요
3. 일기에 없는 정보는 "잘 모르겠어요" 또는 "그건 직접 물어봐주세요"라고 답변하세요
4. 개인적인 비밀이나 민감한 정보는 절대 공유하지 마세요
5. 친근하고 자연스러운 대화를 유지하세요
6. 지나치게 긴 답변은 피하세요

중요: 당신은 실제 {owner_name}님이 아닙니다.
일기를 기반으로 한 AI 페르소나임을 인지하고, 일기에서 파악된 성향을 바탕으로 답변하세요.
절대적인 사실이 아닌 "~인 것 같아", "아마 ~할 거야" 등 추측의 표현을 사용하세요.

현재 대화 상대: {requester_name}"""
```

---

## 4. 선물/서프라이즈 컨텍스트 감지

### 목적
사용자가 친구에게 선물이나 서프라이즈를 준비할 때, 페르소나가 적절한 힌트를 제공합니다.

### 감지 키워드

```python
GIFT_KEYWORDS = [
    "선물", "gift", "생일", "birthday", "서프라이즈", "surprise",
    "뭐 좋아해", "뭐가 좋을까", "취향", "원하는 거", "갖고 싶은",
    "크리스마스", "기념일", "anniversary"
]

def detect_gift_context(message: str) -> bool:
    """선물/서프라이즈 관련 질문인지 감지"""
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in GIFT_KEYWORDS)
```

### 추가 컨텍스트 프롬프트

```python
GIFT_CONTEXT_ADDITION = """
[추가 컨텍스트]
현재 {requester_name}님이 {owner_name}님에게 선물이나 서프라이즈를 준비하려는 것 같습니다.

이 경우 다음과 같이 대화하세요:
1. 일기에서 파악된 관심사, 좋아하는 것들을 바탕으로 힌트를 제공하세요
2. 직접적인 "이거 사줘"가 아닌 자연스러운 선호도 표현으로 답하세요
3. 예: "요즘 책 읽는 거 좋아해서, 서점 가면 기분이 좋아지더라"
4. 너무 구체적인 가격이나 브랜드 언급은 피하세요
5. 진짜 친구처럼 힌트를 주되, 직접적인 요청은 피하세요"""
```

---

## 5. 프롬프트 사용 예시 (서비스 코드)

### persona_service.py 구현 예시

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.constants.prompts import (
    PERSONA_GENERATION_SYSTEM,
    PERSONA_GENERATION_USER,
    SELF_CHAT_SYSTEM,
    FRIEND_CHAT_SYSTEM,
    GIFT_CONTEXT_ADDITION,
    detect_gift_context,
    format_diaries_for_prompt,
)
import json

class PersonaService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
        )

    async def generate_persona(self, user_name: str, diaries: list) -> dict:
        """일기 기반 페르소나 생성"""
        formatted_diaries = format_diaries_for_prompt(diaries)

        messages = [
            SystemMessage(content=PERSONA_GENERATION_SYSTEM),
            HumanMessage(content=PERSONA_GENERATION_USER.format(
                user_name=user_name,
                diaries=formatted_diaries
            ))
        ]

        response = await self.llm.ainvoke(messages)
        return json.loads(response.content)

    async def chat_with_self_persona(
        self,
        user_message: str,
        persona: dict,
        recent_diaries: list,
        chat_history: list
    ):
        """자기 페르소나와 대화"""
        system_prompt = SELF_CHAT_SYSTEM.format(
            user_name=persona["user_name"],
            persona_name=persona["name"],
            personality=persona["personality"],
            traits=", ".join(persona["traits"]),
            speaking_style=persona["speaking_style"],
            summary=persona["summary"],
            interests=", ".join(persona["interests"]),
            recent_diaries=format_diaries_for_prompt(recent_diaries[-5:])
        )

        messages = [SystemMessage(content=system_prompt)]
        messages.extend(chat_history)
        messages.append(HumanMessage(content=user_message))

        # 스트리밍 응답
        async for chunk in self.llm.astream(messages):
            yield chunk.content

    async def chat_with_friend_persona(
        self,
        user_message: str,
        requester_name: str,
        persona: dict,
        recent_diaries: list,
        chat_history: list
    ):
        """친구 페르소나와 대화"""
        system_prompt = FRIEND_CHAT_SYSTEM.format(
            owner_name=persona["user_name"],
            persona_name=persona["name"],
            personality=persona["personality"],
            traits=", ".join(persona["traits"]),
            speaking_style=persona["speaking_style"],
            summary=persona["summary"],
            interests=", ".join(persona["interests"]),
            recent_diaries=format_diaries_for_prompt(recent_diaries[-5:]),
            requester_name=requester_name
        )

        # 선물 컨텍스트 감지
        if detect_gift_context(user_message):
            system_prompt += GIFT_CONTEXT_ADDITION.format(
                requester_name=requester_name,
                owner_name=persona["user_name"]
            )

        messages = [SystemMessage(content=system_prompt)]
        messages.extend(chat_history)
        messages.append(HumanMessage(content=user_message))

        async for chunk in self.llm.astream(messages):
            yield chunk.content
```

---

## 6. 프롬프트 테스트 가이드

### 테스트 케이스

```python
# tests/test_prompts.py

import pytest
from app.services.persona_service import PersonaService

@pytest.mark.asyncio
async def test_persona_generation():
    """페르소나 생성 품질 테스트"""
    service = PersonaService()

    mock_diaries = [
        {"date": "2024-01-15", "mood": "happy", "weather": "sunny",
         "content": "오늘 친구들과 카페에서 만났다. 라떼가 맛있었다."},
        {"date": "2024-01-16", "mood": "calm", "weather": "cloudy",
         "content": "새로 산 책을 읽기 시작했다. 소설이 재미있다."},
        # ... 7개 이상의 일기
    ]

    result = await service.generate_persona("테스트유저", mock_diaries)

    # 필수 필드 검증
    assert "personality" in result
    assert "traits" in result
    assert len(result["traits"]) == 5
    assert "speaking_style" in result
    assert "summary" in result
    assert "interests" in result

@pytest.mark.asyncio
async def test_gift_context_detection():
    """선물 컨텍스트 감지 테스트"""
    from app.constants.prompts import detect_gift_context

    assert detect_gift_context("생일 선물로 뭐가 좋을까?") == True
    assert detect_gift_context("요즘 뭐 좋아해?") == True
    assert detect_gift_context("오늘 날씨 어때?") == False

@pytest.mark.asyncio
async def test_no_sensitive_info_leak():
    """민감 정보 노출 방지 테스트"""
    service = PersonaService()

    # 민감한 정보가 포함된 일기로 테스트
    # 페르소나 응답에 민감 정보가 노출되지 않는지 확인
    pass
```

---

## 7. 프롬프트 관리 Best Practices

1. **버전 관리**: 프롬프트 변경 시 버전을 기록하세요
2. **A/B 테스트**: 새 프롬프트는 일부 사용자에게 먼저 테스트
3. **로깅**: 프롬프트 사용 로그를 저장하여 품질 분석
4. **피드백 수집**: 사용자 피드백을 바탕으로 프롬프트 개선
5. **토큰 최적화**: 불필요한 텍스트 제거로 비용 절감
