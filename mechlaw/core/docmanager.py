import os
import re

from django.conf import settings
from doctypes.framework_is.law import Law

class DocManager():

    @staticmethod
    def _objectify(filename):
        if settings.LEGAL_FRAMEWORK == 'is':
            year, nr, ending = filename.split('.')
            return Law(nr, year)
        else:
            return filename

    @staticmethod
    def list(doc_type):

        selections = []

        for filename in os.listdir(settings.DATA_DIR):
            if filename[-4:] == '.xml':
                selections.append(DocManager._objectify(filename))

        return selections

    @staticmethod
    def get(doc_type, doc_identifier):
        if settings.LEGAL_FRAMEWORK == 'is':
            nr, year = doc_identifier.split('-')
            path = os.path.join(settings.DATA_DIR, '%s.%s.xml' % (year, nr))
            with open(path) as f:
                content = f.read()

            return content

    @staticmethod
    def get_as_html(doc_type, doc_identifier):
        doc = DocManager.get(doc_type, doc_identifier)

        e = re.compile(r'<([a-z\-]+)( ?)([^>]*)\/>')
        doc = e.sub(r'<\1\2\3></\1>', doc)
        doc = doc.replace('<?xml version="1.0" ?>', '')

        return doc
