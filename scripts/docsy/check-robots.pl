#!/usr/bin/env perl
#
# This script prints the <meta name="robots"> tag of one or more pages on the
# published site, so that a maintainer can confirm which pages search engines
# may index. The head.html partial in themes/docsy-overrides emits the tag on
# every page: "index, follow" when the page's `robots` param is not false,
# which hugo.yaml sets as the site default, and "noindex, nofollow" otherwise.
# The _index.md of each docs version sets the param through `cascade`, so
# that search engines index only the current v1 and v2 docs and the dev docs.
# Nothing in CI runs this script.
#
# The check is only meaningful against the production site. A Netlify preview
# is built in the dev environment, where head.html emits "noindex, nofollow"
# for every page regardless of the front matter.
#
# Usage: ./check-robots.pl [--url BASE_URL] [path-or-url ...]
#   ./check-robots.pl /docs/latest/ /docs/2.10/
#
use strict;
use warnings;
use Getopt::Long;

my $baseURL = 'https://www.jaegertracing.io';

GetOptions( 'url=s' => \$baseURL ) or die "Usage: $0 [--url URL] [path ...]\n";

my @inputs = @ARGV ? @ARGV : ('/');
my $base = $baseURL;

for my $input (@inputs) {
    my $url = $input =~ m{^https?://}i ? $input
      : $base . ( $input =~ m{^/} ? $input : "/$input" );

    my $content = qx{curl -fsSL "$url"};
    if ( $? != 0 ) {
        my $status = $? >> 8;
        warn "Error fetching $url (curl exit $status)\n";
        next;
    }

    if ( $content =~ /<meta\b[^>]*?name=(["']?)robots\1[^>]*?>/i ) {
        my $tag = $&;
        if ( $tag =~ /content=(["']?)([^"'>]*)\1/i ) {
            print "$url -> robots: $2\n";
            next;
        }
    }

    print "$url -> (no <meta name=\"robots\"> tag found)\n";
}
