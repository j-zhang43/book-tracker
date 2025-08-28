import json
import requests
from django.shortcuts import render
from django.urls import reverse
from django import forms
from django.db import IntegrityError
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect, JsonResponse, HttpResponseForbidden, HttpResponse
from django.contrib.auth import authenticate, login, logout
from django.db.models import Avg
from .models import *
from PIL import Image
from pytesseract import image_to_string
import math


# Create your views here.

@login_required(login_url="login")
def index(request):
    book_info = getLibraryBookInfo(request)
    currently_reading = [book["book_info"] for book in book_info if book["status"] == "Reading" or book["status"] is None]
    print(currently_reading)

    all_books = Book.objects.all()
    popular_books = []
    for book in all_books:
        num_ratings = Rating.objects.filter(book=book).count()
        avg_rating = Rating.objects.filter(book=book).aggregate(Avg("rating", default = 0))
        weighted_avg = (float(avg_rating["rating__avg"]) * num_ratings)/(num_ratings+User.objects.all().count()/2)
        if weighted_avg != 0:
            popular_books.append({
                "book": book,
                "w_rating": weighted_avg
            })
    popular_books = sorted(popular_books, key=lambda book: book["w_rating"], reverse=True)

    return render(request, "bookscaner/index.html", {
        "most_recent": all_books[:5],
        "currently_reading": currently_reading[:5],
        "popular_books": popular_books[:5]
    })

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

def login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request,user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "bookscaner/login.html",{
                "message": "Invalid username and/or password"
            })
    else:
        return render(request, "bookscaner/login.html")

def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        password = request.POST["password"]
        password_again = request.POST["password_again"]

        if password != password_again:
            return render(request, "bookscaner/register.html", {
                "message": "Passwords do not match"
            })
        
        try:
            user = User.objects.create(username=username, email=email, password=password)
            user.save()
        except IntegrityError:
            return render(request, "bookscaner/register.html", {
                "message": "Username already taken"
            })
        
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "bookscaner/register.html")
    
def search(request):
    if request.method == "POST":
        image_data = request.FILES['image']
        image = Image.open(image_data)

        
        print(image_to_string(image))

        return JsonResponse(
            {
                "ocr_result": image_to_string(image)
            }
        )

    return render(request, "bookscaner/search.html")

def book(request, book_id):
    book = Book.objects.get(book_id=book_id) if Book.objects.filter(book_id=book_id).count() else None

    if request.method == "POST":
        request.user.library.add(book)
        return HttpResponse(status=204)

    if request.method == "DELETE":
        request.user.library.remove(book)
        return HttpResponse(status=204)
            
    if book:
        num_ratings = Rating.objects.filter(book=book).count()
        avg_rating = Rating.objects.filter(book=book).aggregate(Avg("rating", default = 0))

        is_in_library = book in request.user.library.all()

        return render(request, "bookscaner/book.html", {
            "book": book,
            "num_ratings": num_ratings,
            "avg_rating": avg_rating["rating__avg"],
            "is_in_library": is_in_library
        })
    else:
        response = requests.get(f"https://www.googleapis.com/books/v1/volumes/{book_id}")

        if response.status_code == 200:
            data = response.json()
            
            book = Book.objects.create(
                book_id = data["id"],
                title = data["volumeInfo"]["title"],
                author = ", ".join(data["volumeInfo"]["authors"]) if data["volumeInfo"].get("authors") else None,
                description = data["volumeInfo"]["description"] if data["volumeInfo"].get("description") else None,
                published_date = data["volumeInfo"]["publishedDate"] if data["volumeInfo"].get("publishedDate") else None,
                image_src = data["volumeInfo"]["imageLinks"]["thumbnail"] if data["volumeInfo"].get("imageLinks") and data["volumeInfo"]["imageLinks"].get("thumbnail") else None,
            )
            book.save()

            return HttpResponseRedirect(reverse("book", args=[data["id"]]))
        
    return HttpResponseForbidden("Something went wrong")
    
@login_required(login_url="login")
def library(request):
    if request.method == "POST":
        data = json.loads(request.body)
        book_id = data.get("book_id")
        book = Book.objects.get(book_id=book_id[14:])

        rating = data.get("rating")
        rating = math.floor(rating*2)/2

        try:
            past_rating = Rating.objects.get(user=request.user, book=book)
            past_rating.rating = rating
            past_rating.save()
        except Rating.DoesNotExist:
            new_rating = Rating.objects.create(
                user=request.user, 
                book=book,
                rating=rating
            )
            new_rating.save()

        return HttpResponse(204)

    if request.method == "PUT":
        data = json.loads(request.body)
        book_id = data.get("book_id")
        book = Book.objects.get(book_id=book_id[15:])

        status = data.get("status")

        try:
            past_status = BookStatus.objects.get(user=request.user, book=book)
            past_status.status = status
            past_status.save()
        except BookStatus.DoesNotExist:
            new_status = BookStatus.objects.create(
                user=request.user,
                book=book,
                status=status
            )
            new_status.save()
        
    books = request.user.library.all()
    ratings = request.user.user_ratings.all()
    statuses = BookStatus.objects.filter(user=request.user)

    book_info = getLibraryBookInfo(request)

    return render(request, "bookscaner/library.html", {
        "books": book_info
    })

@login_required(login_url="login")
def profile(request):
    book_info = getLibraryBookInfo(request) 
    count_ratings={
        "0.5": 0,
        "1.0": 0,
        "1.5": 0,
        "2.0": 0,
        "2.5": 0,
        "3.0": 0,
        "3.5": 0,
        "4.0": 0,
        "4.5": 0,
        "5.0": 0
    }
    count_status={
        "Reading": 0,
        "Finished": 0,
        "On Hold": 0,
        "Dropped": 0,
        "Waitlist": 0,
    }

    for book in book_info:
        if book["rating"]:
            count_ratings[str(book["rating"])] += 1

        if book["status"]:
            count_status[book["status"]] +=1
        else:
            count_status[book["Reading"]] +=1

    return render(request, "bookscaner/profile.html", {
        "book_info": book_info,
        "count_rating": count_ratings,
        "count_status": count_status
    })

def getLibraryBookInfo(request):
    books = request.user.library.all()
    ratings = request.user.user_ratings.all()
    statuses = BookStatus.objects.filter(user=request.user)

    book_info = []

    for book in books:
        rating = None
        status = None
        for rate in ratings:
            if rate.book == book:
                rating = rate.rating
        for stat in statuses:
            if stat.book == book:
                status = stat.status

        book_info.append({
            "book_info": book,
            "rating": rating,
            "status": status
        })
    
    return book_info
