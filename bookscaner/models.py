from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.

class User(AbstractUser):
    library = models.ManyToManyField("Book", blank=True, related_name="book_in_user_library")

class Book(models.Model):
    book_id = models.CharField(max_length=12)
    title = models.CharField()
    author = models.CharField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    published_date = models.CharField(blank=True, null=True)
    image_src = models.CharField(blank=True, null=True)

class Rating(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="user_ratings")
    book = models.ForeignKey("Book", on_delete=models.CASCADE, related_name="book_ratings")
    rating = models.DecimalField(max_digits=2, decimal_places=1 )

class BookStatus(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="user_book_status")
    book = models.ForeignKey("Book", on_delete=models.CASCADE, related_name="book_book_status")
    status = models.CharField()
