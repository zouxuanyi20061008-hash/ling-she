"""Wanxiang closed beta: signed invite/login, minimal opt-in telemetry and case review.

No IP address, raw question, or API credential is written to the case database.
With DATABASE_URL unset this uses an EPHEMERAL SQLite file (Render Free restarts erase it).
"""
from __future__ import annotations

import base64
import csv
import hashlib
import hmac
import html
import io
import json
import os
import secrets
import sqlite3
import threading
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timezone
from urllib.parse import parse_qs

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, Response

_COOKIE = "wanxiang_session"
_DB_LOCK = threading.RLock()
_RATE_LOCK = threading.Lock()
_RATE = defaultdict(deque)
_SCHEMA_READY = False
_MODULES = {"choose", "meihua", "liuyao", "library", "bazi", "qimen", "liuren", "arts", "other"}
_CONSENT_NOTICE = "体验码会记录一次登录及提交时间。可选的功能访问统计仅在同意后记录。案例只有主动勾选并点击提交才发送给站长，默认不收集私人卦问；管理员可审核、导出和删除。"

def enabled():
    return os.getenv("ACCESS_GATE_ENABLED") == "1"

def _secret():
    return os.getenv("APP_SESSION_SECRET", "")

def _invites():
    try:
        raw = json.loads(os.getenv("FRIEND_INVITES_JSON", "{}"))
        if isinstance(raw, dict):
            return {str(key): str(label)[:50] for key, label in raw.items()
                    if isinstance(key, str) and 8 <= len(key) <= 80 and isinstance(label, str)}
    except (ValueError, TypeError):
        pass
    return {}

def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def _safe_equal(a, b):
    return hmac.compare_digest(hashlib.sha256(str(a).encode()).digest(),
                               hashlib.sha256(str(b).encode()).digest())

def _encode(claims):
    payload = base64.urlsafe_b64encode(json.dumps(claims, ensure_ascii=False,
                          separators=(",", ":")).encode()).decode().rstrip("=")
    signature = hmac.new(_secret().encode(), payload.encode(), hashlib.sha256).hexdigest()
    return payload + "." + signature

def _decode(request: Request):
    token = request.cookies.get(_COOKIE, "")
    if not _secret() or "." not in token or len(token) > 3000:
        return None
    try:
        payload, signature = token.rsplit(".", 1)
        good = hmac.new(_secret().encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, good):
            return None
        claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        if not isinstance(claims, dict) or not 0 < time.time() - claims.get("iat", 0) < 7 * 86400:
            return None
        role = claims.get("role")
        if role == "admin":
            return claims if os.getenv("ADMIN_PASSWORD", "") else None
        if role != "guest":
            return None
        code_id = claims.get("id")
        if not any(hashlib.sha256(code.encode()).hexdigest() == code_id for code in _invites()):
            return None
        return claims
    except (ValueError, TypeError, KeyError):
        return None

def _cookie(response, claims):
    response.set_cookie(_COOKIE, _encode(claims), max_age=7*86400,
                        httponly=True, secure=True, samesite="lax", path="/")

def _headers(response):
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response

def _bad_request(message, status=400):
    return _headers(HTMLResponse("<h3>"+html.escape(message)+"</h3><a href='/invite'>返回登录</a>", status_code=status))

def _limited(request: Request, scope: str, limit=12):
    ip = request.client.host if request.client else "unknown"
    # Never store this value in the database.
    now = time.monotonic()
    with _RATE_LOCK:
        bucket = _RATE[(scope, ip)]
        while bucket and now - bucket[0] > 300:
            bucket.popleft()
        if len(bucket) >= limit:
            return True
        bucket.append(now)
    return False

def _same_origin(request):
    host = request.headers.get("host", "").lower()
    origin = request.headers.get("origin", "").lower()
    referer = request.headers.get("referer", "").lower()
    allowed = ("https://" + host, "http://" + host)
    if origin:
        return origin.rstrip("/") in allowed
    if referer:
        return any(referer.startswith(url + "/") for url in allowed)
    return True  # Only an authenticated same-site cookie and unguessable csrf can authorize writes.

async def _form(request):
    body = await request.body()
    if len(body) > 4096:
        return {}
    return {key: values[0] for key, values in parse_qs(body.decode("utf-8", "replace")).items()}

def _pg():
    return bool(os.getenv("DATABASE_URL"))

