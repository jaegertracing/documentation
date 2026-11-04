#!/usr/bin/env perl
#
# This script prints the <meta name="robots"> tag of one or more pages on the
# published site, so that a maintainer can confirm which pages search engines
# may index. Only the latest docs version is meant to be indexed: hugo.yaml
# enables the tag, and the _index.md of every other version cascades
# `robots: false` to its pages. Nothing in CI runs this script.
#
# Usage: ./check-robots.pl [--url BASE_URL] [path-or-url ...]
#   ./check-robots.pl /docs/latest/ /docs/2.10/
#   ./check-robots.pl --url https://deploy-preview-1021--jaegertracing.netlify.app /docs/latest/
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
