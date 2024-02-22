from copy import deepcopy
from core.exceptions import ReferenceParsingException


def fetch_nr(word):
    """
    Utility function to return the number or letter of a reference part.
    Examples:
        "3. gr." should return "3"
        "B-lið" should return "B"
    """
    if word[-4:] == "-lið":
        nr = word[: word.find("-")]
    else:
        nr = word.strip(".")

    return nr


def make_css_selector(words: str):
    # This gets converted into the CSS selector later. The reason for these
    # being separate variables is specific to CSS due to how `or` in CSS is
    # only possible using multiple selectors.
    trails = []
    current_trail = []

    while len(words) > 0:
        next_word = words.pop(0)
        step = None
        if next_word == "gr":
            step = {"tag": "art", "nr": fetch_nr(words[0])}
            current_trail.append(step)
            words.pop(0)
        elif next_word == "mgr":
            step = {"tag": "subart", "nr": fetch_nr(words[0])}
            current_trail.append(step)
            words.pop(0)
        elif next_word == "tölul":
            step = {"tag": "numart", "nr": fetch_nr(words[0])}
            current_trail.append(step)
            words.pop(0)
        elif next_word[-4:] == "-lið":
            step = {"tag": "numart", "nr": fetch_nr(next_word)}
            current_trail.append(step)
        elif next_word == "eða":
            # Dump what we have and move on with the second trail.
            trails.append(deepcopy(current_trail))
            current_trail[-1]["nr"] = fetch_nr(words[0])
            words.pop(0)
        else:
            raise ReferenceParsingException(next_word)

    # Add the last trail worked on, which will typically be the only one.
    trails.append(current_trail)

    # Turn the trails into a CSS selector.
    selector = ""
    for trail in trails:
        sub_selector = ""
        for step in trail:
            sub_selector += ' %s[nr="%s"]' % (step["tag"], step["nr"])
        selector += "," + sub_selector
    selector = selector.strip(",").strip()

    return selector
