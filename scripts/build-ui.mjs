import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n');
const write=(p,text)=>writeFileSync(path.join(root,p),text.replace(/\r\n/g,'\n'));
const loading=read('ui/loading.css');
let html=read('WebTool.html');
const style='<style id="webtool-design">\n'+read('ui/webtool.css')+'\n</style>';
html=html.replace(/<style(?: id="webtool-design")?>[\s\S]*?<\/style>/,style);
html=html.replace(/<meta name="theme-color" content="[^"]*">/,'<meta name="theme-color" content="#131313">');
html=html.replace('<title>·</title>','<title>Webtool</title>');
if(!html.includes('id="workspace"')) {
  const brand='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8l5 17 6-13 6 13 5-17"/><path d="M13 7h6"/></svg>';
  html=html.replace(/<body>/,`<body>
  <a class="skip-link" href="#workspace">Skip to workspace</a>
  <header class="app-header">
    <div class="app-breadcrumb"><strong>Webtool</strong><span class="sep" aria-hidden="true">/</span><span id="workspaceName">Home</span></div>
    <div class="app-actions"><button class="command-trigger" id="openFinder" type="button" aria-haspopup="dialog"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></svg><span>Find a tool</span><kbd>Ctrl K</kbd></button></div>
  </header>
  <main class="workspace" id="workspace" tabindex="-1">`);
  html=html.replace(/<div class="welcome" id="startScreen">[\s\S]*?(?=<div class="games" id="moviesView")/,`<section class="welcome" id="startScreen" aria-labelledby="homeTitle">
    <div class="page-heading"><div><h1 id="homeTitle">A little space for everything.</h1><p>Your tools, conversations, and things worth discovering.</p></div></div>
    <label class="home-search" for="homeSearch"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></svg><input id="homeSearch" type="search" placeholder="What would you like to do?" autocomplete="off" aria-label="Find a tool"></label>
    <section class="home-section" aria-labelledby="toolsTitle"><h2 class="section-heading" id="toolsTitle">Your workspace</h2><div class="tool-grid" id="toolGrid"></div><p class="home-no-results" id="homeNoResults" role="status" hidden>No tools match that search.</p></section>
    <section class="home-assistant" aria-labelledby="assistantTitle"><div class="assistant-label" id="assistantTitle"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/></svg>Make room for an idea.</div><p>Ask a question, work through a problem, or create something with Webtool AI.</p><form class="assistant-compose" id="assistantForm"><input id="assistantPrompt" placeholder="Ask Webtool anything" aria-label="Message for Webtool AI"><button class="primary-button" type="submit">Ask AI <span aria-hidden="true">↗</span></button></form></section>
    <div class="gust-fallback" id="gustFallback" style="display:none"><span>Your browser needs permission to open a new window.</span><a id="gustFallbackLink" href="#" target="_blank" rel="noopener">Open browser</a></div>
    <div class="start-stats" id="startStats" style="display:none"></div>
  </section>
  `);
  html=html.replace('<nav class="dock" id="dock" aria-label="Tools">','</main>\n  <nav class="dock" id="dock" aria-label="Tools">\n    <a class="rail-brand" href="#workspace" title="Webtool home" aria-label="Webtool home" onclick="document.getElementById(\'choiceHome\').click(); return false;">'+brand+'</a>');
  html=html.replace(/\s*<span class="dock-thumb"[^>]*><\/span>/,'');
  html=html.replace('<div class="blocker-bar" id="blockerBar">','<h1 class="tool-page-title">Link checker</h1><p class="tool-page-sub">Available links from the latest IXL Study posts, all in one place.</p>\n    <div class="blocker-bar" id="blockerBar">');
  html=html.replace('<div class="test-body">','<p class="tool-page-sub">Check an address before you open it. Paste multiple links to check them together.</p>\n    <div class="test-body">');
  html=html.replace('<span class="dk-lab">Check links</span>','<span class="dk-lab">Link checker</span>').replace('<span class="dk-lab">Test</span>','<span class="dk-lab">Link tester</span>').replace('<span class="dk-lab">School</span>','<span class="dk-lab">Brookwood Hub</span>');
  // Replace the obsolete horizontal draggable dock behavior, rather than adapting it.
  const navStart=html.indexOf('  /* ---- v86: the white pill dock.');
  const navEnd=html.indexOf('  var catOverrides',navStart);
  if(navStart<0||navEnd<0)throw Error('Navigation replacement anchors missing');
  html=html.slice(0,navStart)+`  var DOCK_FOR = { start: "choiceHome", checker: "choiceChecker", movies: "choiceMovies", test: "choiceTest", brook: "choiceBrook", beam: "choiceBeam" };
  function dockSetActive(name) {
    document.querySelectorAll(".dock-item").forEach(function(button) {
      var active=button.id===DOCK_FOR[name];
      button.classList.toggle("on",active);
      if(active)button.setAttribute("aria-current","page");else button.removeAttribute("aria-current");
    });
    if(window.wtShellSync)window.wtShellSync(name);
  }
\n`+html.slice(navEnd);
  html=html.replace('meta.setAttribute("content", "#141311")','meta.setAttribute("content", "#131313")');
  html=html.replace('</html>',`<dialog class="command-dialog" id="toolFinder" aria-label="Find a tool"><div class="command-head"><input type="search" id="finderInput" placeholder="Find a tool…" aria-label="Search tools" autocomplete="off"><button type="button" id="finderClose" aria-label="Close tool finder">Esc</button></div><div class="command-list" id="finderList"></div></dialog>\n</body>\n</html>`);
}
const shell='<!-- webtool-shell:start -->\n<script>\n'+read('ui/shell.js')+'\n</script>\n<!-- webtool-shell:end -->';
html=html.replace(/\s*<!-- webtool-shell:start -->[\s\S]*?<!-- webtool-shell:end -->\s*/,'\n');
// The upstream file closes body before its final scripts. Initialize only after
// all application scripts and the tool-finder dialog have been parsed.
html=html.replace(/\n<\/body>\s*/g,'\n');
const end=html.lastIndexOf('</html>');
html=html.slice(0,end).trimEnd()+'\n\n'+shell+'\n</body>\n</html>\n';
html=html.replace('["input", "focus", "click", "scroll", "cut", "paste"].forEach','["input", "focus", "click", "scroll", "cut", "paste", "cm:sync"].forEach');
html=html.replace(/((aiIn|V\.msg)\.value = "";)(?! \2\.dispatchEvent)/g,(_,assignment,input)=>assignment+' '+input+'.dispatchEvent(new Event("cm:sync"));');
let browserLoader=read('ui/browser-loader.html').replace(/<style>[\s\S]*?<\/style>/,'<style>\n'+loading+'\n</style>').replace('<title>&middot;</title>','<title>Webtool browser</title>').replace('content="#000000"','content="#141414"').replace(/<link[^>]+fonts\.(?:googleapis|gstatic)[^>]+>\n?/g,'');
write('ui/browser-loader.html',browserLoader);
// Escape literal script end tags because this HTML is carried inside a script.
const loaderLiteral=JSON.stringify(browserLoader).replace(/<\//g,'<\\/');
html=html.replace(/(function gustShellHtml\(routes\)\s*\{\s*return )("(?:[^"\\]|\\.)*")(?=\.replace)/,(_,prefix)=>prefix+loaderLiteral);
write('WebTool.html',html);
let browser=read('GUST.html');
// Declare encoding before the vendored parser's Unicode tables, including when
// a static host omits the HTTP charset header.
browser=browser.replace(/<head>\s*(?=<meta name="viewport")/g,'<head>\n<meta charset="UTF-8">\n');
browser=browser.replace(/<head>\s*(?:<meta charset="UTF-8">\s*)?/,'<head>\n<meta charset="UTF-8">\n');
browser=browser.replace(/<style(?: id="webtool-browser-design")?>[\s\S]*?<\/style>/,'<style id="webtool-browser-design">\n'+read('ui/browser.css')+'\n</style>');
if(!browser.includes('class="browser-intro"')) {
  const begin=browser.indexOf('<div class="nt-brand"');
  const end=browser.indexOf('<div class="nt-search">',begin);
  if(begin<0||end<0)throw Error('Browser start page anchors missing');
  browser=browser.slice(0,begin)+'<div class="nt-brand">Browse the web</div><p class="browser-intro">A new tab. Wherever you want to go.</p>\n'+browser.slice(end);
  browser=browser.replace(/id="gustCredit"\s+style="[^"]*"/,'id="gustCredit" style="position:absolute;bottom:22px;right:24px;z-index:4;color:var(--tx3);font:10px var(--ui);display:flex;gap:5px;align-items:center;pointer-events:none;"');
}
browser=browser.replace('style="position:relative; height:100%; display:flex; flex-direction:row;"','class="browser-settings-layout"');
browser=browser.replace('style="width:200px; min-width:200px; height:100%; background:rgba(13,15,18,0.7); border-right:1px solid var(--bd); display:flex; flex-direction:column; padding:24px 0; backdrop-filter:blur(8px); overflow:hidden; min-height:0;"','class="browser-settings-sidebar"');
browser=browser.replace('style="flex:1; overflow-y:auto; padding:40px 48px; display:flex; flex-direction:column; gap:32px;"','class="browser-settings-content"');
write('GUST.html',browser);
let loader=read('loader.html');
loader=loader.replace(/<style>[\s\S]*?<\/style>/,'<style>\n'+loading+'\n#frame{display:block}\n</style>').replace('<title>·</title>','<title>Webtool</title>').replace(/<link[^>]+fonts\.(?:googleapis|gstatic)[^>]+>\n?/g,'');
loader=loader.replace('content="#000000"','content="#141414"');
loader=loader.replace('<div id="fail"><div><b>All routes failed</b>every host unreachable</div></div>','<div id="fail"><div><b>Unable to load Webtool</b><span>The available hosts could not be reached. Check your connection, then try again.</span><br><button id="retry" type="button">Try again</button></div></div>');
if(!loader.includes('getElementById("retry").addEventListener'))loader=loader.replace('  ladder();','  document.getElementById("retry").addEventListener("click", ladder);\n  ladder();');
write('loader.html',loader);
console.log('Embedded Webtool and browser designs, and rebuilt the navigation shell.');
await import('./upgrade-workspaces.mjs?build='+Date.now());
await import('./upgrade-wisps.mjs?build='+Date.now());
