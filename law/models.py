import os
import re
from django.conf import settings
from lxml import etree


class LawManager():

    @staticmethod
    def list():

        laws = []

        index = etree.parse(os.path.join(settings.DATA_DIR, 'index.xml')).getroot()
        for node_law_entry in index.findall('law'):

            law = Law(node_law_entry.attrib['identifier'], node_law_entry)

            laws.append(law)

        return laws


class Law():

    def __init__(self, identifier, node_law_entry=None):
        # FIXME: Sanitize the input and require `identifier` to make sense.

        # I was here. Working on making the index awesomer. Also check `lagasafn-xml`.

        self._identifier = identifier
        self._name = ''

        self._xml_content = ''
        self._html_content = ''

        self.nr, self.year = self._identifier.split('/')

        if node_law_entry is not None:
            self._name = node_law_entry.attrib['name']


    @property
    def identifier(self):
        return self._identifier


    @property
    def name(self):
        return self._name


    @property
    def xml_content(self):
        '''
        Loads and returns the XML of the law.
        '''

        # Just return the content if we already have it.
        if len(self._xml_content) > 0:
            return self._xml_content

        # Construct full path to XML file.
        path = os.path.join(settings.DATA_DIR, f'{self.year}.{self.nr}.xml')

        # Open and load the XML content.
        with open(path) as f:
            self._xml_content = f.read()

        return self._xml_content


    def html_content(self):
        '''
        Loads and returns the HTML of the law.
        '''

        # Just return the content if we already have it.
        if len(self._html_content) > 0:
            return self._html_content

        # Make sure we have the XML.
        xml_content = self.xml_content

        # Turn the XML into HTML.
        # FIXME: This could use some explaining. There is a difference between
        # XML and HTML, but it's not obvious from reading this.
        e = re.compile(r'<([a-z\-]+)( ?)([^>]*)\/>')
        html_content = e.sub(r'<\1\2\3></\1>', self._xml_content)
        html_content = html_content.replace('<?xml version="1.0" encoding="utf-8"?>', '').strip()

        # Assigned separately so that we never have half-completed conversion
        # stored. More principle than practice.
        self._html_content = html_content

        return self._html_content


    def __str__(self):
        return self.identifier
