
var IMG_BOX_WHITE = '/static/core/img/box-white.png';
var IMG_BOX_BLACK = '/static/core/img/box-black.png';

var footnote_num = 0;

// Entry function for references, merely for code organizational reasons.
var follow_refer = function() {
    var $refer = $(this);

    var refer_type = $refer.attr('type');
    if (!refer_type) {
        refer_type = 'legal-clause';
    }

    if (refer_type == 'legal-clause') {
        process_refer_legal_clause($refer);
    }
    else if (refer_type == 'law') {
        // Temporarily using process_refer_external, as opposed to its own
        // process_refer_law function. Processing will almost certainly been
        // done differently between these types, but for the timebeing they
        // are identical. It makes sense to make a semantic distinction
        // between them, though.
        process_refer_external($refer);
    }
    else if (refer_type == 'external') {
        process_refer_external($refer);
    }
}

// Process a reference that refers to a legal clause in Icelandic law.
var process_refer_legal_clause = function($refer) {

    if ($refer.attr('law-nr')) {
        quick_see(ERROR + ': ' + ERROR_NOT_IMPLEMENTED_YET, $refer);
        return;
    }

    $law = $refer.closest('law');

    var supported_tags = ['art', 'subart', 'numart'];

    var search_string = '';
    for (i in supported_tags) {
        var tag = supported_tags[i]
        var value = $refer.attr(tag);

        if (value) {
            // If the value contains "-", then we're looking for a range, like
            // "1-4". For example, if we're looking for subarticles 1-3 in
            // article 7, we need to expand the search string such that it
            // becomes:
            //     art[nr="7"] subart[nr="1"],art[nr="7"] subart[nr="2"]
            //
            // It is assumed that this only occurs at the deepest level of the
            // search. We cannot find subarticle 5 in articles 1-3, but we can
            // find subarticle 1-3 within article 5. It is currently assumed
            // that all legal text is compatible with this restriction.
            var minus_index = value.indexOf('-');
            if (minus_index > -1) {
                var first_value = parseInt(value.substring(0, minus_index));
                var last_value = parseInt(value.substring(minus_index + 1));

                // Keep a base of the search string compiled so far.
                var current_search_string = search_string;

                // Start with a clean slate for the total search string. What
                // has already been gathered is kept in current_search_string.
                // This variable can be thought of as the "result" variable,
                // eventually containing a comma-separated list of search
                // strings that will be used to find the content we need.
                search_string = '';

                // Compile a new search string for every value that we want to
                // find, and add to the total search string.
                for (var value = first_value; value <= last_value; value++) {
                    search_string += ',' + current_search_string + ' ' + tag + '[nr="' + value + '"]';
                }

                // Trim the comma from the first iteration, since commas
                // should only be between the things we want to find.
                search_string = search_string.replace(/^,/, '');
            }
            else {
                search_string += ' ' + tag + '[nr="' + value + '"]';
            }
        }
    }
    search_string = search_string.trim();

    var targets = $law.find(search_string);
    if (!targets.prop('tagName')) {
        quick_see(ERROR + ': ' + ERROR_CLAUSE_NOT_FOUND + ': ' + $refer.html(), $refer);
        return;
    }

    var content = '';
    for (var i = 0; i < targets.length; i++) {
        var target = targets[i];
        content += target.innerHTML + '<br />';
    }

    quick_see(content, $refer);
}


// Process a reference to an external location of some sort.
var process_refer_external = function($refer) {
    var href = $refer.attr('href');
    var name = $refer.attr('name');
    if (!name) {
        name = href;
    }
    quick_see('<a target="_blank" href="' + href + '">' + name + '</a>', $refer);
}


