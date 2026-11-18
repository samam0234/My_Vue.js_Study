from django.db import models


class Member(models.Model):
    email = models.EmailField(unique=True)
    nickname = models.CharField(max_length=20)
    password = models.CharField(max_length=128)  # 해시만 저장한다 (평문·해시 모두 응답에 넣지 않는다)

    def __str__(self):
        return self.email


class Post(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    tags = models.JSONField(default=list, blank=True)
    author = models.ForeignKey(Member, on_delete=models.CASCADE, related_name="posts")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(Member, on_delete=models.CASCADE, related_name="comments")
    body = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
