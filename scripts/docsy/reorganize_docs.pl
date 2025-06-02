#!/usr/bin/env perl
# cSpell:ignore newdir catfile opendir closedir

use strict;
use warnings;
use File::Basename;
use File::Path qw(make_path);
use YAML::XS;
use File::Spec;

# Usage: ./reorganize_docs.pl <directory>
die "Usage: $0 <directory>\n" unless @ARGV == 1;
my $dir = $ARGV[0];

# Keep track of moved files
my %moved_files;

# Process all markdown files in the directory (non-recursively)
opendir(my $dh, $dir) || die "Can't open directory $dir: $!";
my @files = grep { /\.md$/ && $_ ne '_index.md' && -f File::Spec->catfile($dir, $_) } readdir($dh);
closedir($dh);

foreach my $file (@files) {
    my $filepath = File::Spec->catfile($dir, $file);

    # Skip if file has already been moved
    if (exists $moved_files{$filepath}) {
        print "Skipping $filepath - already moved to $moved_files{$filepath}\n";
        next;
    }

    # Read the file content
    open(my $fh, '<', $filepath) || die "Can't open $filepath: $!";
    my $content = do { local $/; <$fh> };
    close($fh);

    # Extract YAML front matter
    if ($content =~ /^---\n(.*?)\n---\n/s) {
        my $yaml = $1;
        my $data;
        eval {
            $data = Load($yaml);
        };
        if ($@) {
            warn "Error parsing YAML in $file: $@\n";
            next;
        }

        # Process only if the page has children
        if ($data && exists $data->{children} && ref($data->{children}) eq 'ARRAY') {
            my $basename = $file;
            $basename =~ s/\.md$//;

            # Create directory with same name as the file
            my $newdir = File::Spec->catfile($dir, $basename);
            if (-d $newdir) {
                print "Directory already exists: $newdir\n";
            } else {
                make_path($newdir);
                print "Created directory: $newdir\n";
            }

            # Move the parent file as _index.md
            my $index_location = File::Spec->catfile($newdir, "_index.md");
            if (-f $index_location) {
                print "Parent file already moved to: $index_location\n";
            } else {
                rename($filepath, $index_location)
                    or warn "Could not move $filepath to $index_location: $!\n";
                print "Moved parent file $filepath to $index_location\n";
                $moved_files{$filepath} = $index_location;
            }

            # Move each child file into the new directory
            foreach my $child (@{$data->{children}}) {
                next unless exists $child->{url};
                my $child_file = File::Spec->catfile($dir, $child->{url} . ".md");
                my $new_location = File::Spec->catfile($newdir, basename($child_file));

                # Skip if file is already in the correct location
                if (-f $new_location) {
                    print "File already in correct location: $new_location\n";
                    next;
                }

                # Skip if child file has already been moved elsewhere
                if (exists $moved_files{$child_file}) {
                    print "Skipping child $child_file - already moved to $moved_files{$child_file}\n";
                    next;
                }

                if (-f $child_file) {
                    rename($child_file, $new_location)
                        or warn "Could not move $child_file to $new_location: $!\n";
                    print "Moved $child_file to $new_location\n";
                    $moved_files{$child_file} = $new_location;
                } else {
                    # Check if the file exists in the target directory
                    if (-f $new_location) {
                        print "Child file already in target location: $new_location\n";
                    } else {
                        warn "Child file not found: $child_file (or $new_location)\n";
                    }
                }
            }
        }
    }
}

# Print summary
my $total_moved = scalar keys %moved_files;
print "\nSummary: Moved $total_moved files\n";