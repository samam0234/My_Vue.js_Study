"""공통 API 스펙 v1 준수 테스트. 실행: python manage.py test"""
import json

from django.core import signing
from django.test import Client, TestCase, override_settings

from .models import Member, Post
from .views import TOKEN_SALT


class ApiTestCase(TestCase):
    def setUp(self):
        self.c = Client()
        self.signup("mina@example.com", "mina")
        self.signup("joon@example.com", "joon")
        self.mina = self.login("mina@example.com")
        self.joon = self.login("joon@example.com")

    # ---- helpers ----
    def call(self, method, path, body=None, token=None):
        kwargs = {}
        if body is not None:
            kwargs = {"data": json.dumps(body), "content_type": "application/json"}
        if token:
            kwargs["HTTP_AUTHORIZATION"] = f"Bearer {token}"
        return getattr(self.c, method)(path, **kwargs)

    def signup(self, email, nickname, password="password123"):
        return self.call("post", "/api/auth/signup", {"email": email, "password": password, "nickname": nickname})

    def login(self, email, password="password123"):
        return self.call("post", "/api/auth/login", {"email": email, "password": password}).json()["data"]["accessToken"]

    def make_post(self, token, title="첫 글", body="안녕하세요", **extra):
        return self.call("post", "/api/posts", {"title": title, "body": body, **extra}, token)


class AuthTests(ApiTestCase):
    def test_signup_returns_201_without_password(self):
        r = self.signup("new@example.com", "newbie")
        self.assertEqual(r.status_code, 201)
        user = r.json()["data"]["user"]
        self.assertEqual(set(user), {"id", "email", "nickname"})  # 비밀번호·해시는 어떤 응답에도 없다

    def test_password_is_stored_hashed(self):
        self.assertNotEqual(Member.objects.get(email="mina@example.com").password, "password123")

    def test_signup_validation_error_has_fields(self):
        r = self.signup("not-an-email", "x", password="short")
        self.assertEqual(r.status_code, 400)
        err = r.json()["error"]
        self.assertEqual(err["code"], "VALIDATION_ERROR")
        self.assertEqual(set(err["fields"]), {"email", "password", "nickname"})

    def test_duplicate_email_is_409(self):
        r = self.signup("MINA@example.com", "other")
        self.assertEqual((r.status_code, r.json()["error"]["code"]), (409, "EMAIL_TAKEN"))

    def test_login_failure_hides_which_field_is_wrong(self):
        a = self.call("post", "/api/auth/login", {"email": "mina@example.com", "password": "wrong-password"})
        b = self.call("post", "/api/auth/login", {"email": "nobody@example.com", "password": "password123"})
        for r in (a, b):
            self.assertEqual((r.status_code, r.json()["error"]["code"]), (401, "INVALID_CREDENTIALS"))
        self.assertEqual(a.json()["error"]["message"], b.json()["error"]["message"])

    def test_me_requires_valid_token(self):
        self.assertEqual(self.call("get", "/api/auth/me", token=self.mina).json()["data"]["nickname"], "mina")
        self.assertEqual(self.call("get", "/api/auth/me").status_code, 401)
        self.assertEqual(self.call("get", "/api/auth/me", token="forged").status_code, 401)

    @override_settings(TOKEN_MAX_AGE=-1)
    def test_expired_token_is_401(self):
        token = signing.dumps({"uid": Member.objects.first().id}, salt=TOKEN_SALT)
        r = self.call("get", "/api/auth/me", token=token)
        self.assertEqual((r.status_code, r.json()["error"]["code"]), (401, "UNAUTHORIZED"))

    def test_logout_is_204_and_needs_login(self):
        self.assertEqual(self.call("post", "/api/auth/logout", token=self.mina).status_code, 204)
        self.assertEqual(self.call("post", "/api/auth/logout").status_code, 401)


