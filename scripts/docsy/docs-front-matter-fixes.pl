#!/usr/bin/env perl

use strict;
use warnings;
use File::Find;
use YAML::XS;
use File::Spec;

# Function to update YAML front matter
sub update_front_matter {
    my ($file, $updates) = @_;

    # Skip if file doesn't exist
    return unless -f $file;

    # Read file content
    local $/;  # Enable slurp mode
    open(my $fh, '<', $file) or return;  # Skip if can't open
    my $content = <$fh>;
    close($fh);

    if ($content =~ /^(---\n)(.*?\n)---\n(.*)/s) {
        my $pre = $1;
        my $yaml = $2;
        my $post = $3;

        # Load the YAML data
        my $data = eval { Load($yaml) } || {};
        if ($@) {
            warn "Error parsing YAML in $file: $@\n";
            return;
        }

        # Preserve children if they exist in the content
        if ($post =~ /^children:\n(.*?)(?=\n[^\s]|\z)/s) {
            $data->{children} = Load("children:\n$1");
            $post =~ s/^children:\n(.*?)(?=\n[^\s]|\z)//s;
            $post =~ s/^---\n//;  # Remove any extra front matter delimiter
        }

        # Update existing keys in-place in the original YAML
        foreach my $key (keys %$updates) {
            my $value = $updates->{$key};
            if (exists $data->{$key}) {
                # Key exists, update in-place
                $yaml =~ s/^($key\s*:).*$/$1 $value/m;
            } else {
                # Key doesn't exist, append it
                $yaml .= "$key: $value\n";
            }
            # Update the data structure too
            $data->{$key} = $value;
        }

        # Write back
        my $new_content = $pre . $yaml . "---\n" . $post;

        open(my $out, '>', $file) or warn "Cannot write to $file: $!\n" and return;
        print $out $new_content;
        close($out);
        print "Updated $file\n";
    }
}

# Process files in the version directory
sub process_version_dir {
    my ($dir) = @_;

    # Extract version from directory path or use 2.99 for non-versioned directories
    my ($major, $minor) = (2, 99);  # Default for non-versioned directories
    if ($dir =~ m|content/docs/v(\d+)/(\d+\.\d+)|) {
        ($major, $minor) = ($1, $2);
        $minor =~ s/^\d+\.//;  # Extract minor version number
    }
    my $version = "$major.$minor";

    # Add comment for non-versioned directories
    my $version_comment = "";
    if ($dir !~ m|content/docs/v\d+/\d+\.\d+|) {
        $version_comment = "# TODO: Replace 99 with actual MINOR version number\n";
    }

    # Process only specific files according to README
    my @files_to_process = (
        ["_index.md", sub {
            my ($filepath) = @_;
            # For _dev directories, don't update weight and linkTitle
            if ($filepath =~ m|/_dev/|) {
                return { title => "Docs ($version)" };
            } else {
                return {
                    title => "Docs ($version)",
                    linkTitle => "'$version'",
                    weight => -1 * (200 + $minor)
                };
            }
        }],
        ["getting-started.md", {
            weight => 1
        }],
        ["features.md", {
            weight => 2
        }],
        ["faq.md", {
            linkTitle => 'FAQ'
        }]
    );

    # Process each file
    for my $file_info (@files_to_process) {
        my ($filename, $updates) = @$file_info;
        my $filepath = File::Spec->catfile($dir, $filename);
        next unless -f $filepath;  # Skip if file doesn't exist

        # Add version comment if needed
        if ($version_comment && $filename eq "_index.md") {
            local $/;  # Enable slurp mode
            open(my $fh, '<', $filepath) or next;
            my $content = <$fh>;
            close($fh);

            # Add comment before first front matter delimiter
            $content =~ s/^---/$version_comment---/;

            open(my $out, '>', $filepath) or next;
            print $out $content;
            close($out);
        }

        # Get updates, handling the case where it's a callback
        my $file_updates = ref($updates) eq 'CODE' ? $updates->($filepath) : $updates;

        # Update front matter
        update_front_matter($filepath, $file_updates);
    }
}

# Check command line argument
die "Usage: $0 <version-directory>\nExample: $0 content/docs/v2/2.6\n" unless @ARGV == 1;
my $version_dir = $ARGV[0];
die "Directory $version_dir does not exist\n" unless -d $version_dir;

# Process the directory
process_version_dir($version_dir);

print "Cleanup completed.\n";