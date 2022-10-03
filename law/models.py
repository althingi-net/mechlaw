import os
import re
from django.conf import settings
from lxml import etree

class Law():

    identifier = ''

    nr = ''
    year = ''

    xml_content = ''
    html_content = ''

    def __init__(self, identifier):
        # FIXME: Sanitize the input and require `identifier` to make sense.
        self.identifier = identifier
        self.nr, self.year = identifier.split('/')

    def __str__(self):
        return self.identifier


    @staticmethod
    def list():

        laws = []

        index = etree.parse(os.path.join(settings.DATA_DIR, 'index.xml')).getroot()
        for node_law in index.findall('law'):
            law = Law(node_law.attrib['identifier'])
            laws.append(law)

        return laws


    def get_xml_content(self):
        '''
        Loads and returns the XML of the law.
        '''

        # Just return the content if we already have it.
        if len(self.xml_content) > 0:
            return self.xml_content

        # Construct full path to XML file.
        path = os.path.join(settings.DATA_DIR, f'{self.year}.{self.nr}.xml')

        # Open and load the XML content.
        with open(path) as f:
            self.xml_content = f.read()

        return self.xml_content


    def get_html_content(self):
        '''
        Loads and returns the HTML of the law.
        '''

        # Just return the content if we already have it.
        if len(self.html_content) > 0:
            return self.html_content

        # Make sure we have the XML.
        xml_content = self.get_xml_content()

        # Turn the XML into HTML.
        # FIXME: This could use some explaining. There is a difference between
        # XML and HTML, but it's not obvious from reading this.
        e = re.compile(r'<([a-z\-]+)( ?)([^>]*)\/>')
        html_content = e.sub(r'<\1\2\3></\1>', self.xml_content)
        html_content = html_content.replace('<?xml version="1.0" encoding="utf-8"?>', '').strip()

        # Assigned separately so that we never have half-completed conversion
        # stored. More principle than practice.
        self.html_content = html_content

        return self.html_content
