from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand

from board.models import Member, Post

TITLES = ["Vue 3 반응형 정리", "Vue Router 목록과 상세", "폼 검증 패턴", "Pinia 로 로그인 공유", "fetch 와 오류 처리",
          "Vitest 시작하기", "Vite 환경변수", "SPA 배포와 fallback", "컴포넌트 props 와 emit", "템플릿 문법 정리"]


class Command(BaseCommand):
    help = "개발용 계정(mina/joon, 비밀번호 password123)과 샘플 게시글을 만든다. 이미 있으면 건너뛴다."

    def handle(self, *args, **options):
        if Member.objects.exists():
            self.stdout.write("이미 데이터가 있어 건너뜁니다.")
            return
        pw = make_password("password123")
        members = [Member.objects.create(email=f"{n}@example.com", nickname=n, password=pw) for n in ("mina", "joon")]
        for i, title in enumerate(TITLES):
            Post.objects.create(title=title, body=f"{title} 에 대한 메모입니다.", tags=["vue"], author=members[i % 2])
        self.stdout.write("계정 2개, 게시글 10개를 만들었습니다. (mina@example.com / password123)")
