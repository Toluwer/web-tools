# web-tools

Browser tools for restricted school networks.

## Tools

* **Link Checker** scans the latest post from [IXL Study](https://ixlstudy.blogspot.com) and reports which links are reachable on the current network. Results are grouped by proxy group with live counts and inline filtering. Lightspeed Systems and Securly are supported. Feed retrieval falls back through Google feed endpoints, a CORS relay, and a repository mirror refreshed hourly by GitHub Actions.
* **Link Tester** checks a single URL or a batch, one address per line. Enter inserts a newline; Ctrl+Enter submits. Verdicts use page content, so a filter's block page is reported as blocked rather than open. Results can be overridden per row.
* **Games** serves the GN-Math library of 800+ games directly from their GitHub repositories, running each title in a sandboxed frame. Favorites can be pinned.
* **Movies** browses TMDB titles with playback across five interchangeable embed players. Currently functional on Securly networks only.
* **Brookwood Hub** is a live dashboard for Brookwood High School (Snellville, GA) covering school and athletics events, news, bell schedule, and district holidays. Data is fetched from the school's own sites on each open and cached locally.
* **Chat** is one general room for everyone and takes the full page: enter a saved name and you are in. Messages carry seen ticks, replies, and deletion, typing shows live, the roster appears as avatars, and the log exports as a text file. The peer with the lowest id answers each newcomer over ntfy.sh and hands over the roster, everyone meshes over WebRTC with an ntfy.sh relay for blocked networks, and messages typed while alone sync to whoever arrives next. Names and chat history are stored deflated in textdb.online, about three times the history per save, with a 12 hour rolling backup on ntfy.sh when the cloud is blocked, so a wiped browser log is restored by typing the same name again.
* **Browse the web** opens GUST, a full browser by Nautilus Labs, in a new window. Pages load through Wisp proxy servers over WebSockets, so the network only sees that one connection. It has tabs, bookmarks, history, an ad blocker, and viewers for PDFs, images, and video.

## Repository Layout

* `loader.html`: hosted entry point, bookmark `https://Toluwer.github.io/web-tools/loader.html`, loads the current app through whichever route is reachable
* `WebTool.svg`: CDN entry point for Lightspeed networks, bookmark `https://cdn.jsdelivr.net/gh/Toluwer/web-tools@main/WebTool.svg`, an SVG shell that boots the app through a five-route ladder
* `WebTool.html`: the application
* `GUST.html`: the GUST browser, unmodified, AGPLv3
* `LICENSE-GUST.txt`: GUST license text
* `data/feed.json`: feed mirror
* `scripts/mirror_feed.mjs`: mirror workflow source, runs hourly

## Data Sources

* [GN-Math](https://github.com/gn-math): games
* [TMDB](https://www.themoviedb.org): movie and series data
* Brookwood High School and Gwinnett County Public Schools: hub data
* [IXL Study](https://ixlstudy.blogspot.com): link lists and daily posts
* [ntfy.sh](https://ntfy.sh): chat room pairing, mesh signaling, and relayed transfers
* [textdb.online](https://textdb.online): saved chat names and history (the cloud save)
* [GUST](https://github.com/nautilus-os/GUST): the browser
