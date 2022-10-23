'''
The purpose of these models is to return the XML data in a form that is
suitable for JSON output or for use in a template. In essence, to alleviate
XML work from other parts of this system, or any other system communicating
with this one.
'''
import os
import re
from django.conf import settings
from lxml import etree


class LawManager():

    @staticmethod
    def index():

        # FIXME: This XML should be automatically converted to JSON using
        # some 3rd party library, instead of being converted from one ad-hoc
        # format to another ad-hoc format here.

        # Return variables.
        stats = {}
        laws = []

        # Read and parse the index file.
        index = etree.parse(os.path.join(settings.DATA_DIR, 'index.xml')).getroot()

        # Gather statistics.
        for node_stat in index.findall('stats/'):

            # Dashes are preferred in XML but underscores are needed in
            # templates.
            var_name = node_stat.tag.replace('-', '_')

            try:
                # Convert the value to integer if it's an integer.
                var_value = int(node_stat.text)
            except ValueError:
                # Whatever. It's something else.
                var_value = node_stat.text

            stats[var_name] = var_value

        # Gather the laws in the index.
        for node_law_entry in index.findall('law-entries/law-entry'):
            if node_law_entry.find('meta/is-empty').text == 'true':
                continue

            laws.append(LawEntry(node_law_entry))

        return stats, laws


class LawEntry():
    '''
    Intermediary model for a legal entry in the index.
    '''
    def __init__(self, node_law_entry):
        self.identifier = node_law_entry.find('identifier').text
        self.name = node_law_entry.find('name').text
        self.chapter_count = int(node_law_entry.find('meta/chapter-count').text)
        self.art_count = (node_law_entry.find('meta/art-count').text)

    def __str__(self):
        return self.identifier


class Law():

    def __init__(self, identifier):
        self.identifier = identifier

        # Private containers, essentially for caching.
        self._xml = None
        self._name = ''
        self._xml_text = ''
        self._html_text = ''

        self.nr, self.year = self.identifier.split('/')


    def name(self):
        if len(self._name):
            return self._name

        # Has its own cache mechanism, so this is fast.
        xml = self.xml()

        self._name = xml.find('name').text

        return self._name


    def path(self):
        return os.path.join(settings.DATA_DIR, f'{self.year}.{self.nr}.xml')


    def xml(self):
        '''
        Returns the law in XML object form.
        '''
        if self._xml is None:
            self._xml = etree.parse(self.path())

        return self._xml


    def xml_text(self):
        '''
        Returns the law in XML text form.
        '''

        # Just return the content if we already have it.
        if len(self._xml_text) > 0:
            return self._xml_text

        # Open and load the XML content.
        with open(self.path()) as f:
            self._xml_text = f.read()

        return self._xml_text


    def html_text(self):
        '''
        Returns the law in HTML text form.
        '''

        # Just return the content if we already have it.
        if len(self._html_text) > 0:
            return self._html_text

        # Make sure we have the XML.
        xml_text = self.xml_text()

        # Turn the XML into HTML.
        # FIXME: This could use some explaining. There is a difference between
        # XML and HTML, but it's not obvious from reading this.
        e = re.compile(r'<([a-z\-]+)( ?)([^>]*)\/>')
        result = e.sub(r'<\1\2\3></\1>', xml_text)
        result = result.replace('<?xml version="1.0" encoding="utf-8"?>', '').strip()

        # Assigned separately so that we never have half-completed conversion
        # stored. More principle than practice.
        self._html_text = result

        return self._html_text


    def __str__(self):
        return self.identifier
