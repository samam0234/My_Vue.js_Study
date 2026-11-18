"""공통 API 스펙 v1 구현 (Django 함수 뷰).

- 응답: { data } / { data, meta }, 오류: { error: { code, message, fields?, requestId } }
- 인증: Authorization: Bearer <accessToken> (django.core.signing 서명 토큰)
- 필드 이름은 camelCase, 시각은 ISO 8601 UTC
"""
import json
from functools import wraps

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core import signing
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db.models import Count, Q
from django.http import HttpResponse, JsonResponse

from .models import Comment, Member, Post

TOKEN_SALT = "board.access-token"


class ApiError(Exception):
    def __init__(self, status, code, message, fields=None):
        self.status, self.code, self.message, self.fields = status, code, message, fields


def error_response(request, err):
    body = {"code": err.code, "message": err.message, "requestId": getattr(request, "request_id", None)}
    if err.fields:
        body["fields"] = err.fields
    return JsonResponse({"error": body}, status=err.status, json_dumps_params={"ensure_ascii": False})


def ok(data, status=200, meta=None, headers=None):
    body = {"data": data}
    if meta is not None:
        body["meta"] = meta
    response = JsonResponse(body, status=status, json_dumps_params={"ensure_ascii": False})
    for k, v in (headers or {}).items():
        response[k] = v
    return response


def api(methods):
    """허용 메소드 확인 + ApiError 를 스펙 v1 오류 형식으로 바꾸고 JSON 본문을 파싱한다."""

    def deco(fn):
        @wraps(fn)
        def wrapper(request, *args, **kwargs):
            try:
                if request.method not in methods:
                    raise ApiError(405, "BAD_REQUEST", "허용되지 않는 메소드입니다.")
                request.json = {}
                if request.method in ("POST", "PATCH") and request.body and "json" in request.content_type:
                    try:
                        request.json = json.loads(request.body)
                    except ValueError:
                        raise ApiError(400, "BAD_REQUEST", "JSON 형식이 올바르지 않습니다.")
                    if not isinstance(request.json, dict):
                        raise ApiError(400, "BAD_REQUEST", "JSON 객체여야 합니다.")
                return fn(request, *args, **kwargs)
            except ApiError as e:
                return error_response(request, e)
            except Exception:
                # 스택·예외 원문은 응답에 넣지 않고 로그에만 남긴다 (스펙 v1 §5)
                import logging

                logging.getLogger("board").exception("unhandled error requestId=%s", getattr(request, "request_id", ""))
                return error_response(request, ApiError(500, "INTERNAL", "서버 오류가 발생했습니다."))

        return wrapper

    return deco


# ---------- 직렬화 ----------
def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond // 1000:03d}Z"


def user_json(m):
    return {"id": m.id, "email": m.email, "nickname": m.nickname}


def post_json(p):
    count = getattr(p, "comment_count", None)
    if count is None:
        count = p.comments.count()
    return {
        "id": p.id,
        "title": p.title,
        "body": p.body,
        "tags": p.tags,
        "author": {"id": p.author_id, "nickname": p.author.nickname},
        "commentCount": count,
        "createdAt": iso(p.created_at),
        "updatedAt": iso(p.updated_at),
    }


def comment_json(c):
    return {
        "id": c.id,
        "postId": c.post_id,
        "body": c.body,
        "author": {"id": c.author_id, "nickname": c.author.nickname},
        "createdAt": iso(c.created_at),
    }


def posts_qs():
    return Post.objects.select_related("author").annotate(comment_count=Count("comments"))


# ---------- 인증 ----------
def current_user(request):
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        uid = signing.loads(header[7:], salt=TOKEN_SALT, max_age=settings.TOKEN_MAX_AGE)["uid"]
    except signing.BadSignature:  # 만료(SignatureExpired)도 포함
        return None
    return Member.objects.filter(pk=uid).first()


def require_user(request):
    user = current_user(request)
    if not user:
        raise ApiError(401, "UNAUTHORIZED", "로그인이 필요합니다.")  # 토큰 없음·만료·위조
    return user


# ---------- 뷰 ----------
@api(["GET"])
def health(request):
    return JsonResponse({"status": "ok"})


@api(["POST"])
def signup(request):
    d = request.json
    email = str(d.get("email", "")).strip()
    password = str(d.get("password", ""))
    nickname = str(d.get("nickname", "")).strip()
    fields = {}
    try:
        validate_email(email)
    except ValidationError:
        fields["email"] = ["올바른 이메일 형식이 아닙니다."]
    if len(password) < 8:
        fields["password"] = ["비밀번호는 8자 이상이어야 합니다."]
    if not 2 <= len(nickname) <= 20:
        fields["nickname"] = ["2~20자로 입력하세요."]
    if fields:
        raise ApiError(400, "VALIDATION_ERROR", "입력값을 확인하세요.", fields)
    if Member.objects.filter(email__iexact=email).exists():
        raise ApiError(409, "EMAIL_TAKEN", "이미 사용 중인 이메일입니다.", {"email": ["이미 사용 중인 이메일입니다."]})
    m = Member.objects.create(email=email, nickname=nickname, password=make_password(password))
    return ok({"user": user_json(m)}, status=201)


