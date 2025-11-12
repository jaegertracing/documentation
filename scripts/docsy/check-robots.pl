#!/usr/bin/env perl
use strict;
use warnings;
use Getopt::Long;

my $baseURL = 'https://www.jaegertracing.io';
# Another example:'https://deploy-preview-1021--jaegertracing.netlify.app';

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