class PostTests(ApiTestCase):
    def test_create_returns_201_location_and_envelope(self):
        r = self.make_post(self.mina, tags=["intro"])
        self.assertEqual(r.status_code, 201)
        data = r.json()["data"]
        self.assertEqual(r["Location"], f"/api/posts/{data['id']}")
        self.assertEqual(data["author"]["nickname"], "mina")
        self.assertEqual(data["tags"], ["intro"])
        self.assertEqual(data["commentCount"], 0)
        self.assertRegex(data["createdAt"], r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$")  # ISO 8601 UTC, camelCase

    def test_create_requires_login_and_validates(self):
        self.assertEqual(self.call("post", "/api/posts", {"title": "t", "body": "b"}).status_code, 401)
        r = self.make_post(self.mina, title="  ", body="")
        self.assertEqual(r.json()["error"]["code"], "VALIDATION_ERROR")
        self.assertEqual(set(r.json()["error"]["fields"]), {"title", "body"})

    def test_list_pagination_search_sort(self):
        for i in range(12):
            self.make_post(self.mina, title=f"글 {i}", body="본문 vue" if i % 2 else "본문")
        r = self.call("get", "/api/posts?limit=5&page=2").json()
        self.assertEqual(r["meta"], {"page": 2, "limit": 5, "total": 12, "totalPages": 3})
        self.assertEqual(len(r["data"]), 5)
        self.assertEqual(self.call("get", "/api/posts?limit=999").json()["meta"]["limit"], 50)  # 50 초과는 50
        q = self.call("get", "/api/posts?q=VUE").json()  # 대소문자 무시, 본문 부분 일치
        self.assertEqual((q["meta"]["total"], q["meta"]["q"]), (6, "VUE"))
        asc = self.call("get", "/api/posts?sort=createdAt&limit=50").json()["data"]
        self.assertEqual(asc[0]["title"], "글 0")
        self.assertEqual(self.call("get", "/api/posts?limit=50").json()["data"][0]["title"], "글 11")  # 기본 -createdAt

    def test_sort_by_comment_count(self):
        a = self.make_post(self.mina, title="A").json()["data"]["id"]
        self.make_post(self.mina, title="B")
        self.call("post", f"/api/posts/{a}/comments", {"body": "c1"}, self.joon)
        self.call("post", f"/api/posts/{a}/comments", {"body": "c2"}, self.joon)
        first = self.call("get", "/api/posts?sort=-commentCount").json()["data"][0]
        self.assertEqual((first["title"], first["commentCount"]), ("A", 2))

    def test_detail_404_and_bad_id_400(self):
        self.assertEqual(self.call("get", "/api/posts/9999").json()["error"]["code"], "NOT_FOUND")
        r = self.call("get", "/api/posts/abc")
        self.assertEqual((r.status_code, r.json()["error"]["code"]), (400, "BAD_REQUEST"))

    def test_patch_is_partial_and_owner_only(self):
        pid = self.make_post(self.mina).json()["data"]["id"]
        r = self.call("patch", f"/api/posts/{pid}", {"title": "수정"}, self.mina)
        self.assertEqual(r.status_code, 200)
        self.assertEqual((r.json()["data"]["title"], r.json()["data"]["body"]), ("수정", "안녕하세요"))
        other = self.call("patch", f"/api/posts/{pid}", {"title": "해킹"}, self.joon)
        self.assertEqual((other.status_code, other.json()["error"]["code"]), (403, "FORBIDDEN"))
        self.assertEqual(self.call("patch", f"/api/posts/{pid}", {"title": "x"}).status_code, 401)
        self.assertEqual(self.call("patch", f"/api/posts/{pid}", {"title": ""}, self.mina).status_code, 400)

    def test_delete_is_204_owner_only_and_cascades(self):
        pid = self.make_post(self.mina).json()["data"]["id"]
        self.call("post", f"/api/posts/{pid}/comments", {"body": "x"}, self.joon)
        self.assertEqual(self.call("delete", f"/api/posts/{pid}", token=self.joon).status_code, 403)
        r = self.call("delete", f"/api/posts/{pid}", token=self.mina)
        self.assertEqual((r.status_code, r.content), (204, b""))  # 본문 없음
        self.assertFalse(Post.objects.filter(pk=pid).exists())


class CommentTests(ApiTestCase):
    def test_comment_flow(self):
        pid = self.make_post(self.mina).json()["data"]["id"]
        self.assertEqual(self.call("post", f"/api/posts/{pid}/comments", {"body": "x"}).status_code, 401)
        r = self.call("post", f"/api/posts/{pid}/comments", {"body": "좋아요"}, self.joon)
        self.assertEqual(r.status_code, 201)
        cid = r.json()["data"]["id"]
        self.assertEqual(self.call("get", f"/api/posts/{pid}").json()["data"]["commentCount"], 1)
        self.assertEqual(len(self.call("get", f"/api/posts/{pid}/comments").json()["data"]), 1)
        self.assertEqual(self.call("delete", f"/api/comments/{cid}", token=self.mina).status_code, 403)
        self.assertEqual(self.call("delete", f"/api/comments/{cid}", token=self.joon).status_code, 204)
        self.assertEqual(self.call("get", f"/api/posts/{pid}").json()["data"]["commentCount"], 0)

    def test_comment_validation(self):
        pid = self.make_post(self.mina).json()["data"]["id"]
        r = self.call("post", f"/api/posts/{pid}/comments", {"body": " "}, self.joon)
        self.assertEqual(r.json()["error"]["fields"], {"body": ["1~500자로 입력하세요."]})
        self.assertEqual(self.call("get", "/api/posts/9999/comments").status_code, 404)


class CommonRulesTests(ApiTestCase):
    def test_health_has_no_prefix(self):
        self.assertEqual(self.c.get("/health").json(), {"status": "ok"})

    def test_bad_json_is_400_bad_request(self):
        r = self.c.post("/api/auth/login", data="{broken", content_type="application/json")
        self.assertEqual((r.status_code, r.json()["error"]["code"]), (400, "BAD_REQUEST"))

    def test_unknown_path_is_json_404(self):
        r = self.c.get("/api/nope")
        self.assertEqual((r.status_code, r.json()["error"]["code"]), (404, "NOT_FOUND"))

    def test_request_id_header_matches_error_body(self):
        r = self.c.get("/api/auth/me", HTTP_X_REQUEST_ID="req-123")
        self.assertEqual((r["X-Request-Id"], r.json()["error"]["requestId"]), ("req-123", "req-123"))
        self.assertTrue(self.c.get("/api/posts")["X-Request-Id"])  # 없으면 생성

    @override_settings(CORS_ORIGIN="http://localhost:5173")
    def test_cors_only_for_configured_origin(self):
        ok = self.c.get("/api/posts", HTTP_ORIGIN="http://localhost:5173")
        self.assertEqual(ok["Access-Control-Allow-Origin"], "http://localhost:5173")
        self.assertNotIn("Access-Control-Allow-Origin", self.c.get("/api/posts", HTTP_ORIGIN="http://evil.example"))
        pre = self.c.options("/api/posts", HTTP_ORIGIN="http://localhost:5173")
        self.assertEqual(pre.status_code, 204)

    def test_server_error_hides_internals(self):
        from unittest import mock

        with mock.patch("board.views.posts_qs", side_effect=RuntimeError("secret db password")):
            with self.assertLogs("board", level="ERROR"):
                r = self.c.get("/api/posts")
        self.assertEqual((r.status_code, r.json()["error"]["code"]), (500, "INTERNAL"))
        self.assertNotIn("secret", r.content.decode())
