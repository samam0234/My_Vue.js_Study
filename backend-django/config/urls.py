from django.urls import path, re_path

from board import views

handler404 = "board.views.not_found"

urlpatterns = [
    path("health", views.health),
    path("api/auth/signup", views.signup),
    path("api/auth/login", views.login),
    path("api/auth/logout", views.logout),
    path("api/auth/me", views.me),
    path("api/posts", views.posts),
    path("api/posts/<int:post_id>", views.post_detail),
    path("api/posts/<int:post_id>/comments", views.post_comments),
    path("api/comments/<int:comment_id>", views.comment_detail),
    # 숫자가 아닌 id(/api/posts/abc) 는 스펙 v1 의 400 BAD_REQUEST
    re_path(r"^api/posts/(?P<bad>[^/]+)(/comments)?$", views.bad_id),
]
