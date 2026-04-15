import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, get_object_or_404
from django.urls import reverse

from .models import User, Post, Profile


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

def create_post(request):

    if request.method == "POST":
        data = json.loads(request.body)
        content = data.get("body", "")

        if content:
            new_post = Post(user=request.user, body=content)
            new_post.save()

            return JsonResponse({
                "message": "Post created",
                "body": new_post.body
            }, status=201)
        
        return JsonResponse({"error":"content is empty"}, status=400)
    
    return JsonResponse({"message": "haha!"}, status=200)

def all_posts(request):
    print("heree")
    posts = Post.objects.all().order_by("-timestamp")

    ## serialize the data into a list 
    ## must to match the keys your JS uses

    data = []
    for post in posts:
        data.append({
            "id": post.id,
            "user": post.user.username,
            "body": post.body,
            "timestamp": post.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes": post.likes.count() if hasattr(post,'likes') else 0
        })

    return JsonResponse(data, safe=False)

def profile_view(request, username):
    return render(request, "network/index.html")

def profile_data(request, username):
    print(f"Buscando al usuario: '{username}'")
    user = get_object_or_404(User, username__iexact=username)
    posts = Post.objects.filter(user=user).order_by("-timestamp")

    posts_list = []
    for post in posts:
            posts_list.append({
            "id": post.id,
            "user": post.user.username,
            "body": post.body,
            "timestamp": post.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes": post.likes.count() if hasattr(post,'likes') else 0
        })
    print(f"{request.user} was here")
    return JsonResponse({
            "username": user.username,
            "followers": user.followers.count() if hasattr(user, 'followers') else 0,
            "following": user.following.count() if hasattr(user, 'following') else 0,
            "posts": posts_list
            })