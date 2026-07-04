"""
Modular LLM client. Switchable providers per use-case:
  - LLM_ADVISOR_PROVIDER
  - LLM_REPORT_PROVIDER
  - LLM_BRIEF_PROVIDER
  - fallback: LLM_DEFAULT_PROVIDER

Providers: 'anthropic' | 'openai' | 'gemini'. All three are stock PyPI SDKs.

Each request is normalized to:
  system: str, messages: list[{'role':'user'|'assistant','content':str}]
The client returns either raw text or the first JSON object found inside it.

Missing API key for the chosen provider => returns None so callers can fall back.
"""
from __future__ import annotations
import os
import json
import re
from typing import Optional, Literal

Provider = Literal["anthropic", "openai", "gemini"]


class LLMResponse:
    def __init__(self, text: str, provider: str, model: str):
        self.text = text
        self.provider = provider
        self.model = model


class LLMClient:
    def __init__(self, provider: Provider, model: str, api_key: Optional[str]):
        self.provider = provider
        self.model = model
        self.api_key = api_key or ""

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    async def generate(self, system: str, messages: list[dict], max_tokens: int = 800) -> Optional[LLMResponse]:
        if not self.available:
            return None
        try:
            if self.provider == "anthropic":
                return await self._anthropic(system, messages, max_tokens)
            if self.provider == "openai":
                return await self._openai(system, messages, max_tokens)
            if self.provider == "gemini":
                return await self._gemini(system, messages, max_tokens)
        except Exception as e:
            print(f"[llm_client] {self.provider} error: {e}")
        return None

    async def generate_json(self, system: str, messages: list[dict], max_tokens: int = 1200) -> Optional[dict]:
        sys_json = system + (
            " Return STRICT JSON only. No markdown fences. No preamble. No commentary."
        )
        resp = await self.generate(sys_json, messages, max_tokens=max_tokens)
        if not resp:
            return None
        return _extract_json(resp.text)

    # -------------------- Provider adapters --------------------

    async def _anthropic(self, system: str, messages: list[dict], max_tokens: int) -> Optional[LLMResponse]:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=self.api_key)
        resp = await client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=messages,
        )
        text = "".join(getattr(b, "text", "") for b in resp.content) if resp.content else ""
        return LLMResponse(text.strip(), "anthropic", self.model)

    async def _openai(self, system: str, messages: list[dict], max_tokens: int) -> Optional[LLMResponse]:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=self.api_key)
        oa_msgs = [{"role": "system", "content": system}] + [
            {"role": m["role"], "content": m["content"]} for m in messages
        ]
        resp = await client.chat.completions.create(
            model=self.model,
            messages=oa_msgs,
            max_tokens=max_tokens,
        )
        text = resp.choices[0].message.content or ""
        return LLMResponse(text.strip(), "openai", self.model)

    async def _gemini(self, system: str, messages: list[dict], max_tokens: int) -> Optional[LLMResponse]:
        import google.generativeai as genai
        genai.configure(api_key=self.api_key)
        # Gemini requires role='model' for assistant. Build history + prompt.
        history: list[dict] = []
        for m in messages[:-1]:
            role = "user" if m["role"] == "user" else "model"
            history.append({"role": role, "parts": [m["content"]]})
        final_user = messages[-1]["content"]

        model = genai.GenerativeModel(self.model, system_instruction=system)
        # Use synchronous send via `to_thread` since google-generativeai is sync.
        import asyncio
        def _call():
            chat = model.start_chat(history=history)
            r = chat.send_message(final_user, generation_config={"max_output_tokens": max_tokens})
            return r.text or ""
        text = await asyncio.to_thread(_call)
        return LLMResponse(text.strip(), "gemini", self.model)


# ---------------- Factory ----------------

def _key_for(provider: Provider) -> Optional[str]:
    return {
        "anthropic": os.environ.get("ANTHROPIC_API_KEY"),
        "openai": os.environ.get("OPENAI_API_KEY"),
        "gemini": os.environ.get("GEMINI_API_KEY"),
    }.get(provider)


def _model_for(provider: Provider) -> str:
    return {
        "anthropic": os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5-20250929"),
        "openai": os.environ.get("OPENAI_MODEL", "gpt-4o"),
        "gemini": os.environ.get("GEMINI_MODEL", "gemini-2.0-flash"),
    }.get(provider, "")


def get_client(usecase: Optional[str] = None) -> LLMClient:
    """usecase in {advisor, report, brief} — falls back to default."""
    default = os.environ.get("LLM_DEFAULT_PROVIDER", "anthropic").lower()
    override = None
    if usecase:
        override = os.environ.get(f"LLM_{usecase.upper()}_PROVIDER")
    provider = (override or default or "anthropic").lower()

    # If chosen provider has no key, fall back to any provider that does.
    if not _key_for(provider):
        for cand in ("anthropic", "openai", "gemini"):
            if _key_for(cand):
                provider = cand
                break
    return LLMClient(provider=provider, model=_model_for(provider), api_key=_key_for(provider))


# ---------------- JSON extraction ----------------

def _extract_json(text: str) -> Optional[dict]:
    if not text:
        return None
    # First try direct parse
    try:
        return json.loads(text)
    except Exception:
        pass
    m = re.search(r"\{[\s\S]*\}", text)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None
