## `docs-front-matter-fixes.pl`

For all of the docs-version folders under `content/docs/v*/*`, do the following cleanup. We'll handle this by writing a script that processes a single docs-version folder and makes these changes:

- In the top-level `_index.md` file:
  - Replace the `title` value with `Docs (version)`
  - Set the `linkTitle` to the version number in single quotes, e.g. `2.6`
  - set the `weight` to the value of -1 * (200 + minor version number)
- Ensure the `weight` of getting-started.md is 1
- Set the `weight` of features.md to 2
- Set the `linkTitle` of faq.md to `FAQ`

Other constraints:

- The script should replace `title` values in-place.
- Put `linkTitle`, when added to a file, immediately after `title`
- Don't modify any files other than those mentioned above

## `reorganize_docs.pl`

...
