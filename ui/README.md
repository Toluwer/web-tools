# Webtool interface

The presentation layer is authored here and embedded into the standalone HTML files. There are no additional stylesheet or script requests at runtime.

- `webtool.css`: application shell, workspaces, chat, AI, dialogs, previews, and responsive layouts.
- `shell.js`: workspace layout, persistent navigation, tool search, and keyboard behavior.
- `icons.js`: the shared stroke icon set used by navigation, chat controls, and file tools.
- `office.js` and `workspaces.css`: the full AI workspace, local file library, paged Office previews, and document/presentation authoring.
- `slides-entry.mjs` and `vendor/`: pinned browser engines and their license notices.
- `word-entry.mjs`, `presentation.js`, `media.js`, and `office-schema.js`: Word generation, slide authoring, image retrieval, and the AI tool contracts.
- `pagination.js` and `office-editor.js`: natural document pagination and generated-file source editors.
- `weather.js`, `weather.css`, and `weather/`: photographic forecasts, bundled weather imagery, and photo credits.
- `research.js`, `research.css`, and `reader*`: research dossiers, evidence notebooks, and isolated public-page reading.
- `browser.css`: default browser chrome, new tab, settings, panels, and dialogs. Explicitly selected optional GUST skins remain available.
- `loading.css`: browser loader and main loader loading/error states.
- `browser-loader.html`: source for the browser launch window, embedded into `WebTool.html`.

Run `npm ci --ignore-scripts` once, then `npm run build` after editing these files. The script replaces the embedded presentation and is idempotent. Commit the sources and generated HTML together. Run `npm run vendor:office` only when refreshing the pinned vendor bundles; it regenerates their notices too.

## AI and Office workspaces

AI is a navigation destination with a full conversation page and composer. There is no floating AI launcher, modal, or side drawer. Documents is a separate destination for imported files and AI output. Its IndexedDB library stays in the current browser and origin; clearing site data removes it. Download important files separately.

DOCX previews use docx-preview with page surfaces, headers, footers, tables, images, fonts, footnotes, endnotes, and supported review markup. Long content is paginated in the browser, including paragraph splitting and continuation tables with repeated headers. PPTX previews use Office Kit's SVG renderer, preserve the slide canvas and individual element positions, and expose speaker notes. The viewer includes an outline, zoom, automatic fit, search, download, print, and fullscreen presentation with arrow-key navigation. Chat attachments use the same engines. Preview rendering is browser-based: unsupported Office features and unavailable fonts can differ from Word or PowerPoint. The exported file keeps native Office pagination. Rapid file changes abort obsolete preview loads.

`WTOffice.createDocument(spec)` uses the maintained `docx` library instead of hand-written package XML. It supports rich runs and inline Markdown, six heading levels, nested lists and checklists, merged tables and cell content, images with captions/credits, linked contents, cover pages, footnotes and citations, references, real columns, and mixed-orientation page sections. `WTOffice.createPresentation(spec)` supports independent text, shapes, lines, images, SVG input, tables, editable charts, editable node/connector diagrams, groups, repeated master elements, image backgrounds, sources, and speaker notes. Colors and image sizing are normalized; invalid inputs produce element-specific errors and potential overflow produces retained warnings. Slide coordinates use inches, with no preset-only or 24-slide ceiling. `search_images` supplies real Commons image URLs and license/credit metadata.

Generated files have source editors with draft preview, typography/content controls, table grids, slide/element controls, ordering, duplication, undo/redo, and explicit Save revision. Imported files remain previews with extracted text available to AI. `edit_document` applies targeted operations atomically: a failed export does not replace the saved file. Up to ten prior versions are retained, bounded to 40 MB per file, and can be restored. `list_documents`, `read_document`, and `document_versions` expose this workflow to AI. The configured provider still determines content and design quality.

Previews use sandboxed frames without script execution. Active DOCX HTML chunks are disabled. Imported files above 80 MB and images above 12 MB are rejected; browser document pagination is bounded to 250 additional pages. The original remains downloadable. Source editors do not provide a complete Word or PowerPoint feature set.

## Weather

AI weather now uses Open-Meteo data with location-local timestamps, a 24-hour strip, ten-day forecast, current metrics, unit preferences, and optional motion. Missing readings stay unavailable instead of becoming zero. Backgrounds are bundled raster photographs, not SVG scenes, and do not require runtime image requests. Attribution and source pages appear in the card and `weather/credits.json`; the Unsplash license is linked there. Reduced-motion preferences stop animation.

## Research

Research is a separate workspace for local dossiers, article and academic searches, public-page reading, exact saved excerpts, source notes, citations, and an overall brief. Wikipedia supplies reference articles; Crossref supplies scholarly metadata and available abstracts. Labels distinguish metadata, abstracts, saved excerpts, and retrieved text. This is not a general web search index or access to paywalled papers.

Public HTTPS page reading uses the existing bundled libcurl browser transport in a lazy opaque-origin frame, with a selectable verified Wisp relay. It shares no browser account cookies. Mozilla Readability extracts inert HTML into text; pages requiring scripts or denying access may not be readable. Source responses are bounded to 5 MB and text snapshots to 100,000 characters. No third-party reader API key is required. Transport errors are shown rather than marking failed sources as read.

Selected evidence attaches to AI only through deliberate research actions (or research tools invoked by AI). The context is marked as untrusted evidence, with source identifiers and continuation reads. Source IDs can become real Word footnotes/reference lists or slide notes and linked source slides. Export creates a ZIP containing the dossier, source snapshots, notes, RIS, and BibTeX; importing the ZIP restores a new local dossier. IndexedDB storage is per browser/origin, so export important work before clearing site data.

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

The checks navigate main workspaces at desktop, tablet, and mobile widths, exercise the finder and AI settings, and check overflow and script errors. Controlled fixtures verify populated screens, downloads, advanced DOCX/PPTX, atomic edits, revision rollback, source editing, rapid preview changes, photographic weather, research evidence/persistence/import/export, and mobile layouts. A 27-slide export checks the removed slide ceiling. Browser checks cover its new tab and settings. These regression fixtures never contact the AI provider or create chat accounts/messages. Live provider, weather/search/reader transport checks are separate from deterministic regression checks. Authenticated chat and movie playback are not asserted.

`GUST.html` remains an AGPLv3 derivative with its upstream notices and `LICENSE-GUST.txt` retained. Office engine licenses are retained in `vendor/THIRD_PARTY_NOTICES.md` and the adjacent license files.
