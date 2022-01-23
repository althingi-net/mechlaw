class Law():
    legal_framework = 'is'

    nr = ''
    year = ''

    def __init__(self, nr, year):
        self.nr = nr
        self.year = year

    def url_identifier(self):
        return '%s-%s' % (self.nr, self.year)

    def __str__(self):
        return '%s/%s' % (self.nr, self.year)