var process_footnote = function() {

    // Increase the number of the footnote associated with the current
    // article. First footnote is number 1, second is number 2 and so forth.
    footnote_num++;

    var $footnote = $(this);
    var $footnote_sen = $footnote.find('footnote-sen');

    // Show which portion of the law being displayed was changed.
    $footnote.find('location').each(function() {
        var $location = $(this);

        // Start with the entire law and narrow it down later. The variables
        // $start_mark and $end_mark denote the highlight's start point and
        // end point, respectively. In the beginning, they are both set to the
        // entire legal document's XML, but then narrowed down afterwards.
        // This means that each node in <location> narrows it down by one
        // step, until eventually we have the final node, which is the one
        // where the highlighting (or marking) should take place.
        //
        // Usually, the $start_mark and $end_mark end up being the same thing.
        // They are only different when the highlight covers a range of
        // entities.
        //
        // Marks are the same thing except they're not a range, but a single
        // point in the text. In those cases, the $end_mark is used, because
        // the mark should come after the located text.
        var $start_mark = $location.parent().parent().closest('law');
        var $end_mark = $location.parent().parent().closest('law');

        // Iterate through the <location> section to locate the text that we
        // want to show as changed.
        $location.find('art,subart,numart,nr-title,name,sen').each(function() {
            var $location_step = $(this);

            // Sometimes unusual placements of markers are required. An
            // example is a marker that starts at the beginning of an
            // article's name, and then highlights maybe 4 subarticles in a
            // 5-subarticle article, but doesn't cover the article in its
            // entirety. In these cases, it is necessary to specifify the
            // $start_mark and $end_mark more precisely through the XML, by
            // using <start> and <end> clauses in the <location> clause. They
            // work exactly like the <location> clause, except that <start>
            // only affects $start_mark and <end> only affects $end_mark.
            //
            // For this, we need to keep track of whether we're in a
            // <location>, <start> or <end> clause when deciding whether to
            // follow the next entity ("art", "subart", "numart" etc.). We do
            // this by iterating with temporary $start_mark and $end_mark
            // variables called $current_start_mark and $current_end_mark
            // respectively. Only afterwards do we decide whether we want to
            // actually use them or not, depending on which clause we happen
            // to be processing. If we're in a <location> cluse, we'll always
            // apply them both, but if we're in a <start> clause, we'll only
            // want to apply $current_start_mark to $start_mark, and if we're
            // in an <end> clause, we'll only want to apply $current_end_mark
            // to $end_mark.
            var location_clause = $location_step.parent().prop('tagName').toLowerCase();

            // Temporary variables to be applied later according to which
            // location clause we're in.
            var $current_start_mark = $start_mark;
            var $current_end_mark = $end_mark;

            var tag_name = $location_step.prop('tagName').toLowerCase();
            var nr = $location_step.text().trim();

            if (nr.length) {
                // Check if the number is a range, for example "1-4", which
                // would mean that the highlighting should start at entity nr.
                // 1 (for example, article 1) and end at entity nr. 4 (for
                // example, article 4).
                var minus_index = nr.indexOf('-');
                if (minus_index > -1) {
                    var start_i = nr.substring(0, minus_index);
                    var end_i = nr.substring(minus_index + 1);
                }
                else {
                    var start_i = nr;
                    var end_i = nr;
                }

                // If we cannot find an element explicitly numbered according
                // to what's being requested, we will try to figure it out.
                //
                // Note that our iterators, start_i and end_i, actually start
                // at 1 instead of 0.
                $start_check = $current_start_mark.find(tag_name + '[nr="' + start_i + '"]');
                $end_check = $current_end_mark.find(tag_name + '[nr="' + end_i + '"]');

                // If the attempt did not result in a valid node, it means
                // that there is none explicitly ordered as the one requested.
                if ($start_check.prop('tagName')) {
                    $current_start_mark = $start_check;
                }
                else {
                    $current_start_mark = $current_start_mark.find(tag_name + ':eq(' + String(parseInt(start_i) - 1) + ')');
                }

                // Same story as with $current_start_mark above.
                if ($end_check.prop('tagName')) {
                    $current_end_mark = $end_check;
                }
                else {
                    $current_end_mark = $current_end_mark.find(tag_name + ':eq(' + String(parseInt(end_i) - 1) + ')');
                }
            }
            else {
                // If no number is requested (f.e. article 3 or subarticle 5),
                // we will assume the first node with the given tag name.
                $current_start_mark = $current_start_mark.find(tag_name).first();
                $current_end_mark = $current_end_mark.find(tag_name).first();
            }

            // We may need to access the $location_step node from $start_mark
            // or $end_mark when adding markers later on, for example to get
            // the "words" attribute.
            $current_start_mark.location_node = $location_step;
            $current_end_mark.location_node = $location_step;

            // We don't necessarily want to apply our conclusion unless we're
            // in the proper location clause. See comment above describing
            // $current_start_mark, $current_end_mark and location_clause.
            if (location_clause == 'location') {
                $start_mark = $current_start_mark;
                $end_mark = $current_end_mark;
            }
            else if (location_clause == 'start') {
                $start_mark = $current_start_mark;
            }
            else if (location_clause == 'end') {
                $end_mark = $current_end_mark;
            }

        });

        // Let's be nice to XML writers and tell them what's wrong.
        if (!$start_mark.prop('tagName')) {
            var art_num = $location.closest('art').attr('nr');
            console.error('Invalid location in footnote nr. ' + footnote_num + ' in article nr. ' + art_num);
            return;
        }

        /***********************************************/
        /* Add markers to denote the highlighted area. */
        /***********************************************/

        // Short-hands.
        var tag_name = $start_mark.prop('tagName').toLowerCase(); // $start_mark arbitrarily chosen.
        var location_type = $location.attr('type');
        var words = $start_mark.location_node.attr('words');

        // A space occurs before the closing mark if it's inside a
        // 'nr-title'tag. We don't know why this is.
        var pre_close_space = false;
        if ($end_mark.prop('tagName').toLowerCase() == 'nr-title') {
            pre_close_space = true;
        }

        if (words) {
            // If specific words are specified, things get rather simple and
            // we can just replace the existing text with itself plus the
            // relevant symbols for denoting ranges and points.

            var seek_text = words;
            var replace_text = null;
            var ends_with_dot = null;

            // When a change is marked at the end of a sentence, the markers
            // stay around the changed text itself, but the footnote number
            // goes after the dot, so like: "[some text]. 2)" instead of
            // "[some text] 2).".

            // Figure out if the replaced text is at the end of a sentence.
            var end_of_words = $start_mark.html().indexOf(words) + words.length;
            ends_with_dot = $start_mark.html().substring(end_of_words, end_of_words + 1) == '.';

            if (location_type == 'range') {
                replace_text = '[' + words + (pre_close_space ? ' ' : '') + ']' + (ends_with_dot ? '.' : '') + ' <sup>' + footnote_num + ')</sup>';
            }
            else if (location_type == 'point') {
                replace_text = words + (ends_with_dot ? '.' : '') + ' <sup>' + footnote_num + ')</sup>'
            }

            // If the replaced text is at the end of a sentence, we wish to
            // replace the words including the dot.
            if (ends_with_dot) {
                seek_text = words + '.';
            }

            $start_mark.html($start_mark.html().replace(
                seek_text,
                replace_text
            ));
        }
        else {
            if (location_type == 'range') {
                // If there is a <nr-title> tag, we'll want to skip that, so
                // that the opening bracket is placed right after it.
                var $nr_title = $start_mark.find('> nr-title');
                if ($nr_title.length > 0) {
                    $start_mark.find('nr-title').next().first().prepend('[');
                }
                else {
                    // Most entities, like articles, subarticles, numeric
                    // articles and such have children <sen> nodes which
                    // contain the content. An occasional node does not, for
                    // example <name> and of course <sen> itself. We therefore
                    // check if the node has any <sen> children nodes, and if
                    // so, we will call the first one an opening node and
                    // append the opening bracket, but otherwise we'll use the
                    // $start_mark itself as the opening node, since it must
                    // then be one of the special nodes like <name> or <sen>.
                    var $opening_node = $start_mark.find('sen').first();
                    if (!$opening_node.prop('tagName')) {
                        $opening_node = $start_mark;
                    }
                    $opening_node.prepend('[');
                }

                append_closing_text = (pre_close_space ? ' ' : '') + '] <sup>' + footnote_num + ')</sup> ';
            }
            else if (location_type == 'point') {
                append_closing_text = ' <sup>' + footnote_num + ')</sup>'
            }

            // Like with the opening node, we'll need to check if the
            // $end_mark has <sen> children to which the closing bracket
            // should be appended. If not, we'll append the closing bracket to
            // $end_node itself, just like we did with $start_node.
            var $closing_node = $end_mark.find('sen').last();
            if (!$closing_node.prop('tagName')) {
                $closing_node = $end_mark;
            }
            $closing_node.append(append_closing_text);
        }
    });

    // Add the superscripted iterator to the displayed label.
    $footnote_sen.before('<sup>' + footnote_num + ')</sup>');

    // Activate internal HTML inside the footnote, which is escaped for XML
    // compatibility reasons. It's not possible to use <![CDATA[]]> in HTML,
    // and we don't want HTML inside XML elements, because then validators
    // would understand it as a part of the XML's structure, when in fact it's
    // just content intended for a browser.
    $footnote_sen.html($footnote_sen.html().replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>'));

    // Turn the displayed label into a link.
    var href = $footnote.attr('href');
    if (href) {
        $footnote_sen.html('<a href="' + href + '" target="_blank">' + $footnote_sen.html() + '</a>');
    }

}


var process_law = function() {
    var $law = $(this);

    // Check if a URL to the official location of the law has been provided.
    // If so, we'll display a little Althingi icon with a link to it.
    var href = $law.attr('href');
    if (href) {
        var $name = $law.find('> name');
        var img = ' <a target="_blank" href="' + href + '"><img src="/static/core/img/parliament-tiny.png" /></a>';
        $name.append(img);
    }
}


var process_art = function() {
    $(this).prepend($('<img class="box" src="' + IMG_BOX_BLACK + '" />'));
}

var process_subart = function() {
    $(this).prepend($('<img class="box" src="' + IMG_BOX_WHITE + '" />'));
}

$(document).ready(function() {

    $('footnotes').show();

    $('footnotes').each(function() {
        footnote_num = 0;
        $(this).find('footnote').each(process_footnote);
    });

    $('law').each(process_law);
    $('law > chapter > art').each(process_art);
    $('law > chapter > art > subart').each(process_subart);

    // Make references show what they're referring to on moues-over.
    $('refer').on('mouseenter', follow_refer);

});
