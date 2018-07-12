from django.urls import path

from core import views

urlpatterns = [
    path('', views.home, name='home'),
    path('doc/<str:doc_type>/<str:doc_identifier>/', views.show_doc, name='show_doc'),
]

