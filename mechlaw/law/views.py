from django.shortcuts import render
from law.models import Law

def law_list(request):

    laws = Law.list()

    ctx = {
        'laws': laws,
    }
    return render(request, 'law/list.html', ctx)


def law_show(request, doc_identifier):

    doc = Law.get_as_html(doc_identifier)

    ctx = {
        'doc': doc,
    }

    return render(request, 'law/show.html', ctx)
