# Research reader transport

`reader-transport.html` is generated from the existing libcurl.js runtime bundled in `GUST.html`, plus `ui/reader-frame.js`. It is loaded only when a public URL is read. The build normalizes trailing whitespace while preserving the runtime and bundled WebAssembly.

libcurl.js is copyright (C) 2024 ading2210 and contributors, under GNU LGPL v3. Its copyright notice is retained in the generated frame. The license is in `LICENSE-libcurl.txt`; the incorporated GNU GPL v3 text is also included in the GPL section of `LICENSE-jszip.txt`.

Upstream source and build instructions: <https://github.com/ading2210/libcurl.js>. The corresponding vendored runtime remains available in `GUST.html`, and `scripts/vendor-office.mjs` regenerates the replaceable reader frame from that source. GUST's own upstream notices and `LICENSE-GUST.txt` remain intact.

Mozilla Readability and its license are included in `THIRD_PARTY_NOTICES.md`. The reader parses source HTML into text without executing source-page scripts or sharing browser account cookies.
