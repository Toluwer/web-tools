# web-tools

One page, three things: a link checker for school filters, a shelf of games, and a movie and series browser.

Open the page and you get a start screen — pick **Check links**, **Test a link**, **Play games**, or **Watch movies**. That's it. The tiles are bare by design: no subtitles, no footnotes, no credit paragraphs on the page itself — everything below is documentation, not UI.

The page starts in light mode; a sun/moon button in every view's header flips between light and dark, and your pick is remembered on your device.

## The link checker

It reads the latest post from the links blog, tries every link on your network, and lists the ones that actually open. The blog itself comes down two Google feed routes at once — the blogspot domain and blogger.com, whichever answers first — so a network that blocks one of them still gets the posts, and blogger.com identifies the blog by its numeric feed ID so no blocked hostname ever appears in the request. When both feed routes are unreachable the page reads the live feed through one relay service — cors.redoc.ly, a plain pass-through that hands back the blog's own feed — and if that is unreachable too, this repo's own mirror of the feed, `data/feed.json` refreshed hourly by the mirror workflow, read from the same host serving the app so networks that block blogspot and every public relay still boot. Anything it can't verify folds into a "filtered out" section with the reason why. One rule everywhere: the filter's own category database settles every blocked category the moment it answers, and nothing network-side can flip it back open — most school filters enforce at navigation time, so the policy service says blocked while every background probe still sails through clean. Allowed and unknown categories are the only ones that get verified with real page loads and icons. The page, icon, and database checks all run at once for every link, so nothing waits in line: blocked links settle the moment the database answers, and the scan streams at full speed. If a category reads wrong for your school, click its Policy chip once and the choice sticks.

Results are grouped under the proxy group each link came from and sorted by group name, with a live count per group — so you can spot the group with the most working mirrors at a glance. Checks run in parallel against the filter's own database at double width — a scan finishes in a few seconds.

A filter box sits above the results — type a few letters to narrow hundreds of links down to the ones you care about, and empty groups fold away as you type. The start screen also remembers your last scan: how many links opened, how many were filtered, when, and under which filter.

Don't want a full scan? Pick **Test a link** instead, paste any address, and the same engine checks that single site under whichever filter you've selected in the checker. Same rule as the feed scan: a blocked category settles instantly and nothing network-side flips it, allowed and unknown categories keep the normal evidence rules, and Securly mode (which has no category database to ask) behaves exactly like the feed scan.

It understands two filters:

- **Lightspeed Systems** — asks the filter's live database first: blocked categories settle instantly, allowed ones get verified with real page loads.
- **Securly** — Securly doesn't publish a category API, so this mode measures instead: it watches which sites answer, which get dropped without a reply, and which serve Securly's block page. Those measurements are calibrated once per visit by probing the blog's own domain: if blogspot.com is unreachable while its icons still load, the network is forging responses, so icon evidence is distrusted and the relay proofs run. The calibration runs no matter which feed route delivered the posts, so blogger.com-fed networks get the same Securly checks as everyone else.

If a verdict looks wrong for your school, click the label on that row to flip it. Your call is remembered on your device only.

## The games

The games come from [GN-Math](https://github.com/gn-math) — an open collection of 800+ games on GitHub. All credit to them: they gathered the games, packaged them as single files, and maintain the library. Every game belongs to its original author.

We don't host or copy any game files. The page pulls the list, the covers, and each game straight from GN-Math's repos, so when they update their library, the shelf here updates too.

Pin the games you actually play — a bookmark button on each card floats your picks to the top of the shelf, remembered on your device. When you press play, the game's file is fetched and run right on the page, inside its own sandboxed frame. That detail matters: school networks often block the middleman services that serve GitHub files as web pages — the game shows up as a "blocked by Chrome" square — so we skip the middlemen and run the file ourselves. The game list, each game file, and every cover race three independent routes at once (GitHub raw, the Statically CDN, and raw.githack) — the shelf loads as fast as the fastest route your network allows, and a filter has to block all three hosts to darken it. If every route is unreachable from your network, the page will tell you instead of pretending.

## The movies

The third choice is a movie and series browser. Titles, posters, ratings, cast, and episode guides come straight from [TMDB](https://www.themoviedb.org), an open database maintained by its community — when they fix a fact, it's fixed here too.

Playback runs on five independent embed players (we call them reels). If one is blocked or broken on your network, click another reel — they're different services, and it's rare for all of them to be down at once.

Movies and series currently work on Securly networks only. Other school filters tend to block the movie database itself, and when that happens the page says so honestly — there is no built-in library and no cached fallback pretending otherwise. If a data route comes back mid-session, the wall picks itself up again on its own.

## Files

- `loader.html` — the entry point. Paste it once; it always pulls the newest version of the app from this repo.
- `WebTool.html` — the app itself (checker + games + movies).
- `README.md` — this file.

## Credits

- [GN-Math](https://github.com/gn-math) — the whole game library and everything behind it
- [TMDB](https://www.themoviedb.org) — all movie and series data, and the community that maintains it
- The original authors of every game listed here
- The links blog for the daily posts

## Notes

No accounts, no tracking, nothing stored on any server. The whole project is a couple of HTML files you can host anywhere.
