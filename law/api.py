from copy import deepcopy
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


@api.get("parse-reference/")
def parse_reference(request, reference):
    # TODO: Sanity check on reference to prevent garbage input.
    # ...

    def fetch_nr(words):
        """
        Utility function expected to get more complicated later.
        """
        nr = words.pop(0).strip(".")
        return nr

    law_nr = None
    law_year = None

    # Turn reference into words that we will parse one by one, but backwards,
    # because human-readable addressing has the most precision in the
    # beginning ("1. tölul. 2. gr. laga nr. 123/2000") but data addressing the
    # other way around.
    words = reference.split(" ")
    words.reverse()

    # Parse law number and year if they exist.
    if "/" in words[0] and words[1] == "nr.":
        law_nr, law_year = words[0].split("/")
        words.pop(0)
        words.pop(1)

    # Map of known human-readable separators and their mappings into elements.
    known_seps = {
        "gr.": "art",
    }

    # Look for a known separator, forwarding over the possible name of the law
    # and removing it, since it's not useful.
    known_sep_found = False
    while not known_sep_found:
        if words[0] in known_seps:
            known_sep_found = True
        else:
            words.pop(0)

    # At this point the remaining words should begin with something we can
    # process into a location inside a document.

    # This gets converted into the CSS selector later.
    trails = []
    current_trail = []

    while len(words) > 0:
        word = words.pop(0)
        step = None
        if word == "gr.":
            step = {"tag": "art", "nr": fetch_nr(words)}
            current_trail.append(step)
        elif word == "mgr.":
            step = {"tag": "subart", "nr": fetch_nr(words)}
            current_trail.append(step)
        elif word == "tölul.":
            step = {"tag": "numart", "nr": fetch_nr(words)}
            current_trail.append(step)
        elif word == "eða":
            # Dump what we have and move on with the second trail.
            trails.append(deepcopy(current_trail))
            current_trail[-1]["nr"] = fetch_nr(words)
        else:
            raise HttpError(500, "Confused by: %s" % word)

    # Add the last trail worked on, which will typically be the only one.
    trails.append(current_trail)

    # Turn the trails into a CSS selector.
    selector = ""
    for trail in trails:
        sub_selector = ""
        for step in trail:
            sub_selector += ' %s[nr="%s"]' % (step["tag"], step["nr"])
        selector += "," + sub_selector
    selector = selector.strip(",")

    # Also return the segment, since now we have the selector.
    segment = get_segment(request, law_nr, law_year, selector)["segment"]

    return {
        "selector": selector,
        "law_nr": law_nr,
        "law_year": law_year,
        "segment": segment,
        # "reference": reference,
        # "trails": trails,  # Debug
        # "words": words,  # Debug
    }


@api.get("segment/")
def get_segment(request, law_nr: int, law_year: int, css_selector: str):
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
        "segment": {
            "text_result": text_result,
            "xml_result": xml_result,
        }
    }
