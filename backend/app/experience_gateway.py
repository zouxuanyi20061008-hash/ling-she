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
from .experience_case_archive import parse_shared_case, CaseImportError
from .experience_case_research import summarize_imported_cases, summarize_case_archive

_COOKIE = "wanxiang_session"
_LOGIN_COOKIE = "wanxiang_login_proof"
_LOGIN_TTL_SECONDS = 15 * 60
_DB_LOCK = threading.RLock()
_RATE_LOCK = threading.Lock()
_RATE = defaultdict(deque)
_SCHEMA_READY = False
_MODULES = {"choose", "meihua", "liuyao", "library", "bazi", "qimen", "liuren", "arts", "other"}
_CONSENT_NOTICE = "体验码会记录一次登录及提交时间。可选的功能访问统计仅在同意后记录。案例只有主动勾选并点击提交才发送给站长，默认不收集私人卦问；管理员可审核、导出和删除。"

def enabled():
    return os.getenv("ACCESS_GATE_ENABLED") == "1"

def admin_enabled():
    # The owner portal may be tested/used independently of the friend gate.
    # The public academy stays accessible when ACCESS_GATE_ENABLED=0.
    return (enabled() or os.getenv("ADMIN_PORTAL_ENABLED") == "1") and bool(
        os.getenv("ADMIN_PASSWORD") and os.getenv("APP_SESSION_SECRET"))

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

def _admin_version():
    """Rotating ADMIN_PASSWORD invalidates previously issued owner cookies."""
    return hmac.new(_secret().encode(),b"admin-password-version:"+os.getenv(
        "ADMIN_PASSWORD","").encode(),hashlib.sha256).hexdigest()[:24]

def _login_proof():
    """Sign a fresh browser-bound login-form token; no proxy Host/Origin assumptions."""
    raw=secrets.token_urlsafe(28)+"."+str(int(time.time()))
    mac=hmac.new(_secret().encode(),("login-form:"+raw).encode(),hashlib.sha256).hexdigest()
    return raw+"."+mac

def _attach_login_proof(response,token):
    response.set_cookie(_LOGIN_COOKIE,token,max_age=_LOGIN_TTL_SECONDS,
        path="/",httponly=True,secure=True,samesite="lax")
    return response

def _fetch_metadata_safe(request):
    # Optional browser signal: supported browsers explicitly mark cross-site writes.
    return request.headers.get("sec-fetch-site","").lower()!="cross-site"

def _valid_login_form(request,form):
    if not _secret() or not _fetch_metadata_safe(request):
        return False
    cookie=request.cookies.get(_LOGIN_COOKIE,"")
    given=form.get("login_proof","")
    if not isinstance(cookie,str) or not isinstance(given,str):
        return False
    if len(cookie)<80 or len(cookie)>250 or not hmac.compare_digest(cookie,given):
        return False
    try:
        raw,stamp,mac=cookie.rsplit(".",2)
        expected=hmac.new(_secret().encode(),("login-form:"+raw+"."+stamp).encode(),
                           hashlib.sha256).hexdigest()
        age=time.time()-int(stamp)
        return 0<=age<_LOGIN_TTL_SECONDS and hmac.compare_digest(mac,expected)
    except (ValueError,TypeError):
        return False

def _form_token_input(token):
    return "<input type='hidden' name='login_proof' value='"+html.escape(token,quote=True)+"'>"

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
            return claims if (admin_enabled()
                and hmac.compare_digest(str(claims.get("auth_version","")),
                                        _admin_version())) else None
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

def _bad_request(message, status=400, back="/invite"):
    # Authentication failures must return to their own entry point.
    if back not in ("/invite", "/admin/login", "/admin"):
        back = "/invite"
    title = "返回站长登录" if back == "/admin/login" else "返回登录"
    return _page_error(message, status, back, title)


def _page_error(message, status, back, title):
    response = HTMLResponse(
        "<!doctype html><html lang='zh-CN'><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        "<title>万象书院 · 登录提示</title>"
        "<main style='max-width:490px;margin:8vh auto;padding:24px;"
        "background:#faf6eb;color:#28503c;font:16px/1.9 system-ui'>"
        "<h2>登录提示</h2><p>"+html.escape(message)+"</p>"
        "<a href='"+back+"'>"+title+" →</a></main></html>",
        status_code=status,
    )
    return _headers(response)

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

# Login forms and privileged writes use browser-bound signed CSRF secrets instead
# of comparing the reverse-proxy Host with mobile-browser Origin / Referer.

async def _form(request):
    body = await request.body()
    if len(body) > 4096:
        return {}
    return {key: values[0] for key, values in parse_qs(body.decode("utf-8", "replace")).items()}

def _pg():
    return bool(os.getenv("DATABASE_URL"))

