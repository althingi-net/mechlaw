from django.shortcuts import render


def home(request):
    ctx = {}
    return render(request, 'core/home.html', ctx)