def _connect():
    global _SCHEMA_READY
    if _pg():
        import psycopg
        db = psycopg.connect(os.environ["DATABASE_URL"], connect_timeout=6)
    else:
        db = sqlite3.connect(os.getenv("EXPERIENCE_SQLITE_PATH", "/tmp/wanxiang_experience.db"), timeout=8)
    if not _SCHEMA_READY:
        with _DB_LOCK:
            if not _SCHEMA_READY:
                db.execute("""CREATE TABLE IF NOT EXISTS experience_events (
                    event_id TEXT PRIMARY KEY, invite_id TEXT NOT NULL,
                    label TEXT NOT NULL, kind TEXT NOT NULL,
                    module TEXT NOT NULL, created_at TEXT NOT NULL)""")
                db.execute("""CREATE TABLE IF NOT EXISTS experience_cases (
                    case_id TEXT PRIMARY KEY, invite_id TEXT NOT NULL,
                    label TEXT NOT NULL, submitted_at TEXT NOT NULL,
                    status TEXT NOT NULL, payload TEXT NOT NULL)""")
                db.commit()
                _SCHEMA_READY = True
    return db

def _exec(query, params=(), *, get=False):
    with _DB_LOCK:
        db = _connect()
        try:
            if _pg():
                query = query.replace("?", "%s")
            cur = db.execute(query, params)
            results = cur.fetchall() if get else None
            db.commit()
            return results
        finally:
            db.close()

def _record(claims, kind, module="other"):
    _exec("INSERT INTO experience_events VALUES (?,?,?,?,?,?)",
          (uuid.uuid4().hex, claims["id"], claims["label"][:50], kind, module, _now()))

def _csrf(request: Request, claims):
    return (_same_origin(request)
            and _safe_equal(request.headers.get("x-experience-csrf", ""),
                            claims.get("csrf", ""))
            and len(request.headers.get("x-experience-csrf", "")) >= 16)

def _page(title, content, variant=""):
    return _headers(HTMLResponse("""<!doctype html><html lang='zh-CN'><head>
<meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<meta name='robots' content='noindex,nofollow'><title>""" + html.escape(title) + """ · 万象书院</title>
<style>*,*:before,*:after{box-sizing:border-box}body{font-family:system-ui,'Noto Serif SC',serif;background:#eae4d7;color:#244638;margin:0;padding:24px}
main{max-width:900px;margin:36px auto;background:#fbf7ed;border:1px solid #c9b89c;padding:clamp(18px,4vw,36px)}
h1{font-size:25px;margin-top:0}p,li{line-height:1.8}input,button,select{font:inherit;max-width:100%}input[type=password],input[type=text]{width:100%;padding:12px;border:1px solid #a8ab94;background:white;margin:8px 0 15px}
button{background:#255943;color:white;border:0;padding:12px 18px;cursor:pointer}a{color:#285942}
label{display:block;margin:13px 0}.small{font-size:12px;color:#6a624f}.warn{background:#f5e6d1;padding:12px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}
.card{padding:12px;background:#f2eadb;border:1px solid #d5c4a9}
table{width:100%;border-collapse:collapse;overflow-wrap:anywhere;font-size:13px}
td,th{text-align:left;padding:9px;border-bottom:1px solid #d0c5b3;vertical-align:top}
.case{border:1px solid #cbb79a;margin:12px 0;padding:12px;background:#fffdf6}
pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:280px;overflow:auto}
.inline{display:inline-block;margin-right:9px}details{margin:8px 0}summary{cursor:pointer}
@media(max-width:600px){body{padding:8px}main{margin:12px auto}td,th{font-size:11px;padding:5px}}</style>
</head><body><main class='""" + html.escape(variant) + "'>" + content + "</main></body></html>"))