def _storage_status():
    """Server-side real connection check; never reveal connection strings or passwords."""
    if not _pg():
        return {"state":"unconfigured","connected":False,"store":"temporary_sqlite",
                "description":"尚未设置 DATABASE_URL，服务器使用易失的临时存储。"}
    try:
        db=_connect()
        try:
            check=db.execute("SELECT 1").fetchone()
            if not check or check[0]!=1:
                raise RuntimeError("database query did not return expected result")
        finally:
            db.close()
        return {"state":"ready","connected":True,"store":"postgresql",
                "description":"服务器已经成功连接 PostgreSQL 并能执行查询；请继续定期导出备份。"}
    except Exception:
        return {"state":"unreachable","connected":False,"store":"postgresql",
                "description":"已配置 DATABASE_URL，但连接、权限或数据库初始化失败；已暂停正式入库，请检查 Render 服务日志。"}


def _persistent_case_store():
    # Never mistake an environment-variable string for verified durable storage.
    return _storage_status()["connected"]

async def _import_form(request):
    body=await request.body()
    if len(body)>250000:
        return {}
    try:
        return {key:values[0] for key,values in parse_qs(
            body.decode("utf-8"),max_num_fields=12).items()}
    except (UnicodeDecodeError,ValueError):
        return {}

async def _multi_form(request):
    body=await request.body()
    if len(body)>260000:
        return {}
    try:
        return parse_qs(body.decode("utf-8"),max_num_fields=110)
    except (UnicodeDecodeError,ValueError):
        return {}

def _case_research_report():
    visitor_status=_exec("SELECT status,COUNT(*) FROM experience_cases GROUP BY status",get=True)
    imported_status=_exec("SELECT status,COUNT(*) FROM experience_imported_cases GROUP BY status",get=True)
    visitor_raw=_exec("SELECT status,payload FROM experience_cases ORDER BY submitted_at DESC LIMIT 1000",get=True)
    imported_raw=_exec("SELECT status,payload FROM experience_imported_cases ORDER BY imported_at DESC LIMIT 1000",get=True)
    visitor_cases=[]
    imported_cases=[]
    for status,payload in visitor_raw:
        try:
            case=json.loads(payload)
            if isinstance(case,dict):
                visitor_cases.append((status,case))
        except (ValueError,TypeError):
            continue
    for status,payload in imported_raw:
        try:
            record=json.loads(payload)
            case=record.get("case",{}) if isinstance(record,dict) else None
            if isinstance(case,dict):
                imported_cases.append((status,case))
        except (ValueError,TypeError):
            continue
    summary=summarize_case_archive(visitor_cases,imported_cases,
        visitor_status_rows=visitor_status,imported_status_rows=imported_status)
    summary["max_scanned_per_source"]=1000
    summary["partial_scan"]=summary["source_counts"]["visitor_submissions"]>len(visitor_raw) or summary["source_counts"]["owner_uploaded_case_files"]>len(imported_raw)
    summary["database_state"]=_storage_status()["state"]
    return summary

def _batch_review_items(items,status):
    if status not in ("pending","approved","rejected"):
        raise ValueError("审核状态无效")
    with _DB_LOCK:
        db=_connect()
        try:
            for source,ident in items:
                if source=="visitor":
                    table,column="experience_cases","case_id"
                elif source=="imported":
                    table,column="experience_imported_cases","import_id"
                else:
                    raise ValueError("案例来源无效")
                query=f"SELECT {column} FROM {table} WHERE {column}=?"
                if _pg():
                    query=query.replace("?","%s")
                if not db.execute(query,(ident,)).fetchone():
                    raise LookupError("所选案例中有记录已不存在；未修改任何记录")
            for source,ident in items:
                if source=="visitor":
                    table,column="experience_cases","case_id"
                else:
                    table,column="experience_imported_cases","import_id"
                query=f"UPDATE {table} SET status=? WHERE {column}=?"
                if _pg():
                    query=query.replace("?","%s")
                cursor=db.execute(query,(status,ident))
                if cursor.rowcount!=1:
                    raise LookupError("批量审核未完整完成；本次更改已回滚")
            db.commit()
            return len(items)
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

