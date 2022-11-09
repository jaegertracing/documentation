---
title: Download Jaeger
---

Jaeger components can be downloaded in two ways:

* As [executable binaries](#binaries)
* As [Docker images](#docker-images)

## Binaries

Jaeger binaries are available for macOS, Linux, and Windows. The table below lists the available binaries:

{{< binaries >}}

You can find the binaries for previous versions on the [GitHub releases page](https://github.com/jaegertracing/jaeger/releases/).

## Docker images

The following Docker images are available for the Jaeger project via the [jaegertracing](https://hub.docker.com/r/jaegertracing/) organization on [Docker Hub](https://hub.docker.com):

{{< dockerImages >}}

## Artifact Checksums

Along with the binaries published via GitHub Releases we provide the checksum files, `*.sha256sum.txt`,
for each of the target architecture archive. Below is an example of validating `darwin-amd64` binaries for release [v1.39.0](https://github.com/jaegertracing/jaeger/releases/tag/v1.39.0):
  * download `jaeger-1.39.0-darwin-amd64.sha256sum.txt`
  * download `jaeger-1.39.0-darwin-amd64.tar.gz`

```shell
# expand the archive
$ tar -xz jaeger-1.39.0-darwin-amd64.tar.gz

# find checksum for hotrod example
$ grep hotrod jaeger-1.39.0-darwin-amd64.sha256sum.txt
5088bcd396351edebf9280ee4d5d0f89f4839ecd64a8711e91a22dea6ddb719c *jaeger-1.39.0-darwin-amd64/example-hotrod

# regenerate the checksum from the binary and compare
$ shasum -b -a 256 jaeger-1.39.0-darwin-amd64/example-hotrod
5088bcd396351edebf9280ee4d5d0f89f4839ecd64a8711e91a22dea6ddb719c *jaeger-1.39.0-darwin-amd64/example-hotrod
```

## Signed Artifacts

NOTE: will be enabled in the next release.

We also publish cryptographic signatures for each of the artifact archives.
The signatures can be verified using the public key below.

### Import the key

```
$ gpg --import <<EOF
-----BEGIN PGP PUBLIC KEY BLOCK-----

mDMEY2vAvBYJKwYBBAHaRw8BAQdALagKKnO7ZKHAmPrwEJinKjBHUwMMvtFJLe2h
fcaXbga0QUphZWdlciBUcmFjaW5nIEFydGlmYWN0IFNpZ25pbmcgPGphZWdlci10
cmFjaW5nQGdvb2dsZWdyb3Vwcy5jb20+iJoEExYKAEICGwMFCwkIBwIDIgIBBhUK
CQgLAgQWAgMBAh4HAheAFiEEvQsCYBTHJSYclHiHtC0dsPB5aQ8FAmNrwSsFCRLM
A28ACgkQtC0dsPB5aQ9mcgEA066QypWZZeRrqb6tUxraFfPjPFHvJB+aM4HoieHx
h+4BAKyw584zjoeZRokEO5wkHgWcghtpJ+x7ogDh5T01fdEAuDgEY2vAvBIKKwYB
BAGXVQEFAQEHQPCkvs+pcAQ31FXZBK50MO0/fDHnEpyNzBZZCCWXizE/AwEIB4h+
BBgWCgAmFiEEvQsCYBTHJSYclHiHtC0dsPB5aQ8FAmNrwLwCGwwFCQPCZwAACgkQ
tC0dsPB5aQ9zwQD+NzLramrEK61hdin8MJbJzY7LO1slF81QzaeOae5u5KABAJLq
ZVSFq/hy7CXjmjwVnfo0WEuNyzo/sGSmEQa8gWYH
=B/tl
-----END PGP PUBLIC KEY BLOCK-----
EOF

gpg: key B42D1DB0F079690F: public key "Jaeger Tracing Artifact Signing <jaeger-tracing@googlegroups.com>" imported
gpg: Total number processed: 1
gpg:               imported: 1
```

### Verify signature

From the release page (TODO: provide link and fix versions):
* Download `jaeger-1.39.4-darwin-amd64.tar.gz`
* Download `jaeger-1.39.4-darwin-amd64.tar.gz.asc`

Use `gpg --verify {signature-file} file`, e.g.:

```
$ gpg --verify jaeger-1.39.4-darwin-amd64.tar.gz.asc jaeger-1.39.4-darwin-amd64.tar.gz
gpg: Signature made Wed Nov  9 13:34:17 2022 EST
gpg:                using EDDSA key BD0B026014C725261C947887B42D1DB0F079690F
gpg: Good signature from "Jaeger Tracing Artifact Signing <jaeger-tracing@googlegroups.com>" [ultimate]
```
