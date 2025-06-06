---
title: Report a security issue
---

If you find something suspicious and want to report it, we'd really appreciate!

## Ways to report

The easiest way to report a vulnerability is through the [Security tab on GitHub](https://github.com/jaegertracing/jaeger/security/advisories). This mechanism allows maintainers to communicate privately with you, and you do not need to encrypt your messages.

Alternatively, you can use one of the following public channels to send an **encrypted** message to maintainers:

* Chat room on the [#jaeger channel at the CNCF Slack][slack-room]
* Send a message to [jaeger-tracing@googlegroups.com][mailing-list]
* [Open an issue on GitHub](https://github.com/jaegertracing/jaeger/issues)

You can also submit a fix to the issue by forking the affected repository and sending us a pull request. However, we prefer you'd talk to us first, as our repositories are public and we would like to give a heads-up to our users before disclosing vulnerabilities publicly.

## Our PGP key

If you choose a public channel to communicate with us, please **encrypt your message** using [our public key](#our-public-key) `ID=C043A4D2B3F2AC31`. It is available in all major key servers and should match the one shown below.

If you are new to PGP, you can run the following command to encrypt a file called "message.txt":

```shell
# Receive our keys from a key server:
gpg --keyserver keys.openpgp.org --recv-keys C043A4D2B3F2AC31

# Alternatively, copy the key below to file C043A4D2B3F2AC31.asc and import it:
gpg --import C043A4D2B3F2AC31.asc

# Encrypt a "message.txt" file into "message.txt.asc":
gpg -ea -r C043A4D2B3F2AC31 message.txt

# Send us the resulting "message.txt.asc"
```

### Our public key

```
-----BEGIN PGP PUBLIC KEY BLOCK-----
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
oF+qZY4uEvqFvYo8
=KQzT
-----END PGP PUBLIC KEY BLOCK-----
```

[mailing-list]: https://groups.google.com/forum/#!forum/jaeger-tracing
[slack-room]: https://cloud-native.slack.com/archives/CGG7NFUJ3
