
var IMG_BOX_WHITE = '/static/core/img/box-white.png';
var IMG_BOX_BLACK = '/static/core/img/box-black.png';

var footnote_num = 0;

var process_footnote = function() {

    // Increase the number of the footnote associated with the current
    // article. First footnote is number 1, second is number 2 and so forth.
    footnote_num++;

    var $footnote = $(this);

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
        $location.children().each(function() {
            var $location_step = $(this);

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

                $start_mark = $start_mark.find(tag_name + '[nr="' + start_i + '"]');
                $end_mark = $end_mark.find(tag_name + '[nr="' + end_i + '"]');
            }
            else {
                // If no number is specified (f.e. article 3 or subarticle 5),
                // we will assume the first node with the given tag name.
                $start_mark = $start_mark.find(tag_name).first();
                $end_mark = $end_mark.find(tag_name).first();
            }

            $start_mark.location_node = $location_step;
            $end_mark.location_node = $location_step;

        });

        if (!$start_mark.prop('tagName')) {
            var art_num = $location.closest('art').attr('nr');
            console.error('Invalid location in footnote nr. ' + footnote_num + ' in article nr. ' + art_num);
            return;
        }

        // Add markers to denote the highlighted area.
        var tag_name = $start_mark.prop('tagName').toLowerCase(); // $start_mark arbitrarily chosen.
        if (tag_name == 'art' || tag_name == 'subart' || tag_name == 'numart' || tag_name == 'name') {
            var location_type = $location.attr('type');
            var words = $start_mark.location_node.attr('words');

            if (location_type == 'range') {
                if (words) {
                    // If specific words are to be highlighted, we'll just
                    // replace them with themselves, highlighted.
                    $start_mark.html($start_mark.html().replace(
                        words,
                        '[' + words + '] <sup>' + footnote_num + ')</sup> '
                    ));
                }
                else {
                    // If there is a <nr-title> tag, we'll want to skip that,
                    // so that the opening bracket is placed right after it.
                    var $nr_title = $start_mark.find('nr-title');
                    if ($nr_title.length > 0) {
                        $start_mark.find('nr-title').next().first().prepend('[');
                    }
                    else {
                        // Most entities, like articles, subarticles, numeric
                        // articles and such have children nodes which contain
                        // content. An occasional node does not, for example
                        // <name>. We therefore check if the node has children
                        // nodes, and if so, we will call the first one an
                        // opening node and append the opening bracket, but
                        // otherwise we'll use the $start_mark itself as the
                        // opening node.
                        var $opening_node = $start_mark.children().first();
                        if (!$opening_node.prop('tagName')) {
                            $opening_node = $start_mark;
                        }
                        $opening_node.prepend('[');
                    }

                    // Like with the opening node, we'll need to check if the
                    // $end_mark has children to which the closing bracket
                    // should be appended. If not, we'll append the closing
                    // bracket to $end_node itself.
                    var $closing_node = $end_mark.find('sen').last();
                    if (!$closing_node.prop('tagName')) {
                        $closing_node = $end_mark;
                    }
                    $closing_node.append('] <sup>' + footnote_num + ')</sup> ');
                }
            }
            else if (location_type == 'mark') {
                $end_mark.html($end_mark.html().replace(
                    words,
                    words + '<sup>' + footnote_num + ')</sup>'
                ));
            }
        }
    });

    // Add the superscripted iterator to the displayed label.
    $footnote.find('footnote-sen').before('<sup>' + footnote_num + ')</sup>');

    // Turn the displayed label into a link.
    var href = $footnote.attr('href');
    if (href) {
        var current_html = $footnote.find('footnote-sen').html();
        $footnote.find('footnote-sen').html('<a href="' + href + '" target="_blank">' + current_html + '</a>');
    }

}

var process_art = function() {
    $(this).find('nr-title').first().prepend($('<img class="box" src="' + IMG_BOX_BLACK + '" />'));
}

var process_subart = function() {
    $(this).children().first().prepend($('<img class="box" src="' + IMG_BOX_WHITE + '" />'));
}

$(document).ready(function() {

    $('footnotes').show();

    $('footnotes').each(function() {
        footnote_num = 0;
        $(this).find('footnote').each(process_footnote);
    });

    $('law > chapter > art').each(process_art);
    $('law > chapter > art > subart').each(process_subart);

});
