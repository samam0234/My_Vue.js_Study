import uuid

from django.conf import settings
from django.http import HttpResponse


class RequestIdMiddleware:
    """스펙 v1 §7: 요청의 X-Request-Id 를 그대로 쓰고, 없으면 만든다. 오류 본문의 requestId 와 같은 값."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
        response = self.get_response(request)
        response["X-Request-Id"] = request.request_id
        return response


class CorsMiddleware:
    """CORS_ORIGIN 환경변수에 적은 출처만 허용한다. 프록시(Vite·Nginx)를 쓰면 필요 없다."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get("Origin")
        allowed = origin and origin == settings.CORS_ORIGIN
        if request.method == "OPTIONS" and allowed:
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)
        if allowed:
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Request-Id"
            response["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
            response["Access-Control-Expose-Headers"] = "X-Request-Id, Location"
            response["Vary"] = "Origin"
        return response
