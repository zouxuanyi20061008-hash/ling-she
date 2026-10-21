"""FastAPI: deterministic casting and optional AI interpretation, same-origin React SPA."""
from __future__ import annotations
import json
import os
import secrets
import threading
import time
from collections import defaultdict, deque
from datetime import datetime
from pathlib import Path
from typing import Literal
from urllib.request import Request as UrlRequest, urlopen
from urllib.error import HTTPError, URLError

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .core.casting import cast
from .core.strokes import UnsupportedCharacter
from .prompts import build_messages
from .clarification import followup_question
from .yaoci import moving_line_text

app = FastAPI(title="梅花易数排盘 API", version="1.0.0")
LAN_REGEX = (
    r"^http://(?:localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}"
    r"|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2[0-9]|3[01])(?:\.\d{1,3}){2}):5173$"
)
app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:5173","http://127.0.0.1:5173"],
                   allow_origin_regex=LAN_REGEX,allow_methods=["GET","POST"],allow_headers=["*"])

class CastRequest(BaseModel):
    question: str = Field(min_length=1,max_length=1000)
    background: str | None = Field(default=None,max_length=1200)
    background_confirmed: bool = False
    value: str = Field(min_length=1,max_length=100)
    time_iso: datetime
    independent_yin: Literal["one","hour"] = "one"
    manual_first: int | None = Field(default=None,gt=0,le=100)
    manual_second: int | None = Field(default=None,gt=0,le=100)
    manual_structure: Literal["左右","上下","全包围","半包围","左中右","上中下","独体","其他"] | None = None
    manual_yang_part: str | None = Field(default=None,max_length=30)
    manual_yin_part: str | None = Field(default=None,max_length=30)

def compute(req: CastRequest) -> dict:
    if (req.manual_first is None) != (req.manual_second is None):
        raise HTTPException(422,"手动模式必须同时提供阳部与阴部笔画")
    manual = (req.manual_first,req.manual_second) if req.manual_first is not None else None
    parts = (req.manual_yang_part or "",req.manual_yin_part or "")
    try:
        return cast(req.value,req.time_iso,manual,req.independent_yin,req.manual_structure,parts)
    except UnsupportedCharacter as exc:
        raise HTTPException(422,{"code":"MANUAL_REQUIRED","message":str(exc),
                                 "structure":exc.structure,"ids":exc.ids,"character":req.value.strip()}) from exc
    except (RuntimeError,ValueError) as exc:
        raise HTTPException(422,str(exc)) from exc

@app.get("/health")
def health():
    return {"status":"ok"}

@app.post("/api/cast")
def cast_api(req: CastRequest):
    return compute(req)

_max_calls = 5
_lock = threading.Lock()
_recent: dict[str,deque[float]] = defaultdict(deque)

def rate_limit(ip: str):
    now = time.monotonic()
    with _lock:
        events = _recent[ip]
        while events and now - events[0] >= 60:
            events.popleft()
        if len(events) >= _max_calls:
            raise HTTPException(429,"AI 解卦请求过于频繁，请稍后再试")
        events.append(now)

@app.post("/api/interpret")
def interpret_api(req: CastRequest, request: Request):
    chart = compute(req)
    if not req.background_confirmed or not req.background or len(req.background.strip()) < 2:
        raise HTTPException(428, {
            "code": "BACKGROUND_REQUIRED",
            "question": followup_question(req.question),
            "message": "请先根据求测问题补充一次现实背景，然后才可进入AI断事。"
        })
    key = os.getenv("LLM_API_KEY","").strip()
    if not key:
        raise HTTPException(503,"AI 解读暂未启用，请使用「仅排盘」。站长需配置 LLM_API_KEY。")
    code = os.getenv("AI_ACCESS_CODE","")
    if code and not secrets.compare_digest(request.headers.get("x-ai-access-code",""),code):
        raise HTTPException(401,"AI 访问码错误")
    rate_limit(request.client.host if request.client else "unknown")
    endpoint = os.getenv("LLM_API_URL","https://api.deepseek.com/chat/completions")
    model = os.getenv("LLM_MODEL","deepseek-chat")
    if not endpoint.startswith("https://"):
        raise HTTPException(500,"模型 API 地址必须使用 HTTPS")
    payload = json.dumps({"model":model,"messages":build_messages(req.question,chart,req.background.strip(),moving_line_text(chart)),
                          "temperature":0.5,"stream":False},ensure_ascii=False).encode("utf-8")
    outbound = UrlRequest(endpoint,data=payload,headers={"Content-Type":"application/json",
                         "Authorization":f"Bearer {key}"},method="POST")
    try:
        with urlopen(outbound,timeout=45) as response:
            result=json.load(response)
        answer=result["choices"][0]["message"]["content"]
    except (HTTPError,URLError,ValueError,KeyError,IndexError,TimeoutError) as exc:
        raise HTTPException(502,"模型接口不可用或返回格式异常") from exc
    return {"chart":chart,"interpretation":answer}

WEB_DIR = Path(__file__).resolve().parent / "web"
if WEB_DIR.is_dir() and (WEB_DIR/"index.html").is_file():
    app.mount("/",StaticFiles(directory=WEB_DIR,html=True),name="web")
