from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register",views.register, name="register"),
    path("search", views.search, name="search"),
    path("book/<str:book_id>", views.book, name="book"),
    path("library", views.library, name="library"),
    path("profile", views.profile, name="profile")
]
