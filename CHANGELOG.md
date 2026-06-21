# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.11.1] - 2026-06-21

### Fixed

- **v3.0 photos referenced by URL now declare `VALUE=uri`.** Previously a
  URL-referenced `PHOTO`/`LOGO` was emitted as `PHOTO;TYPE=PNG:https://…`
  without `VALUE=uri`, so RFC 2426 parsers treated the URL as inline data and
  the image failed to load. ([#41](https://github.com/enesser/vCards-js/issues/41))
- **Base64-embedded photos can now be imported on Samsung devices.** An inline
  base64 value in vCard **2.1** is now terminated by a blank line, as the 2.1
  spec requires. (This terminator is intentionally not emitted for 3.0/4.0,
  whose RFC grammars forbid blank lines.)
  ([#58](https://github.com/enesser/vCards-js/issues/58))
- **v4.0 base64 photos use the correct media type.** The embedded data URI was
  hardcoded to `data:image/png;base64,` regardless of the supplied media type;
  it now reflects the actual type (e.g. `data:image/jpeg;base64,`).

### Added

- RFC conformance checks (`test/rfc-check.js`) now run as part of `npm test`,
  validating CRLF line endings, 75-octet line folding, required properties,
  structured-value component counts, value escaping, and version-specific rules
  for vCard 2.1, 3.0 (RFC 2426), and 4.0 (RFC 6350).

[2.11.1]: https://github.com/enesser/vCards-js/compare/v2.11.0...v2.11.1
