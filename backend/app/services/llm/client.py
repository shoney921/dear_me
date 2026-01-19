from typing import AsyncGenerator, List, Optional
import json
import os

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage


class LLMClient:
    """LLM 클라이언트 - OpenAI GPT 모델 사용"""

    def __init__(
        self,
        model: str = "gpt-4o-mini",
        temperature: float = 0.7,
        api_key: Optional[str] = None,
    ):
        self.model = model
        self.temperature = temperature
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")

        self.llm = ChatOpenAI(
            model=self.model,
            temperature=self.temperature,
            api_key=self.api_key,
            streaming=True,
        )

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        chat_history: Optional[List[dict]] = None,
    ) -> str:
        """일반 생성 (non-streaming)"""
        messages = self._build_messages(system_prompt, user_prompt, chat_history)
        response = await self.llm.ainvoke(messages)
        return response.content

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> dict:
        """JSON 형식 응답 생성"""
        content = await self.generate(system_prompt, user_prompt)

        # JSON 파싱 시도
        try:
            # 코드 블록이 있는 경우 제거
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            return json.loads(content.strip())
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse JSON response: {e}\nContent: {content}")

    async def stream(
        self,
        system_prompt: str,
        user_prompt: str,
        chat_history: Optional[List[dict]] = None,
    ) -> AsyncGenerator[str, None]:
        """스트리밍 생성"""
        messages = self._build_messages(system_prompt, user_prompt, chat_history)

        async for chunk in self.llm.astream(messages):
            if chunk.content:
                yield chunk.content

    def _build_messages(
        self,
        system_prompt: str,
        user_prompt: str,
        chat_history: Optional[List[dict]] = None,
    ) -> List[BaseMessage]:
        """메시지 리스트 구성"""
        messages: List[BaseMessage] = [SystemMessage(content=system_prompt)]

        if chat_history:
            for msg in chat_history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))

        messages.append(HumanMessage(content=user_prompt))
        return messages


# 싱글톤 인스턴스
_llm_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    """LLM 클라이언트 싱글톤 반환"""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client