def _research_summary_html(summary):
    labels={"pending":"待审核","approved":"已收录","rejected":"暂不收录"}
    out="<h1>万象书院 · 案例统计与复盘</h1>"
    out+="<p>范围：书院服务器里的访客自愿提交和站长导入案例；不包含浏览器本机收案簿。</p>"
    out+="<div class='cards'>"
    for label,key in (("云端案例总数","all"),("访客提交","visitor_submissions"),("站长导入","owner_uploaded_case_files")):
        out+="<div class='card'><b>"+label+"</b><h2>"+str(summary["source_counts"][key])+"</h2></div>"
    out+="</div><h2>审核状态（全量数据库记录）</h2><table><tr><th>来源</th><th>总数</th><th>待审核</th><th>已收录</th><th>暂不收录</th><th>其他</th></tr>"
    for source,label in (("visitor_submissions","访客提交"),("owner_uploaded_case_files","站长导入")):
        counts=summary["source_status_counts"][source]
        out+="<tr><td>"+label+"</td><td>"+str(summary["source_counts"][source])+"</td>"
        for key in ("pending","approved","rejected"):
            out+="<td>"+str(counts[key])+"</td>"
        out+="<td>"+str(summary["other_status_counts"][source])+"</td></tr>"
    out+="</table><h2>案例完整度与复盘线索（最多每类1000份）</h2><table><tr><th>指标</th><th>数量</th></tr>"
    for label,key in (("样本内案例","sampled_cases"),("缺少事前记录","missing_before"),
        ("六爻原数格式不完整","invalid_original_numbers"),("缺少日月历法信息","missing_calendar"),
        ("缺少起卦时间","missing_created_at"),("有有效后续追记","with_followup"),
        ("尚无有效后续追记","missing_followup"),("时间顺序需人工检查","time_order_needs_review"),
        ("包含未有结论的自述","unresolved_self_reports")):
        out+="<tr><td>"+label+"</td><td>"+str(summary[key])+"</td></tr>"
    out+="</table><h2>反馈分类（自述条数）</h2><table><tr><th>分类</th><th>反馈条数</th><th>涉及案例数</th></tr>"
    for label,count in summary["self_report_feedback_entries"].items():
        out+="<tr><td>"+_html_escape(label)+"</td><td>"+str(count)+"</td><td>"+str(summary["self_report_tags"][label])+"</td></tr>"
    out+="</table><h2>常见用神/分类标签</h2><ul>"
    for item in summary["top_categories"]:
        out+="<li>"+_html_escape(item["name"])+"： "+str(item["count"])+" 份</li>"
    out+="</ul><p class='small'>统计读取每个来源最近最多1000份；状态总数为全量。"
    if summary["partial_scan"]:
        out+="由于记录超过样本上限，内容完整度与反馈分布不包含较早的全部案例。"
    out+="</p><p class='warn'>"+_html_escape(summary["notice"])+"</p>"
    out+="<p><a href='/admin'>返回站长后台</a> · <a href='/admin/research-summary'>查看 JSON</a> · <a href='/admin/export'>导出备份</a></p>"
    return out

def _owner_csrf_ok(request,form,claims):
    return (_fetch_metadata_safe(request) and
            _safe_equal(form.get("csrf",""),claims.get("csrf","")) and
            len(str(form.get("csrf","")))>=16)

def _html_escape(value):
    return html.escape(str(value),quote=True)

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
                db.execute("""CREATE TABLE IF NOT EXISTS experience_imported_cases (
                    import_id TEXT PRIMARY KEY, source_key TEXT NOT NULL,
                    imported_at TEXT NOT NULL, status TEXT NOT NULL,
                    payload TEXT NOT NULL, reviewer_note TEXT NOT NULL)""")
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

def _insert_imported_once(case_id,source,created,payload,note="",status="pending"):
    """One atomic insert; concurrent imports cannot overwrite earlier reviewer work."""
    with _DB_LOCK:
        db=_connect()
        try:
            command=("INSERT INTO experience_imported_cases VALUES (?,?,?,?,?,?) "
                     "ON CONFLICT(import_id) DO NOTHING")
            args=(case_id,source,created,status,payload,note)
            result=db.execute(command.replace("?","%s") if _pg() else command,args)
            inserted=result.rowcount==1
            db.commit()
            return inserted
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()


def _record(claims, kind, module="other"):
    _exec("INSERT INTO experience_events VALUES (?,?,?,?,?,?)",
          (uuid.uuid4().hex, claims["id"], claims["label"][:50], kind, module, _now()))