@api(["POST"])
def login(request):
    d = request.json
    m = Member.objects.filter(email__iexact=str(d.get("email", ""))).first()
    # 이메일·비밀번호 어느 쪽이 틀렸는지 숨긴다 (스펙 v1 INVALID_CREDENTIALS)
    if not m or not check_password(str(d.get("password", "")), m.password):
        raise ApiError(401, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.")
    token = signing.dumps({"uid": m.id}, salt=TOKEN_SALT)
    return ok({"user": user_json(m), "accessToken": token})


@api(["POST"])
def logout(request):
    require_user(request)
    return HttpResponse(status=204)  # 토큰 방식이라 서버에서 지울 상태가 없다


@api(["GET"])
def me(request):
    return ok(user_json(require_user(request)))


@api(["GET", "POST"])
def posts(request):
    if request.method == "POST":
        user = require_user(request)
        title, body = request.json.get("title"), request.json.get("body")
        tags = request.json.get("tags", [])
        fields = validate_post(title, body, partial=False)
        if fields:
            raise ApiError(400, "VALIDATION_ERROR", "입력값을 확인하세요.", fields)
        p = Post.objects.create(
            title=title.strip(),
            body=body.strip(),
            tags=[str(t) for t in tags] if isinstance(tags, list) else [],
            author=user,
        )
        return ok(post_json(posts_qs().get(pk=p.pk)), status=201, headers={"Location": f"/api/posts/{p.pk}"})

    q = request.GET.get("q", "").strip()
    page = max(1, to_int(request.GET.get("page"), 1))
    limit = min(50, max(1, to_int(request.GET.get("limit"), 10)))  # 50 초과는 50 으로
    sort = request.GET.get("sort", "-createdAt")
    order = {"createdAt": ["created_at", "id"], "-commentCount": ["-comment_count", "-id"]}.get(sort, ["-created_at", "-id"])

    qs = posts_qs()
    if q:
        qs = qs.filter(Q(title__icontains=q) | Q(body__icontains=q))
    total = qs.count()
    items = qs.order_by(*order)[(page - 1) * limit : page * limit]
    meta = {"page": page, "limit": limit, "total": total, "totalPages": max(1, -(-total // limit))}
    if q:
        meta["q"] = q
    return ok([post_json(p) for p in items], meta=meta)


def to_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def validate_post(title, body, partial):
    fields = {}
    if not partial or title is not None:
        if not isinstance(title, str) or not 1 <= len(title.strip()) <= 200:
            fields["title"] = ["1~200자로 입력하세요."]
    if not partial or body is not None:
        if not isinstance(body, str) or not body.strip():
            fields["body"] = ["내용을 입력하세요."]
    return fields


@api(["GET", "PATCH", "DELETE"])
def post_detail(request, post_id):
    p = posts_qs().filter(pk=post_id).first()
    if request.method == "GET":
        if not p:
            raise ApiError(404, "NOT_FOUND", "게시글을 찾을 수 없습니다.")
        return ok(post_json(p))

    user = require_user(request)
    if not p:
        raise ApiError(404, "NOT_FOUND", "게시글을 찾을 수 없습니다.")
    if p.author_id != user.id:
        raise ApiError(403, "FORBIDDEN", "본인이 쓴 글만 수정·삭제할 수 있습니다.")

    if request.method == "DELETE":
        p.delete()
        return HttpResponse(status=204)

    d = request.json
    fields = validate_post(d.get("title"), d.get("body"), partial=True)
    if fields:
        raise ApiError(400, "VALIDATION_ERROR", "입력값을 확인하세요.", fields)
    if "title" in d:
        p.title = d["title"].strip()
    if "body" in d:
        p.body = d["body"].strip()
    if isinstance(d.get("tags"), list):
        p.tags = [str(t) for t in d["tags"]]
    p.save()
    return ok(post_json(posts_qs().get(pk=p.pk)))


@api(["GET", "POST"])
def post_comments(request, post_id):
    p = Post.objects.filter(pk=post_id).first()
    if request.method == "GET":
        if not p:
            raise ApiError(404, "NOT_FOUND", "게시글을 찾을 수 없습니다.")
        return ok([comment_json(c) for c in p.comments.select_related("author").order_by("created_at", "id")])

    user = require_user(request)
    if not p:
        raise ApiError(404, "NOT_FOUND", "게시글을 찾을 수 없습니다.")
    body = str(request.json.get("body", "")).strip()
    if not 1 <= len(body) <= 500:
        raise ApiError(400, "VALIDATION_ERROR", "입력값을 확인하세요.", {"body": ["1~500자로 입력하세요."]})
    c = Comment.objects.create(post=p, author=user, body=body)
    return ok(comment_json(c), status=201)


@api(["DELETE"])
def comment_detail(request, comment_id):
    user = require_user(request)
    c = Comment.objects.filter(pk=comment_id).first()
    if not c:
        raise ApiError(404, "NOT_FOUND", "댓글을 찾을 수 없습니다.")
    if c.author_id != user.id:
        raise ApiError(403, "FORBIDDEN", "본인이 쓴 댓글만 삭제할 수 있습니다.")
    c.delete()
    return HttpResponse(status=204)


@api(["GET", "POST", "PATCH", "DELETE"])
def bad_id(request, **kwargs):
    raise ApiError(400, "BAD_REQUEST", "id 는 숫자여야 합니다.")


def not_found(request, exception=None):
    request.request_id = getattr(request, "request_id", None)
    return error_response(request, ApiError(404, "NOT_FOUND", "없는 경로입니다."))
