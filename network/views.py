import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, get_object_or_404
from django.urls import reverse
from django.core.paginator import Paginator
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

    posts_query = Post.objects.all().order_by("-timestamp")

    # 10 pags by page
    paginator = Paginator(posts_query, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    ## serialize the data into a list 
    ## must to match the keys your JS uses

    data = []
    for post in page_obj:
        data.append({
            "id": post.id,
            "user": post.user.username,
            "body": post.body,
            "timestamp": post.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes": post.likes.count() if hasattr(post,'likes') else 0
        })
    return JsonResponse({
        "posts": data,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages
    }, safe=False)

def profile_view(request, username):
    return render(request, "network/index.html")

def profile_data(request, username):
    print(f"Buscando al usuario: '{username}'")
    user_to_view = get_object_or_404(User, username__iexact=username)
    profile, created = Profile.objects.get_or_create(user=user_to_view)
    profile = user_to_view.profile

    posts_query = Post.objects.filter(user=user_to_view).order_by("-timestamp")
    paginator = Paginator(posts_query, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    ## follow logic
    is_following = False
    if request.user.is_authenticated and request.user != user_to_view:
        if request.user.profile.following.filter(id=profile.id).exists():
            is_following = True

    posts_list = []
    for post in page_obj:
            posts_list.append({
            "id": post.id,
            "user": post.user.username,
            "body": post.body,
            "timestamp": post.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes": post.likes.count() if hasattr(post,'likes') else 0
        })
    return JsonResponse({
            "username": user_to_view.username,
            "followers": profile.followers.count() if hasattr(profile, 'followers') else 0,
            "following": profile.following.count() if hasattr(profile, 'following') else 0,
            "is_following": is_following,
            "is_self": request.user == user_to_view,
            "posts": posts_list,
            "has_next": page_obj.has_next(),
            "current_page": page_obj.number
            })


def toggle_follow(request, username):
    try:
        print(f"${username}")
        target_user = User.objects.get(username=username)
        target_profile = target_user.profile
        my_profile = request.user.profile

        if my_profile == target_profile:
            return JsonResponse({"error": "no"}, status=400)
        
        #logic
        if my_profile.following.filter(id=target_profile.id).exists():
            my_profile.following.remove(target_profile)
            action= "unfollowed"
        else:
            my_profile.following.add(target_profile)
            action = "followed"
        return JsonResponse({
            "status": "success",
            "action": action,
            "count": target_profile.followers.count()
        })
    except User.DoesNotExist:
        return JsonResponse({"error": "no exists"}, status=404)
        