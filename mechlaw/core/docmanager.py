import os

from django.conf import settings

class DocManager():

    @staticmethod
    def _objectify(filename):
        if settings.LEGAL_FRAMEWORK == 'is':
            from doctypes.framework_is.law import Law
            year, nr, parliament, ending = filename.split('.')
            return Law(nr, year, parliament)
        else:
            return filename

    @staticmethod
    def _doc_dir(doc_type):
        lf = settings.LEGAL_FRAMEWORK
        return os.path.join(settings.BASE_DIR, 'data', lf, doc_type)

    @staticmethod
    def list(doc_type):

        selections = []

        path = DocManager._doc_dir(doc_type)

        for filename in os.listdir(path):
            if filename[-4:] == '.xml':
                selections.append(DocManager._objectify(filename))

        return selections

    @staticmethod
    def get(doc_type, doc_identifier):
        if settings.LEGAL_FRAMEWORK == 'is':
            nr, year, parliament = doc_identifier.split('-')
            path = os.path.join(DocManager._doc_dir(doc_type), '%s.%s.%s.xml' % (year, nr, parliament))
            with open(path) as f:
                content = f.read()

            return content