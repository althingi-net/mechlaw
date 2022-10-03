import os
import re
from django.conf import settings

class Law():
    nr = ''
    year = ''

    def __init__(self, nr, year):
        self.nr = nr
        self.year = year

    def url_identifier(self):
        return '%s-%s' % (self.nr, self.year)

    def __str__(self):
        return '%s/%s' % (self.nr, self.year)

    @staticmethod
    def list():

        selections = []

        for filename in os.listdir(settings.DATA_DIR):
            # Make sure that the filename corresponds to our expectations.
            dot_count = sum(map(lambda x : 1 if x == '.' else 0, filename))
            if filename[-4:] == '.xml' and dot_count == 2:
                year, nr, ending = filename.split('.')
                selections.append(Law(nr, year))

        return selections

    @staticmethod
    def get(doc_identifier):
        nr, year = doc_identifier.split('-')
        path = os.path.join(settings.DATA_DIR, '%s.%s.xml' % (year, nr))
        with open(path) as f:
            content = f.read()

        return content

    @staticmethod
    def get_as_html(doc_identifier):
        doc = Law.get(doc_identifier)

        e = re.compile(r'<([a-z\-]+)( ?)([^>]*)\/>')
        doc = e.sub(r'<\1\2\3></\1>', doc)
        doc = doc.replace('<?xml version="1.0" ?>', '')

        return doc
