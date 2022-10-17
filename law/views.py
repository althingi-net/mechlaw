from django.shortcuts import render
from law.models import Law
from law.models import LawManager

def law_list(request):

    laws = LawManager.list()

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
