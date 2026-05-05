
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("create_post", views.create_post, name="create_post"),
    path("all_posts/", views.all_posts, name="all-posts"),
    path("toggle_follow/<str:username>", views.toggle_follow, name="toggle_follow"),          
    path("profile_data/<str:username>", views.profile_data, name="profile_data"),
    path("profile/<str:username>", views.profile_view, name="profile"),
    path("like_post/<int:post_id>", views.toggle_like, name="toggle_like"),
    path("edit_post/<int:post_id>", views.edit_post, name="edit_post")
]
