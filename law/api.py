from law.exceptions import LawException
from law.models import Law
from lxml import etree
from lxml.etree import Element
from lxml.cssselect import CSSSelector
from ninja import NinjaAPI
from ninja.errors import HttpError
from typing import List

api = NinjaAPI()


def convert_to_text(elements: List[Element]):
    result = ""

    # Cluck together all text in all descendant nodes.
    for element in elements:
        for child in element.iterdescendants():
            result += child.text.strip() + " "
        result = result.strip() + "\n"

    # Remove double spaces that may result from concatenation above.
    while "  " in result:
        result = result.replace("  ", " ")

    return result


@api.get("segment/")
def segment(request, law_nr: int, law_year: int, css_selector: str):
    try:
        law = Law("%s/%s" % (law_nr, law_year))
    except LawException as ex:
        raise HttpError(400, ex.args[0])

    selector = CSSSelector(css_selector)
    elements = selector(law.xml())

    if len(elements) == 0:
        raise HttpError(404, "Could not find requested element.")

    text_result = convert_to_text(elements)
    xml_result = [
        etree.tostring(
            element, pretty_print=True, xml_declaration=False, encoding="utf-8"
        ).decode("utf-8")
        for element in elements
    ]

    return {
        "text_result": text_result,
        "xml_result": xml_result,
    }