def install_gateway(app: FastAPI):
    @app.middleware("http")
    async def access_gate(request: Request, call_next):
        if not enabled():
            return await call_next(request)
        if request.url.path in ("/health", "/invite", "/admin/login", "/favicon.ico"):
            return await call_next(request)
        claims = _decode(request)
        if request.url.path.startswith("/admin"):
            if not claims or claims.get("role") != "admin":
                return _headers(RedirectResponse("/admin/login", status_code=303))
        elif not claims:
            if request.url.path.startswith("/api/"):
                return _headers(JSONResponse({"detail":"请先输入体验码"},status_code=401))
            return _headers(RedirectResponse("/invite",status_code=303))
        return await call_next(request)

    @app.get("/invite", response_class=HTMLResponse)
    async def invitation_page(request: Request):
        if enabled() and _decode(request):
            return RedirectResponse("/#choose",status_code=303)
        return _page("朋友体验入口", """<h1>万象书院 · 朋友体验入口</h1>
<p>欢迎体验梅花易数、六爻纳甲及书院学习功能。请输入站长单独提供的体验码。</p>
<form method='post' action='/invite'>
<label>体验码<input type='password' name='code' autocomplete='off' required minlength='8' maxlength='80'></label>
<label><input type='checkbox' name='analytics' value='yes'>我同意记录各模块使用次数（可选）</label>
<button type='submit'>进入书院</button></form>
<p class='small'>"""+html.escape(_CONSENT_NOTICE)+"""</p>
<p class='warn'>请勿填写或提交他人的隐私资料。案例不会自动上传，只有你确认分享后才会提交。</p>""")

    @app.post("/invite")
    async def invitation_login(request: Request):
        if not enabled():
            return RedirectResponse("/#choose",status_code=303)
        if _limited(request,"guest-login",10) or not _same_origin(request):
            return _bad_request("登录太频繁，请稍后再试",429)
        form = await _form(request)
        code = form.get("code","").strip()
        label = next((name for key,name in _invites().items() if _safe_equal(key,code)),None)
        if label is None or not _secret():
            return _bad_request("体验码无效，请向站长领取专属体验码。",403)
        claims = {"role":"guest","id":hashlib.sha256(code.encode()).hexdigest(),
                  "label":label,"analytics":form.get("analytics")=="yes",
                  "csrf":secrets.token_urlsafe(26),"iat":int(time.time())}
        response = RedirectResponse("/#choose",status_code=303)
        _cookie(response,claims)
        try:
            _record(claims,"login")
        except Exception:
            pass  # Never leak storage credentials or internal error messages.
        return _headers(response)

    @app.post("/api/experience/logout")
    async def logout(request: Request):
        claims=_decode(request)
        if not claims or not _csrf(request,claims):
            return JSONResponse({"detail":"无权退出当前会话"},status_code=403)
        response=JSONResponse({"ok":True})
        response.delete_cookie(_COOKIE,path="/")
        return _headers(response)

    @app.get("/api/experience/session")
    async def session(request: Request):
        claims=_decode(request)
        if not claims:
            return JSONResponse({"authenticated":False},status_code=401)
        return _headers(JSONResponse({"authenticated":True,
            "role":claims["role"],"label":claims.get("label","管理员"),
            "analytics":claims.get("analytics",False),"csrf":claims["csrf"],
            "storage":"postgres" if _pg() else "ephemeral"}))

    @app.post("/api/experience/event")
    async def event(request: Request):
        claims=_decode(request)
        if not claims or claims.get("role")!="guest":
            return JSONResponse({"detail":"体验者未登录"},status_code=401)
        if not _csrf(request,claims):
            return JSONResponse({"detail":"请求验证失败"},status_code=403)
        if not claims.get("analytics"):
            return {"ok":True,"recorded":False}
        if _limited(request,"event",80):
            return JSONResponse({"detail":"请求太频繁"},status_code=429)
        try:
            data=await request.json()
            module=data.get("module")
            if module not in _MODULES:
                return JSONResponse({"detail":"未知模块"},status_code=422)
            _record(claims,"module",module)
            return {"ok":True,"recorded":True}
        except Exception:
            return JSONResponse({"detail":"暂时无法记录访问"},status_code=503)

    @app.post("/api/experience/cases")
    async def submit_case(request: Request):
        claims=_decode(request)
        if not claims or claims.get("role")!="guest":
            return JSONResponse({"detail":"请先使用体验码进入"},status_code=401)
        if not _csrf(request,claims):
            return JSONResponse({"detail":"请求验证失败"},status_code=403)
        if _limited(request,"case",15):
            return JSONResponse({"detail":"提交次数过多，请稍后再试"},status_code=429)
        body=await request.body()
        if len(body)>26000:
            return JSONResponse({"detail":"案例内容过长"},status_code=413)
        try:
            payload=json.loads(body)
            if payload.get("share_consent") is not True:
                return JSONResponse({"detail":"提交前必须主动同意分享"},status_code=422)
            case=payload.get("case")
            if not isinstance(case,dict):
                return JSONResponse({"detail":"案例格式错误"},status_code=422)
            allowed={"ben_gua","bian_gua","original_numbers","day_ganzhi","month_branch",
                     "chosen_category","selected_position","before","feedback",
                     "human_review","focus_selection","created_at"}
            clean={k:v for k,v in case.items() if k in allowed}
            if not isinstance(clean.get("original_numbers"),list) or len(clean["original_numbers"])!=6 or any(type(n) is not int or n not in (6,7,8,9) for n in clean["original_numbers"]):
                return JSONResponse({"detail":"请提交完整六爻盘面"},status_code=422)
            for k in ("before","ben_gua","bian_gua","day_ganzhi","month_branch","chosen_category"):
                if k in clean and (not isinstance(clean[k],str) or len(clean[k])>1500):
                    return JSONResponse({"detail":"案例文字字段格式错误"},status_code=422)
            if not isinstance(clean.get("before"),str) or not clean["before"].strip():
                return JSONResponse({"detail":"事前记录不能留空"},status_code=422)
            if not isinstance(clean.get("feedback",[]),list) or len(clean.get("feedback",[]))>20:
                return JSONResponse({"detail":"反馈格式错误"},status_code=422)
            raw=json.dumps(clean,ensure_ascii=False)
            if len(raw)>18000:
                return JSONResponse({"detail":"案例超出上限，请缩短文字"},status_code=422)
            cid=uuid.uuid4().hex
            _exec("INSERT INTO experience_cases VALUES (?,?,?,?,?,?)",
                  (cid,claims["id"],claims["label"],_now(),"pending",raw))
            return {"ok":True,"case_id":cid,"message":"案例已交给站长审核"}
        except (ValueError,TypeError):
            return JSONResponse({"detail":"案例内容格式错误"},status_code=422)
        except Exception:
            return JSONResponse({"detail":"案例数据库暂时不可用，未提交成功，请先导出本地案例保留。"},status_code=503)

    @app.get("/admin/login", response_class=HTMLResponse)
    async def admin_login_page(request: Request):
        if not enabled():
            return _page("管理未启用","<h1>后台尚未启用</h1>")
        claims=_decode(request)
        if claims and claims.get("role")=="admin":
            return RedirectResponse("/admin",status_code=303)
        return _page("站长登录","""<h1>万象书院 · 站长后台</h1>
<p>管理员密码只在服务器校验，不会发给体验者。</p>
<form action='/admin/login' method='post'><label>管理员密码
<input type='password' name='password' required autocomplete='current-password'></label>
<button type='submit'>进入管理后台</button></form><p class='small'>不要把密码或这个登录过程录屏发给朋友。</p>""")

    @app.post("/admin/login")
    async def admin_login(request:Request):
        if _limited(request,"admin-login",8) or not _same_origin(request):
            return _bad_request("尝试次数过多，请稍后再试",429)
        form=await _form(request)
        if not os.getenv("ADMIN_PASSWORD") or not _safe_equal(form.get("password",""),os.environ["ADMIN_PASSWORD"]):
            return _bad_request("管理员密码不正确",403)
        response=RedirectResponse("/admin",status_code=303)
        _cookie(response,{"role":"admin","id":"owner","label":"站长",
                          "csrf":secrets.token_urlsafe(26),"iat":int(time.time())})
        return _headers(response)

    @app.get("/admin", response_class=HTMLResponse)
    async def admin_dashboard(request:Request):
        if not enabled():
            return _page("后台未启用","<h1>请先启用体验模式</h1>")
        claims=_decode(request)
        if not claims or claims.get("role")!="admin":
            return RedirectResponse("/admin/login",status_code=303)
        try:
            events=_exec("SELECT label,kind,module,created_at FROM experience_events ORDER BY created_at DESC LIMIT 120",get=True)
            cases=_exec("SELECT case_id,label,submitted_at,status,payload FROM experience_cases ORDER BY submitted_at DESC LIMIT 80",get=True)
            error=""
        except Exception:
            events=[];cases=[];error="<p class='warn'>数据库暂时不可用，无法显示使用记录和案例。请检查 DATABASE_URL。</p>"
        logins=[e for e in events if e[1]=="login"]
        modules=[e for e in events if e[1]=="module"]
        pending=sum(1 for c in cases if c[3]=="pending")
        cards="<div class='cards'>"+ "".join("<div class='card'><b>"+title+"</b><h2>"+str(val)+"</h2></div>" for title,val in [
            ("近期登录记录",len(logins)),("自愿统计的模块访问",len(modules)),
            ("案例总数",len(cases)),("待审核案例",pending)])+"</div>"
        notice=("<p class='warn'>当前为 Render 免费服务临时 SQLite：重启或重新部署可能清空记录，请立即改用持久数据库并导出备份！</p>" if not _pg() else
                "<p class='small'>已连接 DATABASE_URL；仍需定期导出案例。免费 Render Postgres 30 天后过期且无自动备份。</p>")
        table="<h2>最近使用记录（最多120项）</h2><table><tr><th>邀请码备注</th><th>活动</th><th>模块</th><th>时间 UTC</th></tr>"
        for label,kind,module,date in events:
            table+="<tr><td>"+html.escape(label)+"</td><td>"+html.escape(kind)+"</td><td>"+html.escape(module)+"</td><td>"+html.escape(date)+"</td></tr>"
        table+="</table>"
        blocks="<h2>案例审核（最近80份）</h2>"
        for cid,label,stamp,status,payload in cases:
            try:
                c=json.loads(payload)
                description=(str(c.get("ben_gua",""))+" → "+str(c.get("bian_gua",""))+"；事前："+str(c.get("before","")))[:300]
            except Exception:
                description="格式无法读取"
            blocks+="<div class='case'><b>"+html.escape(label)+" · "+html.escape(status)+"</b>"
            blocks+="<p class='small'>"+html.escape(stamp)+" · ID："+html.escape(cid)+"</p>"
            blocks+="<p>"+html.escape(description)+"</p>"
            blocks+="<details><summary>查看完整提交内容</summary><pre>"+html.escape(payload)+"</pre></details>"
            for action,title in (("approved","收录"),("rejected","拒绝"),("deleted","删除")):
                blocks+="<form class='inline' method='post' action='/admin/review'>"
                blocks+="<input type='hidden' name='csrf' value='"+html.escape(claims["csrf"])+"'>"
                blocks+="<input type='hidden' name='case_id' value='"+html.escape(cid)+"'>"
                blocks+="<input type='hidden' name='action' value='"+action+"'>"
                blocks+="<button type='submit'>"+title+"</button></form>"
            blocks+="</div>"
        return _page("站长控制台","<h1>万象书院 · 站长控制台</h1>"
           + "<p>邀请码备注只代表所用的体验码，不证明使用者的真实身份。</p>"
           + error + notice + cards
           + "<p><a href='/admin/export'>导出完整案例与使用记录 JSON 备份</a> · <a href='/#choose'>返回书院</a></p>"
           + blocks + table)

    @app.post("/admin/review")
    async def admin_review(request:Request):
        claims=_decode(request)
        if not claims or claims.get("role")!="admin":
            return _bad_request("管理员身份无效",403)
        form=await _form(request)
        if not _same_origin(request) or not _safe_equal(form.get("csrf",""),claims["csrf"]):
            return _bad_request("请求验证失败",403)
        status=form.get("action")
        cid=form.get("case_id","")
        if status not in ("approved","rejected","deleted") or len(cid)!=32:
            return _bad_request("操作参数无效")
        try:
            if status=="deleted":
                _exec("DELETE FROM experience_cases WHERE case_id=?",(cid,))
            else:
                _exec("UPDATE experience_cases SET status=? WHERE case_id=?",(status,cid))
        except Exception:
            return _bad_request("数据库不可用",503)
        return RedirectResponse("/admin",status_code=303)

    @app.get("/admin/export")
    async def admin_export(request:Request):
        claims=_decode(request)
        if not claims or claims.get("role")!="admin":
            return _bad_request("管理员身份无效",403)
        try:
            events=_exec("SELECT label,kind,module,created_at FROM experience_events ORDER BY created_at",get=True)
            cases=_exec("SELECT case_id,label,submitted_at,status,payload FROM experience_cases ORDER BY submitted_at",get=True)
        except Exception:
            return _bad_request("数据库无法导出",503)
        content=json.dumps({"exported_at":_now(),"cases":[{"id":cid,"label":label,"submitted_at":dt,
            "status":status,"case":json.loads(raw)} for cid,label,dt,status,raw in cases],
            "events":[{"label":a,"kind":b,"module":c,"at":d} for a,b,c,d in events]},
            ensure_ascii=False,indent=2)
        return _headers(Response(content=content,media_type="application/json",
            headers={"Content-Disposition":"attachment; filename=wanxiang-experience-backup.json"}))
