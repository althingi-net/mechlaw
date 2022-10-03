from django.shortcuts import render
from law.models import Law

def law_list(request):

    laws = Law.list()

    ctx = {
        'laws': laws,
    }
    return render(request, 'law/list.html', ctx)


def law_show(request, identifier):

    law = Law(identifier)

    ctx = {
        'law': law,
    }

    return render(request, 'law/show.html', ctx)
