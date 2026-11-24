from starlette.datastructures import Headers
from starlette.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send


LAN_ORIGINS = (
    r"^http://(?:localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}"
    r"|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2[0-9]|3[01])(?:\.\d{1,3}){2}):5173$"
)
PACKAGED_ORIGINS = ("null", "https://appassets.androidplatform.net")
PACKAGED_API_PATHS = frozenset({
    "/health",
    "/api/cast",
    "/api/interpret",
    "/api/liuyao/cast",
    "/api/liuyao/calendar-preview",
    "/api/liuyao/interpret",
    "/api/qimen/cast",
    "/api/ziwei/cast",
    "/api/bazi/cast",
    "/api/fengshui/cast",
    "/api/liuren/cast",
    "/api/taiyi/cast",
    "/api/taiyi/hour/cast",
})


class ClientCORSMiddleware:
    def __init__(self, app: ASGIApp):
        self.browser = CORSMiddleware(
            app, allow_origin_regex=LAN_ORIGINS, allow_methods=("GET", "POST"), allow_headers=("*",),
        )
        self.packaged = CORSMiddleware(
            app, allow_origins=PACKAGED_ORIGINS, allow_methods=("GET", "POST"),
            allow_headers=("Content-Type", "X-User-API-Key", "X-AI-Access-Code"),
        )

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        # Local HTML has an opaque origin. Only expose the published, stateless APIs to it.
        if (scope["type"] == "http" and scope["path"] in PACKAGED_API_PATHS
                and Headers(scope=scope).get("origin") in PACKAGED_ORIGINS):
            await self.packaged(scope, receive, send)
        else:
            await self.browser(scope, receive, send)
