# Webtool interface

The presentation layer is authored here and embedded into the standalone HTML files. There are no additional stylesheet or script requests at runtime.

- `webtool.css`: application shell, workspaces, chat, AI, dialogs, previews, and responsive layouts.
- `shell.js`: workspace layout, persistent navigation, tool search, and keyboard behavior.
- `icons.js`: the shared stroke icon set used by navigation, chat controls, and file tools.
- `office.js` and `workspaces.css`: the full AI workspace, local file library, paged Office previews, and document/presentation authoring.
- `slides-entry.mjs` and `vendor/`: pinned browser engines and their license notices.
- `browser.css`: default browser chrome, new tab, settings, panels, and dialogs. Explicitly selected optional GUST skins remain available.
- `loading.css`: browser loader and main loader loading/error states.
- `browser-loader.html`: source for the browser launch window, embedded into `WebTool.html`.

Run `npm ci --ignore-scripts` once, then `npm run build` after editing these files. The script replaces the embedded presentation and is idempotent. Commit the sources and generated HTML together. Run `npm run vendor:office` only when refreshing the pinned vendor bundles; it regenerates their notices too.

## AI and Office workspaces

AI is a navigation destination with a full conversation page and composer. There is no floating AI launcher, modal, or side drawer. Documents is a separate destination for imported files and AI output. Its IndexedDB library stays in the current browser and origin; clearing site data removes it. Download important files separately.

DOCX previews use docx-preview with page surfaces, headers, footers, tables, images, fonts, footnotes, endnotes, and supported review markup. PPTX previews use Office Kit's SVG renderer, preserve the slide canvas and individual element positions, and expose speaker notes. The viewer includes a page/slide outline, zoom, automatic fit, text search, download, print, and fullscreen presentation with arrow-key navigation. Chat attachments use the same engines. Preview rendering is browser-based: unsupported Office features and unavailable fonts can differ from Word or PowerPoint. This is a preview workspace, not an interactive word processor or slide editor.

`WTOffice.createDocument(spec)` produces real DOCX files with rich text runs, six heading levels, nested lists, tables, images, cover sections, page breaks, headers/footers, page numbers, footnotes, and page layout options. `WTOffice.createPresentation(spec)` produces editable PPTX files using independent text, shapes, lines, images, SVG, tables, and charts on custom-sized canvases, with speaker notes. Element coordinates use inches. Slides are not restricted to preset layouts or a 24-slide ceiling. `list_documents` and `read_document` let the assistant find and revise locally generated source models. The configured AI provider still determines content and design quality.

Previews use sandboxed frames without script execution. Active DOCX HTML chunks are disabled. Files above 80 MB are rejected before preview to bound browser memory use.

## Wisp pool

`data/wisps.json` records 57 distinct hostnames that passed the recorded audit, including 50 additions to the previous pool. Each entry has its documented source, audit time, and latency. Verification requires a real Wisp TCP tunnel and a certificate-validated HTTPS 200 response from example.com; a WebSocket upgrade alone does not pass. Public endpoints can subsequently change or become unavailable.

Run `npm run audit:wisps` to write a fresh audit to ignored `artifacts/wisp-https-audit.json`. Optional `scripts/discover-wisps.cjs` collects publicly documented candidates through authenticated GitHub CLI search and checks HTTP transport. Review and verify candidates before updating the tracked pool. Runtime benchmarking uses four workers and runs in the background so the new tab is usable immediately.

## Design values

| Role | Value |
| --- | --- |
| Outer shell | `#141414` |
| Sidebar | `#171717` |
| Workspace | `#181818` |
| Panel | `#232323` |
| Selected row | `#292929` |
| Composer | `#363636` |
| Text | `#f3f3f3` |
| Secondary text | `#969696` |
| Primary action / focus | `#3b82f6` |
| Border | `#303030` |

Desktop navigation uses a 52 px icon rail and 228 px contextual sidebar. Screen headings are 25 px, normal UI text 13–14 px, and metadata 11–12 px. Use explicit flex/grid gaps between labels and values; never depend on a leading space in generated text. Use 12–20 px panel radii and rounded primary buttons. The compact mobile navigation keeps all workspaces accessible, with contextual filters moved above the content.

## Verification

Serve the repository over HTTP on port 8765, for example with `python -m http.server 8765`. With Playwright and Chrome available, run:

```
npm run test:ui
```

`WEBTOOL_URL` changes the server URL. `UI_OUTPUT` changes the screenshot/download directory (default `artifacts/ui`, ignored by Git).

The checks navigate all main workspaces at desktop, tablet, and mobile widths, exercise the tool finder and AI settings, and check horizontal overflow and script errors. Controlled movie, school-cache, and AI fixtures verify populated views, six school tabs, the compact Away badge, label/value gaps, mobile categories, and real local DOCX/PPTX downloads. Office checks cover multipage DOCX, freeform PPTX with charts and tables, a 27-slide export, search, notes, fullscreen navigation, and mobile fit. Browser checks cover its new tab and settings. The fixtures never contact the AI provider or create chat accounts/messages. Authenticated chat and movie playback are not asserted by these checks; relay transport is audited separately.

`GUST.html` remains an AGPLv3 derivative with its upstream notices and `LICENSE-GUST.txt` retained. Office engine licenses are retained in `vendor/THIRD_PARTY_NOTICES.md` and the adjacent license files.
