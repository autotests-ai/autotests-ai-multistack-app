from __future__ import annotations

from django.urls import path, re_path

from api import views

urlpatterns = [
    path("health", views.health),
    path("items", views.items),
    path("auth/register", views.register),
    path("auth/login", views.login),
    path("auth/logout", views.logout),
    path("auth/me", views.me),
    # Last, so it only catches what the routes above did not.
    re_path(r"^.*$", views.unmapped),
]
