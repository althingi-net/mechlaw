from django.urls import path
from django.urls import include
from django.shortcuts import redirect
from django.shortcuts import reverse

from core import views

urlpatterns = [
    path("", lambda request: redirect(reverse("law_list")), name="home"),
    path("law/", include("law.urls")),
]
