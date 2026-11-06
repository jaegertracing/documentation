---
# cSpell:ignore manuallinkrelref
# This file emits no page. It gives the version's Introduction, which is the
# section index above it, an entry in the sidebar: Docsy lists only a section's
# children and uses the root label as the link to the versions list. The flags
# below keep the entry out of the sitemap, the section's child list and the
# generated redirects, which would otherwise point at a page that does not exist.
title: Introduction
weight: -1
manualLinkRelref: _index.md
sidebar_only: true
hide_summary: true
sitemap:
  disable: true
build:
  render: link
  list: always
---
