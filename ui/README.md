# Webtool interface

The presentation layer is authored here and embedded into the standalone HTML files. There are no additional stylesheet or script requests at runtime.

- `webtool.css`: application shell, workspaces, chat, AI, dialogs, previews, and responsive layouts.
- `shell.js`: workspace layout, persistent navigation, tool search, and keyboard behavior.
- `browser.css`: default browser chrome, new tab, settings, panels, and dialogs. Explicitly selected optional GUST skins remain available.
- `loading.css`: browser loader and main loader loading/error states.
- `browser-loader.html`: source for the browser launch window, embedded into `WebTool.html`.

Run `node scripts/build-ui.mjs` after editing these files. The script replaces the embedded presentation and is idempotent. Commit the sources and generated HTML together.

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
node scripts/check-ui.cjs
node scripts/check-ui-states.cjs
```

`WEBTOOL_URL` changes the server URL. `UI_OUTPUT` changes the screenshot/download directory (default `artifacts/ui`, ignored by Git).

The first check navigates all main workspaces at desktop, tablet, and mobile widths, exercises the tool finder and AI settings, and checks horizontal overflow and script errors. The second uses controlled movie, school-cache, and AI fixtures to check populated views, six school tabs, long titles, mobile categories, artifact title/label spacing, and actual local DOCX/PPTX downloads. It also opens the real browser's new tab and settings after its connection benchmark completes. The fixtures never contact the AI provider or create chat accounts/messages. Authenticated chat, movie playback, and proxy transport to third-party sites are not asserted by these UI checks.

`GUST.html` remains an AGPLv3 derivative with its upstream notices and `LICENSE-GUST.txt` retained. This redesign changes its default presentation and early charset declaration, not its proxy implementation.
