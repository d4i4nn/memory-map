from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    body = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name="liked_posts", blank=True)

    class Meta:
        ordering = ["-timestamp"] # Show newest posts first

    def __str__(self):
        return f"{self.user.username}: {self.body[:20]}..."

class Profile(models.Model):
    # One-to-One: Every user has exactly one profile
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(max_length=500, blank=True)
    # Symmetrical=False allows "A follows B" without "B automatically following A"
    following = models.ManyToManyField(
        "self", 
        symmetrical=False, 
        related_name="followers", 
        blank=True
    )

    def __str__(self):
        return f"Profile for {self.user.username}"
    