def _csrf(request: Request, claims):
    token=request.headers.get("x-experience-csrf","")
    return (_fetch_metadata_safe(request) and len(token)>=16
            and _safe_equal(token,claims.get("csrf","")))

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
        path=request.url.path
        if path.startswith("/admin") and path!="/admin/login":
            if not admin_enabled():
                return _headers(JSONResponse({"detail":"站长后台暂未启用"},status_code=503))
            claims=_decode(request)
            if not claims or claims.get("role")!="admin":
                return _headers(RedirectResponse("/admin/login",status_code=303))
            return await call_next(request)
        if not enabled():
            # Public academy always works even with an independent owner portal.
            return await call_next(request)
        if path in ("/health","/invite","/admin/login","/favicon.ico"):
            return await call_next(request)
        claims=_decode(request)
        if not claims:
            if path.startswith("/api/"):
                return _headers(JSONResponse({"detail":"请先输入体验码"},status_code=401))
            return _headers(RedirectResponse("/invite",status_code=303))
        return await call_next(request)

    @app.get("/invite", response_class=HTMLResponse)
    async def invitation_page(request: Request):
        if enabled() and _decode(request):
            return RedirectResponse("/#choose",status_code=303)
        if not enabled():
            return _page("书院开放体验","<h1>万象书院当前公开体验</h1>"
                "<p>无需体验码，朋友可以直接使用书院，案例请用本机文件交换。</p>"
                "<p><a href='/#choose'>进入书院 →</a></p>")
        token=_login_proof()
        response=_page("朋友体验入口", """<h1>万象书院 · 朋友体验入口</h1>
<p>欢迎体验梅花易数、六爻纳甲及书院学习功能。请输入站长单独提供的体验码。</p>
<form method='post' action='/invite'>"""+_form_token_input(token)+"""
<label>体验码<input type='password' name='code' autocomplete='off' required minlength='8' maxlength='80'></label>
<label><input type='checkbox' name='analytics' value='yes'>我同意记录各模块使用次数（可选）</label>
<button type='submit'>进入书院</button></form>
<p class='small'>"""+html.escape(_CONSENT_NOTICE)+"""</p>
<p class='warn'>请勿填写或提交他人的隐私资料。案例不会自动上传，只有你确认分享后才会提交。</p>""")
        return _attach_login_proof(response,token)

    @app.post("/invite")
    async def invitation_login(request: Request):
        if not enabled():
            return RedirectResponse("/#choose",status_code=303)
        form = await _form(request)
        if not _valid_login_form(request,form):
            return _bad_request("登录页面已过期或验证失败，请重新打开登录页并允许本站 Cookie。",403)
        code = form.get("code","").strip()
        label = next((name for key,name in _invites().items() if _safe_equal(key,code)),None)
        if label is None or not _secret():
            # Render's reverse proxy can share an internal client IP among visitors.
            # Count invalid attempts only: bots cannot lock legitimate code holders out.
            if _limited(request,"guest-login",10):
                return _bad_request("体验码尝试次数过多，请稍后再试",429)
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
        if not admin_enabled():
            return _page("管理未启用","<h1>站长后台暂未启用</h1>"
                "<p>公开书院仍可正常使用；请使用本机案例交换中心。</p>"
                "<p><a href='/#cases'>返回案例交换中心 →</a></p>")
        claims=_decode(request)
        if claims and claims.get("role")=="admin":
            return RedirectResponse("/admin",status_code=303)
        token=_login_proof()
        response=_page("站长登录","""<h1>万象书院 · 站长后台</h1>
<p>管理员密码只在服务器校验，不会发给体验者。</p>
<form action='/admin/login' method='post'>"""+_form_token_input(token)+"""<label>管理员密码
<input type='password' name='password' required autocomplete='current-password'></label>
<button type='submit'>进入管理后台</button></form>
<p class='small'>如果显示登录页过期，请返回此页面刷新。请允许本站使用 Cookie。</p>
<p class='small'>站长后台与书院公开体验独立，不会阻止朋友进入书院。</p>""")
        return _attach_login_proof(response,token)

    @app.post("/admin/login")
    async def admin_login(request:Request):
        if not admin_enabled():
            return _bad_request("站长后台暂未启用，普通书院仍可使用",503,back="/admin/login")
        form=await _form(request)
        if not _valid_login_form(request,form):
            return _bad_request("登录页面已过期，请重新打开站长登录页并允许本站 Cookie。",403,back="/admin/login")
        if not _safe_equal(form.get("password",""),os.environ["ADMIN_PASSWORD"]):
            # Failed credentials are rate-limited, but the proxy's shared internal
            # IP must never lock out someone who knows the correct password.
            if _limited(request,"admin-login",8):
                return _bad_request("错误密码尝试次数过多，请稍后再试",429,back="/admin/login")
            return _bad_request("管理员密码不正确",403,back="/admin/login")
        response=RedirectResponse("/admin",status_code=303)
        _cookie(response,{"role":"admin","id":"owner","label":"站长",
                          "auth_version":_admin_version(),
                          "csrf":secrets.token_urlsafe(26),"iat":int(time.time())})
        response.delete_cookie(_LOGIN_COOKIE,path="/")
        return _headers(response)

    @app.get("/admin/research-summary")
    async def admin_research_summary(request:Request):
        claims=_decode(request)
        if not claims or claims.get("role")!="admin":
            return _headers(JSONResponse({"detail":"需要站长身份验证"},status_code=401))
        try:
            return _headers(JSONResponse(_case_research_report()))
        except Exception:
            return _headers(JSONResponse(
                {"detail":"案例研究统计暂不可用，请检查数据库连接；不会据此认定记录被删除"},
                status_code=503))

    @app.get("/admin/research",response_class=HTMLResponse)
    async def admin_research_page(request:Request):
        claims=_decode(request)
        if not claims or claims.get("role")!="admin":
            return RedirectResponse("/admin/login",status_code=303)
        try:
            return _page("案例统计与复盘",_research_summary_html(_case_research_report()))
        except Exception:
            return _page("案例统计暂不可用","<h1>案例统计暂不可用</h1><p>数据库查询失败；这不代表案例已被清空。</p><p><a href='/admin'>返回站长后台</a></p>")

    @app.get("/admin/storage-status")
    async def admin_storage_status(request:Request):
        # This endpoint is admin-only (also guarded by middleware).
        claims=_decode(request)
        if not claims or claims.get("role")!="admin":
            return _headers(JSONResponse({"detail":"需要站长身份验证"},status_code=401))
        return _headers(JSONResponse(_storage_status()))

    @app.get("/admin", response_class=HTMLResponse)
    async def admin_dashboard(request:Request):
        if not admin_enabled():
            return _page("后台未启用","<h1>站长后台尚未启用，普通书院可以正常使用。</h1>")
        claims=_decode(request)
        if not claims or claims.get("role")!="admin":
            return RedirectResponse("/admin/login",status_code=303)
        try:
            events=_exec("SELECT label,kind,module,created_at FROM experience_events ORDER BY created_at DESC LIMIT 120",get=True)
            cases=_exec("SELECT case_id,label,submitted_at,status,payload FROM experience_cases ORDER BY submitted_at DESC LIMIT 80",get=True)
            imported=_exec("SELECT import_id,source_key,imported_at,status,payload,reviewer_note FROM experience_imported_cases ORDER BY imported_at DESC LIMIT 80",get=True)
            error=""
        except Exception:
            events=[];cases=[];imported=[];error="<p class='warn'>数据库暂时不可用，无法显示使用记录和案例。请检查 DATABASE_URL。</p>"
        logins=[e for e in events if e[1]=="login"]
        modules=[e for e in events if e[1]=="module"]
        pending=sum(1 for c in cases if c[3]=="pending")
        cards="<div class='cards'>"+ "".join("<div class='card'><b>"+title+"</b><h2>"+str(val)+"</h2></div>" for title,val in [
            ("近期登录记录",len(logins)),("自愿统计的模块访问",len(modules)),
            ("访客主动提交",len(cases)),("站长导入案例",len(imported)),
            ("待审核案例",pending+sum(1 for c in imported if c[3]=="pending"))])+"</div>"
        storage=_storage_status()
        if storage["state"]=="ready":
            notice="<div class='card'><h2>数据库自检：已连通</h2><p>"+_html_escape(storage["description"])+"</p>"
            notice+="<p class='warn'>此免费数据库计划在 2026-11-22 到期，且没有自动备份。重要资料请定期导出、升级或迁移。</p></div>"
        elif storage["state"]=="unreachable":
            notice="<div class='warn'><h2>数据库自检：连接失败</h2><p>"+_html_escape(storage["description"])+"</p>"
            notice+="<p>为保护案例，正式云端写入已暂停。请不要把这里显示的 0 条当作资料已被清空。</p></div>"
        else:
            notice="<div class='warn'><h2>数据库自检：未配置</h2><p>"+_html_escape(storage["description"])+"</p>"
            notice+="<p>临时 SQLite 在重新部署或休眠后可能丢失，请使用本机案例交换中心和本机备份。</p></div>"
        if not storage["connected"]:
            intake="<section class='warn'><h2>云端正式收案尚未启用</h2>"
            intake+="<p>只有书院服务器成功连接 PostgreSQL 后才能正式入库；无法连接时会拒绝上传，避免造成资料已永久保存的错觉。</p></section>"
        else:
            intake="<section class='card'><h2>导入朋友自愿分享的案例</h2>"
            intake+="<p>仅接受 V27 单份 JSON 分享文件；导入前需检查姓名等隐私。提交后保存到已连接的 PostgreSQL 数据库，状态为待审核。相同来源编号不会重复覆盖。</p>"
            intake+="<form method='post' action='/admin/import-case' id='case-import-form'>"
            intake+="<input type='hidden' name='csrf' value='"+_html_escape(claims["csrf"])+"'>"
            intake+="<label>选择朋友发来的 JSON 文件<input type='file' id='case-import-file' accept='.json,application/json'></label>"
            intake+="<textarea id='case-import-json' name='share_json' hidden required></textarea>"
            intake+="<p id='case-import-preview' class='small'>尚未选择文件</p>"
            intake+="<label><input type='checkbox' name='reviewed' value='yes' required>我已检查朋友自愿分享的资料和隐私内容，确认导入待审核库。</label>"
            intake+="<button type='submit' id='case-import-submit' disabled>确认导入并待审</button></form>"
            intake+="<script>(function(){var f=document.getElementById('case-import-file'), t=document.getElementById('case-import-json'), p=document.getElementById('case-import-preview'), b=document.getElementById('case-import-submit');f.addEventListener('change',async function(){t.value='';b.disabled=true;p.textContent='尚未读取文件';var file=f.files[0];if(!file)return;if(file.size>60000){p.textContent='超过60KB，拒绝导入';return;}try{var raw=await file.text();var obj=JSON.parse(raw);if(obj.format!=='wanxiang-sixyao-case-v1'||obj.version!==1)throw Error('不是V27单份分享包');p.textContent='预览：'+String(obj.case?.ben_gua||'未知卦名')+' → '+String(obj.case?.bian_gua||'未知变卦')+'；事前：'+String(obj.case?.before||'').slice(0,120);t.value=raw;b.disabled=false;}catch(e){p.textContent='文件格式错误：'+e.message;}})})();</script></section>"
        table="<h2>最近使用记录（最多120项）</h2><table><tr><th>邀请码备注</th><th>活动</th><th>模块</th><th>时间 UTC</th></tr>"
        for label,kind,module,date in events:
            table+="<tr><td>"+html.escape(label)+"</td><td>"+html.escape(kind)+"</td><td>"+html.escape(module)+"</td><td>"+html.escape(date)+"</td></tr>"
        table+="</table>"
        batch_form="<section class='card'><h2>批量审核</h2>"
        batch_form+="<p>勾选下面的案例卡片后，一次性更新审核状态。只修改状态、不删除内容；最多100份。选中记录有一份已不存在时，整批操作会回滚。</p>"
        batch_form+="<form id='batch-review-form' method='post' action='/admin/batch-review'>"
        batch_form+="<input type='hidden' name='csrf' value='"+_html_escape(claims["csrf"])+"'>"
        batch_form+="<button type='submit' name='action' value='pending'>批量标记待审核</button> "
        batch_form+="<button type='submit' name='action' value='approved'>批量收录</button> "
        batch_form+="<button type='submit' name='action' value='rejected'>批量暂不收录</button></form></section>"
        blocks="<h2>案例审核（最近80份）</h2>"
        for cid,label,stamp,status,payload in cases:
            try:
                c=json.loads(payload)
                description=(str(c.get("ben_gua",""))+" → "+str(c.get("bian_gua",""))+"；事前："+str(c.get("before","")))[:300]
            except Exception:
                description="格式无法读取"
            blocks+="<div class='case'><b>"+html.escape(label)+" · "+html.escape(status)+"</b>"
            blocks+="<p class='small'>"+html.escape(stamp)+" · ID："+html.escape(cid)+"</p>"
            blocks+="<label><input type='checkbox' form='batch-review-form' name='items' value='visitor:"+html.escape(cid,quote=True)+"'>加入批量审核</label>"
            blocks+="<p>"+html.escape(description)+"</p>"
            blocks+="<details><summary>查看完整提交内容</summary><pre>"+html.escape(payload)+"</pre></details>"
            for action,title in (("approved","收录"),("rejected","拒绝"),("deleted","删除")):
                blocks+="<form class='inline' method='post' action='/admin/review'>"
                blocks+="<input type='hidden' name='csrf' value='"+html.escape(claims["csrf"])+"'>"
                blocks+="<input type='hidden' name='case_id' value='"+html.escape(cid)+"'>"
                blocks+="<input type='hidden' name='action' value='"+action+"'>"
                blocks+="<button type='submit'>"+title+"</button></form>"
            blocks+="</div>"
        archive="<h2>站长导入案例（最多展示80份）</h2>"
        for import_id,source_key,stamp,status,payload,reviewer_note in imported:
            try:
                entry=json.loads(payload)
                c=entry.get("case",{})
            except (ValueError,TypeError):
                c={}
            archive+="<div class='case'><b>文件导入 · "+_html_escape(status)+"</b>"
            archive+="<p class='small'>接收时间（UTC）："+_html_escape(stamp)+" · 来源编号："+_html_escape(source_key[:42])+"</p>"
            archive+="<label><input type='checkbox' form='batch-review-form' name='items' value='imported:"+_html_escape(import_id)+"'>加入批量审核</label>"
            archive+="<p><b>"+_html_escape(c.get("ben_gua",""))+" → "+_html_escape(c.get("bian_gua",""))+"</b></p>"
            archive+="<details><summary>查看事前研判与后续追记</summary>"
            archive+="<p>事前："+_html_escape(c.get("before",""))+"</p>"
            for note in c.get("feedback",[]):
                archive+="<p>后续 "+_html_escape(note.get("recorded_at",""))+" · "+_html_escape(note.get("result_type",""))+"："+_html_escape(note.get("observations",""))+"</p>"
            archive+="<p class='small'>这些内容仅为分享者自述，不代表验证过预测有效性。</p></details>"
            archive+="<form method='post' action='/admin/imported/review'>"
            archive+="<input type='hidden' name='csrf' value='"+_html_escape(claims["csrf"])+"'>"
            archive+="<input type='hidden' name='import_id' value='"+_html_escape(import_id)+"'>"
            archive+="<label>你的审核备注（最多600字）<input type='text' name='reviewer_note' maxlength='600' value='"+_html_escape(reviewer_note)+"'></label>"
            for action,title in (("pending","待审核"),("approved","收录"),("rejected","暂不收录"),("deleted","删除")):
                archive+="<button style='margin:3px' type='submit' name='action' value='"+action+"'>"+title+"</button>"
            archive+="</form></div>"
        batch_labels={"pending":"待审核","approved":"已收录","rejected":"暂不收录"}
        batch_notice=""
        batch_action=request.query_params.get("batch_done","")
        batch_count=request.query_params.get("count","")
        if batch_action in batch_labels and batch_count.isdigit() and int(batch_count)<=100:
            batch_notice="<p class='card'>批量审核完成："+str(int(batch_count))+" 份，状态已更新为："+batch_labels[batch_action]+"。</p>"
        return _page("站长控制台","<h1>万象书院 · 站长控制台</h1>"
           + ("<p class='warn'>普通书院目前公开访问，不自动记录匿名访客身份、访问次数，也不自动收集案例。这里仅显示曾经通过体验码产生的记录；案例交换中心里的本机收案数据不会自动出现在这里。</p>" if not enabled() else
              "<p>邀请码备注只代表所用的体验码，不证明使用者的真实身份。</p>")
           + error + notice + cards + batch_notice + batch_form
           + "<p><a href='/admin/export'>导出完整案例与使用记录 JSON 备份</a> · <a href='/admin/research'>案例统计与复盘</a> · <a href='/admin/research-summary'>查看统计 JSON</a> · <a href='/admin/storage-status'>查看数据库自检结果（JSON）</a> · <a href='/#cases'>本机案例交换中心</a></p>"
           + "<form method='post' action='/admin/logout'><input type='hidden' name='csrf' value='"+html.escape(claims["csrf"])+"'><button type='submit'>安全退出站长后台</button></form>"
           + intake + archive + blocks + table)

    @app.post("/admin/logout")
    async def admin_logout(request:Request):
        claims=_decode(request)
        if not claims or claims.get("role")!="admin":
            return _bad_request("请先登录管理员后台",403,back="/admin/login")
        form=await _form(request)
        if not _fetch_metadata_safe(request) or not _safe_equal(
                form.get("csrf",""),claims["csrf"]):
            return _bad_request("退出请求校验失败",403,back="/admin")
        response=RedirectResponse("/admin/login",status_code=303)
        response.delete_cookie(_COOKIE,path="/")
        return _headers(response)

    @app.post("/admin/import-case")
    async def owner_import_case(request:Request):
        claims=_decode(request)
        if not claims or claims.get("role")!="admin":
            return _bad_request("管理员身份无效",403,back="/admin/login")
        form=await _import_form(request)
        if not _owner_csrf_ok(request,form,claims):
            return _bad_request("导入请求验证失败",403,back="/admin")
        if not _persistent_case_store():
            return _bad_request("未连接持久数据库，云端案例导入暂未开放。请先使用本机收案簿。",503,back="/admin")
        if form.get("reviewed")!="yes":
            return _bad_request("请先确认已检查隐私与分享同意",422,back="/admin")
        try:
            imported_case=parse_shared_case(form.get("share_json",""))
            raw=json.dumps(imported_case,ensure_ascii=False)
            case_id=imported_case["id"]
            inserted=_insert_imported_once(case_id,imported_case["source_key"],_now(),raw)
            if not inserted:
                return _bad_request("这份案例已在云端收案簿，未覆盖既有审核资料",409,back="/admin")
            return RedirectResponse("/admin",status_code=303)
        except CaseImportError as error:
            return _bad_request(str(error),422,back="/admin")
        except Exception:
            return _bad_request("云端数据库当前无法写入，案例尚未成功导入",503,back="/admin")

    @app.post("/admin/imported/review")
    async def owner_review_imported(request:Request):
        claims=_decode(request)
        if not claims or claims.get("role")!="admin":
            return _bad_request("管理员身份无效",403,back="/admin/login")
        form=await _form(request)
        if not _owner_csrf_ok(request,form,claims):
            return _bad_request("审核请求验证失败",403,back="/admin")
        if not _persistent_case_store():
            return _bad_request("持久数据库尚未连接",503,back="/admin")
        ident=form.get("import_id","")
        action=form.get("action","")
        note=form.get("reviewer_note","")
        if len(ident)!=64 or any(c not in "0123456789abcdef" for c in ident):
            return _bad_request("案例编号无效",422,back="/admin")
        if action not in ("pending","approved","rejected","deleted"):
            return _bad_request("审核动作无效",422,back="/admin")
        if not isinstance(note,str) or len(note)>600:
            return _bad_request("审核备注最多600字",422,back="/admin")
        try:
            if action=="deleted":
                _exec("DELETE FROM experience_imported_cases WHERE import_id=?",(ident,))
            else:
                _exec("UPDATE experience_imported_cases SET status=?,reviewer_note=? WHERE import_id=?",
                      (action,note,ident))
            return RedirectResponse("/admin",status_code=303)
        except Exception:
            return _bad_request("审核记录保存失败",503,back="/admin")

    @app.post("/admin/batch-review")
    async def admin_batch_review(request:Request):
        claims=_decode(request)
        if not claims or claims.get("role")!="admin":
            return _bad_request("管理员身份无效",403,back="/admin/login")
        form=await _multi_form(request)
        scalar_form={key:values[0] for key,values in form.items() if values}
        if not _owner_csrf_ok(request,scalar_form,claims):
            return _bad_request("批量审核请求验证失败",403,back="/admin")
        action=scalar_form.get("action","")
        raw_items=form.get("items",[])
        if action not in ("pending","approved","rejected"):
            return _bad_request("批量审核状态无效",422,back="/admin")
        if not raw_items or len(raw_items)>100:
            return _bad_request("请勾选1至100份案例",422,back="/admin")
        if len(set(raw_items))!=len(raw_items):
            return _bad_request("选中案例出现重复编号；未进行修改",422,back="/admin")
        items=[]
        for value in raw_items:
            if not isinstance(value,str) or ":" not in value:
                return _bad_request("案例选择格式无效",422,back="/admin")
            source,ident=value.split(":",1)
            if source=="visitor" and len(ident)==32 and all(c in "0123456789abcdef" for c in ident):
                items.append((source,ident))
            elif source=="imported" and len(ident)==64 and all(c in "0123456789abcdef" for c in ident):
                items.append((source,ident))
            else:
                return _bad_request("案例选择编号无效；未进行修改",422,back="/admin")
        if any(source=="imported" for source,_ in items) and not _persistent_case_store():
            return _bad_request("站长导入案例需要已连通的持久数据库；本次未修改任何记录",503,back="/admin")
        try:
            changed=_batch_review_items(items,action)
            return RedirectResponse("/admin?batch_done="+action+"&count="+str(changed),status_code=303)
        except LookupError as error:
            return _bad_request(str(error),409,back="/admin")
        except Exception:
            return _bad_request("批量审核未能完成，本次操作已回滚；请检查数据库连接",503,back="/admin")

    @app.post("/admin/review")
    async def admin_review(request:Request):
        claims=_decode(request)
        if not claims or claims.get("role")!="admin":
            return _bad_request("管理员身份无效",403)
        form=await _form(request)
        if not _fetch_metadata_safe(request) or not _safe_equal(form.get("csrf",""),claims["csrf"]):
            return _bad_request("审核请求验证失败",403,back="/admin")
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
            imported=_exec("SELECT import_id,source_key,imported_at,status,payload,reviewer_note FROM experience_imported_cases ORDER BY imported_at",get=True)
        except Exception:
            return _bad_request("数据库无法导出",503)
        content=json.dumps({"exported_at":_now(),"cases":[{"id":cid,"label":label,"submitted_at":dt,
            "status":status,"case":json.loads(raw)} for cid,label,dt,status,raw in cases],
            "events":[{"label":a,"kind":b,"module":c,"at":d} for a,b,c,d in events],
            "owner_imported_cases":[{"id":cid,"source_key":source,"imported_at":stamp,
                 "status":status,"case":json.loads(payload).get("case",{}),
                 "reviewer_note":note,"independently_verified":False}
                for cid,source,stamp,status,payload,note in imported]},
            ensure_ascii=False,indent=2)
        return _headers(Response(content=content,media_type="application/json",
            headers={"Content-Disposition":"attachment; filename=wanxiang-experience-backup.json"}))
