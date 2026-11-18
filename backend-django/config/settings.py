"""공통 API 스펙 v1 을 구현한 게시판 백엔드 설정.

개발 기본값은 SQLite 라 설치 없이 바로 돈다. MySQL 은 환경변수로 켠다:
    DB_ENGINE=mysql DB_NAME=board DB_USER=... DB_PASSWORD=... DB_HOST=127.0.0.1 python manage.py migrate
비밀 값은 코드가 아니라 환경변수로만 받는다.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# 개발용 기본값. 운영에서는 반드시 DJANGO_SECRET_KEY 환경변수를 지정한다.
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-only-insecure-key-change-me")
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver").split(",")

INSTALLED_APPS = ["django.contrib.contenttypes", "board"]

MIDDLEWARE = [
    "board.middleware.RequestIdMiddleware",  # X-Request-Id
    "board.middleware.CorsMiddleware",  # CORS_ORIGIN 환경변수 (스펙 v1 §7)
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

if os.environ.get("DB_ENGINE") == "mysql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.environ.get("DB_NAME", "board"),
            "USER": os.environ.get("DB_USER", "board"),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ.get("DB_HOST", "127.0.0.1"),
            "PORT": os.environ.get("DB_PORT", "3306"),
            "OPTIONS": {"charset": "utf8mb4"},
        }
    }
else:
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
USE_TZ = True
TIME_ZONE = "UTC"
LANGUAGE_CODE = "ko-kr"

# 스펙 v1 §6: 토큰 만료 1시간 (학습용은 7일까지 허용)
TOKEN_MAX_AGE = int(os.environ.get("TOKEN_MAX_AGE", 60 * 60 * 24 * 7))
CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "http://localhost:5173")
