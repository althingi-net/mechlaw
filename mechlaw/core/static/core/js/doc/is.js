$(document).ready(function() {

    var change_number = 0;

    $('changed-by changing-law').each(function() {
        var $changing_law = $(this);

        change_number++;

        // Show which portion of the law being displayed was changed.
        $changing_law.find('changed-portion').each(function() {
            var $portion = $(this);

            // Start with the entire law and narrow it down later. $mark is
            // perhaps not a very well named variable, but at any rate, it
            // means the section of text in the law, that was changed.
            var $mark = $portion.parent().parent().closest('law');

            // Iterate through the <changed-portion> section to locate the
            // text that we want to show as changed.
            $portion.children().each(function() {
                var $child = $(this);

                var tag_name = $child.prop('tagName').toLowerCase();
                var value = $child.text();

                // For every tag we find, we look deeper into the XML.
                $mark = $mark.find(tag_name + '[nr="' + value + '"]');

            });

            // Add the markers for changed text and enumerate the changes according to order.
            var tag_name = $mark.prop('tagName').toLowerCase();
            if (tag_name == 'numart') {
                $mark.find('nr-title').first().append(' [ ');
                $mark.children().last().append(' ]<sup>' + change_number + '</sup> ');
            }

        });

        // Add the superscripted iterator to the displayed label.
        $changing_law.find('sen').before('<sup>' + change_number + ')</sup>');

        // Turn the displayed label into a link.
        var href = $changing_law.attr('href');
        if (href) {
            var current_html = $changing_law.find('sen').html();
            $changing_law.find('sen').html('<a href="' + href + '">' + current_html + '</a>');
        }

    });

});
