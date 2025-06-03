#!/usr/bin/env perl
# cSpell:ignore newdir catfile opendir closedir readdir

use strict;
use warnings;
use File::Basename;
use File::Path qw(make_path);
use YAML::XS;
use File::Spec;

# Usage: ./reorganize_docs.pl <directory>
die "Usage: $0 <directory>\n" unless @ARGV == 1;
my $dir = $ARGV[0];

# Tracking hashes for file transformations
my %moved_files;        # Original path -> New path
my %became_index;       # Original filename (no .md) -> 1 (tracks files that became _index.md)
my %parent_dirs;        # Child file path -> Parent directory name

# First pass: Move files into their subdirectories
sub reorganize_files {
    my ($dir) = @_;

    # Process only files in the specified directory (non-recursively)
    opendir(my $dh, $dir) || die "Can't open directory $dir: $!";
    my @files = grep { /\.md$/ && $_ ne '_index.md' && -f File::Spec->catfile($dir, $_) } readdir($dh);
    closedir($dh);

    foreach my $file (@files) {
        my $filepath = File::Spec->catfile($dir, $file);

        # Skip if already moved
        next if exists $moved_files{$filepath};

        # Read and parse front matter
        open(my $fh, '<', $filepath) || die "Can't open $filepath: $!";
        my $content = do { local $/; <$fh> };
        close($fh);

        if ($content =~ /^---\n(.*?)\n---\n/s) {
            my $yaml = $1;
            my $data = eval { Load($yaml) };
            next if $@;  # Skip if YAML parsing fails

            # Only process if the page has children
            if ($data && exists $data->{children} && ref($data->{children}) eq 'ARRAY') {
                my $basename = $file;
                $basename =~ s/\.md$//;

                # Create subdirectory
                my $newdir = File::Spec->catfile($dir, $basename);
                make_path($newdir) unless -d $newdir;

                # Move parent file as _index.md
                my $index_path = File::Spec->catfile($newdir, "_index.md");
                rename($filepath, $index_path) or die "Could not move $filepath to $index_path: $!\n";
                $moved_files{$filepath} = $index_path;
                $became_index{$basename} = 1;

                # Move each child file
                foreach my $child (@{$data->{children}}) {
                    next unless exists $child->{url};
                    my $child_file = File::Spec->catfile($dir, $child->{url} . ".md");
                    my $new_location = File::Spec->catfile($newdir, basename($child_file));

                    if (-f $child_file && !exists $moved_files{$child_file}) {
                        rename($child_file, $new_location)
                            or die "Could not move $child_file to $new_location: $!\n";
                        $moved_files{$child_file} = $new_location;
                        $parent_dirs{$child_file} = $basename;
                    }
                }
            }
        }
    }
}

# Find all markdown files in a directory (non-recursively)
sub find_markdown_files {
    my ($dir) = @_;
    opendir(my $dh, $dir) || die "Can't open directory $dir: $!";
    my @files = grep { /\.md$/ && -f File::Spec->catfile($dir, $_) } readdir($dh);
    closedir($dh);
    return map { File::Spec->catfile($dir, $_) } @files;
}

