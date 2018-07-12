from django.shortcuts import render

from core.docmanager import DocManager

def home(request):

    laws = DocManager.list('law')

    ctx = {
        'laws': laws,
    }
    return render(request, 'core/home.html', ctx)


def show_doc(request, doc_type, doc_identifier):

    doc = DocManager.get(doc_type, doc_identifier)

    ctx = {
        'doc': doc,
    }

    return render(request, 'core/show_doc.html', ctx)
