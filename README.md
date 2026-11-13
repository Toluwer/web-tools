# web-tools

Browser tools for school networks. Works on Lightspeed and Securly.

Bookmark one of these:

- https://Toluwer.github.io/web-tools/loader.html
- https://cdn.jsdelivr.net/gh/Toluwer/web-tools@main/WebTool.svg (works when the first one is blocked)

## Tools

- **Link Checker**: checks every link in the latest IXL Study post
- **Link Tester**: checks any URL
- **Movies**: browse and watch movies and shows
- **Brookwood Hub**: school events, news, and bell schedule; the days-off countdown clicks between total days, business days, and weeks + days
- **Chat**: chat room with accounts and DMs; durable device history and conflict-aware account synchronization; file cards remain in history, while temporary hosting links expire on their provider’s schedule
- **WebTool AI**: a dedicated assistant workspace that answers questions, does math, shows the weather, writes code, and builds editable .pptx and .docx files using saved native source projects and rendered-page review
- **Browse the web**: a full browser through a proxy

Movie data comes from [TMDB](https://www.themoviedb.org). The browser is [GUST](https://github.com/nautilus-os/GUST) (AGPLv3).

## Interface development

The interface has a persistent workspace sidebar, compact icon navigation, dark neutral surfaces, and blue primary actions. Every tool shares the same controls, spacing, dialogs, and responsive behavior.

Edit the presentation sources under [`ui/`](ui/README.md), then run `node scripts/build-ui.mjs` to rebuild the self-contained HTML. See that guide for the palette and browser verification commands.