# Second pass: Basic link updates in moved files
sub update_links {
    my ($filepath) = @_;
    return unless -f $filepath;

    open(my $fh, '<', $filepath) or return;
    my $content = do { local $/; <$fh> };
    close($fh);

    my $modified = 0;
    my $is_root_index = $filepath eq File::Spec->catfile($dir, '_index.md');
    my $was_moved = exists $moved_files{$filepath};
    my $current_dir = dirname($filepath);

    # Process all markdown links
    while ($content =~ m{\[([^\]]+)\]\((\.\.?)/([^/)#]+)(/)?([^)]*)\)}g) {
        my ($link_text, $rel_prefix, $target, $trailing_slash, $extra) = ($1, $2, $3, $4 || '', $5 || '');
        my $old_link = "[${link_text}](${rel_prefix}/${target}${trailing_slash}${extra})";
        my $new_link;

        # Build the full target path as it was before any moves
        my $target_md = "$target.md";
        my $full_target = File::Spec->catfile($dir, $target_md);

        # Special handling for root _index.md
        if ($is_root_index && $rel_prefix eq '.') {
            if (exists $parent_dirs{$full_target}) {
                # Update link to include the parent directory
                my $parent = $parent_dirs{$full_target};
                $new_link = "[${link_text}](./$parent/$target$trailing_slash$extra)";
            }
            # Don't modify links to files that became _index.md
            next if exists $became_index{$target};
        }
        # Handling for unmoved files
        elsif (!$was_moved && exists $parent_dirs{$full_target}) {
            # Update link to include the parent directory but keep same level
            my $parent = $parent_dirs{$full_target};
            $new_link = "[${link_text}](../$parent/$target$trailing_slash$extra)";
        }
        # Regular handling for moved files
        elsif ($was_moved && exists $parent_dirs{$full_target}) {
            my $parent = $parent_dirs{$full_target};

            # Get the parent directory name of the current file
            my $current_parent = basename(dirname($filepath));

            # Check if files are in the same parent directory
            if ($current_parent eq $parent) {
                # Use ./ for files in the same directory
                $new_link = "[${link_text}](./$target$trailing_slash$extra)";
            } else {
                # Use ../../ for files in different directories
                $new_link = "[${link_text}](../../$parent/$target$trailing_slash$extra)";
            }
        }

        # Update the link if we generated a new one
        if (defined $new_link && $new_link ne $old_link) {
            $content =~ s/\Q$old_link\E/$new_link/g;
            $modified = 1;
        }
    }

    # Write back if modified
    if ($modified) {
        open(my $out, '>', $filepath) or die "Cannot write to $filepath: $!\n";
        print $out $content;
        close($out);
        print "Updated links in $filepath\n";
    }
}

# Third pass: Fix up any incorrect links
sub fix_links {
    my ($filepath) = @_;
    return unless -f $filepath;

    open(my $fh, '<', $filepath) or return;
    my $content = do { local $/; <$fh> };
    close($fh);

    my $modified = 0;
    my $is_index = basename($filepath) eq '_index.md';
    my $current_dir = dirname($filepath);
    my $was_moved = exists $moved_files{$filepath};

    # Process all markdown links
    while ($content =~ m{\[([^\]]+)\]\((\.\.?)/([^/)#]+)(/)?([^)]*)\)}g) {
        my ($link_text, $rel_prefix, $target, $trailing_slash, $extra) = ($1, $2, $3, $4 || '', $5 || '');
        my $old_link = "[${link_text}](${rel_prefix}/${target}${trailing_slash}${extra})";
        my $new_link;

        my $target_md = "$target.md";
        my $full_target = File::Spec->catfile($dir, $target_md);

        # Case 1: We're in a moved _index.md file
        if ($was_moved && $is_index) {
            # First check if target exists in our directory
            my $target_in_dir = File::Spec->catfile($current_dir, "$target.md");
            if (-f $target_in_dir && $rel_prefix eq '..') {
                # Convert ../target to ./target for files in same directory
                $new_link = "[${link_text}](./$target$trailing_slash$extra)";
            }
            # Otherwise handle external references
            elsif (exists $became_index{$target}) {
                # Link to a file that became _index.md needs extra ../
                $new_link = "[${link_text}](../../$target$trailing_slash$extra)";
            } elsif (!exists $moved_files{$full_target}) {
                # Link to an unmoved file needs extra ../
                $new_link = "[${link_text}](../../$target$trailing_slash$extra)";
            }
        }
        # Case 2: We're in a moved regular file
        elsif ($was_moved && !$is_index) {
            if (exists $became_index{$target}) {
                # Link to a file that became _index.md needs extra ../
                $new_link = "[${link_text}](../../$target$trailing_slash$extra)";
            } elsif (!exists $moved_files{$full_target}) {
                # Link to an unmoved file needs extra ../
                $new_link = "[${link_text}](../../$target$trailing_slash$extra)";
            }
        }

        # Update the link if we generated a new one
        if (defined $new_link && $new_link ne $old_link) {
            $content =~ s/\Q$old_link\E/$new_link/g;
            $modified = 1;
        }
    }

    # Write back if modified
    if ($modified) {
        open(my $out, '>', $filepath) or die "Cannot write to $filepath: $!\n";
        print $out $content;
        close($out);
        print "Fixed up links in $filepath\n";
    }
}

# Main execution
print "First pass: Moving files...\n";
reorganize_files($dir);

print "\nSecond pass: Basic link updates...\n";
# Process both moved and unmoved files
my @all_files = find_markdown_files($dir);
foreach my $filepath (@all_files) {
    update_links($filepath);
}

print "\nThird pass: Fixing up links...\n";
foreach my $original_path (keys %moved_files) {
    my $new_path = $moved_files{$original_path};
    fix_links($new_path);
}

# Print summary
my $total_moved = scalar keys %moved_files;
my $total_index = scalar keys %became_index;
print "\nSummary:\n";
print "- Moved $total_moved files\n";
print "- Created $total_index _index.md files\n";
