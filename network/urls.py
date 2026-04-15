
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("create_post", views.create_post, name="create_post"),
    path("all_posts", views.all_posts, name="all-posts"),
    path("profile/<str:username>", views.profile_view, name="profile"),
    path("api/profile/<str:username>", views.profile_data),          
]
