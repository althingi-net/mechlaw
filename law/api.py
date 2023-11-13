from law.models import Law
from lxml import etree
from lxml.etree import Element
from lxml.cssselect import CSSSelector
from ninja import NinjaAPI
from ninja.errors import HttpError

api = NinjaAPI()


def convert_to_text(element: Element):
    result = ""

    # Cluck together all text in all descendant nodes.
    for child in element.iterdescendants():
        result += child.text

    # Remove double spaces that may result from concatenation above.
    while "  " in result:
        result = result.replace("  ", " ")

    return result


@api.get("segment/")
def segment(request, law_nr: int, law_year: int, css_selector: str):
    law = Law("%s/%s" % (law_nr, law_year))

    selector = CSSSelector(css_selector)
    elements = selector(law.xml())

    # If more than one element is found, the search isn't specific enough.
    if len(elements) > 1:
        raise HttpError(400, "Request too unspecific; try narrowing it down.")

    # Expect exactly one element.
    try:
        element = elements[0]
    except IndexError:
        raise HttpError(404, "Could not find requested element.")

    text_result = convert_to_text(element)
    xml_result = etree.tostring(
        element, pretty_print=True, xml_declaration=False, encoding="utf-8"
    ).decode("utf-8")

    return {
        "text_result": text_result,
        "xml_result": xml_result,
    }
