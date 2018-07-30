class Law():
    legal_framework = 'is'

    nr = ''
    year = ''
    parliament = ''

    def __init__(self, nr, year, parliament):
        self.nr = nr
        self.year = year
        self.parliament = parliament

    def url_identifier(self):
        return '%s-%s-%s' % (self.nr, self.year, self.parliament)

    def __str__(self):
        return '%s/%s (%s)' % (self.nr, self.year, self.parliament)

