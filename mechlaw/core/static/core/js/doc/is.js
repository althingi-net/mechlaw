
var footnote_num = 0;

var process_changed_by = function() {

    // Increase the number of the footnote associated with the current
    // article. First footnote is number 1, second is number 2 and so forth.
    footnote_num++;

    var $changing_law = $(this);

    // Show which portion of the law being displayed was changed.
    $changing_law.find('changed-portion').each(function() {
        var $portion = $(this);

        // Start with the entire law and narrow it down later. The variables
        // $start_mark and $end_mark denote the highlight's start point and
        // end point, respectively. In the beginning, they are both set to the
        // entire legal document's XML, but then narrowed down afterwards.
        // This means that each node in <changed-portion> narrows it down by
        // one step, until eventually we have the final node, which is the one
        // where the highlighting should take place. Usually, the $start_mark
        // and $end_mark end up being the same thing. They are only different
        // when the highlight covers a range of entities.
        var $start_mark = $portion.parent().parent().closest('law');
        var $end_mark = $portion.parent().parent().closest('law');

        // Iterate through the <changed-portion> section to locate the text
        // that we want to show as changed.
        $portion.children().each(function() {
            var $location_node = $(this);

            var tag_name = $location_node.prop('tagName').toLowerCase();
            var value = $location_node.text();

            // Check if the value is a range, for example "1-4", which would
            // mean that the highlighting should start at entity nr. 1 (for
            // example, article 1) and end at entity nr. 4 (for example,
            // article 4).
            var minus_index = value.indexOf('-');
            if (minus_index > -1) {
                var start_i = value.substring(0, minus_index);
                var end_i = value.substring(minus_index + 1);
            }
            else {
                var start_i = value;
                var end_i = value;
            }

            // For every tag we find, we look deeper into the XML.
            $start_mark = $start_mark.find(tag_name + '[nr="' + start_i + '"]');
            $end_mark = $end_mark.find(tag_name + '[nr="' + end_i + '"]');
            $start_mark.location_node = $location_node;
            $end_mark.location_node = $location_node;

        });

        // Add markers to denote the highlighted area.
        var tag_name = $start_mark.prop('tagName').toLowerCase(); // $start_mark arbitrarily chosen.
        if (tag_name == 'art' || tag_name == 'subart' || tag_name == 'numart') {
            var words = $start_mark.location_node.attr('words');

            if (words) {
                // If specific words are to be highlighted, we'll just
                // replace them with themselves, highlighted.
                $start_mark.html($start_mark.html().replace(
                    words,
                    '[' + words + ']<sup>' + footnote_num + '</sup> '
                ));
            }
            else {
                // Otherwise, we'll highlight the last mark. If there is a
                // <nr-title> tag, we'll want to skip that, so that the
                // opening bracket is placed right after it.
                var $nr_title = $start_mark.find('nr-title');
                if ($nr_title.length > 0) {
                    $start_mark.find('nr-title').next().first().prepend('[');
                }
                else {
                    $start_mark.children().first().prepend('[');
                }
                $end_mark.find('sen').last().append(' ]<sup>' + footnote_num + '</sup> ');
            }
        }
    });

    // Add the superscripted iterator to the displayed label.
    $changing_law.find('change-sen').before('<sup>' + footnote_num + ')</sup>');

    // Turn the displayed label into a link.
    var href = $changing_law.attr('href');
    if (href) {
        var current_html = $changing_law.find('change-sen').html();
        $changing_law.find('change-sen').html('<a href="' + href + '" target="_blank">' + current_html + '</a>');
    }

}



$(document).ready(function() {

    $('footnotes').each(function() {
        footnote_num = 0;
        $(this).find('changing-law').each(process_changed_by);

    });

});
