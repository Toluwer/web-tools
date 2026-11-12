/* Navigation, tool finder, and keyboard behavior for the new presentation shell. */
(function () {
  'use strict';
  const iconMap={choiceHome:'home',choiceChecker:'checker',choiceTest:'test',choiceMovies:'movies',choiceBrook:'school',choiceBeam:'chat',choiceGust:'browser'};
  Object.keys(iconMap).forEach(function(id){var b=document.getElementById(id);b.querySelector('svg').outerHTML=WTIcon(iconMap[id]);});
  [['choiceAI','AI assistant','ai'],['choiceDocuments','Documents','documents'],['choiceResearch','Research','research']].forEach(function(item){var b=document.createElement('button');b.id=item[0];b.type='button';b.className='dock-item';b.innerHTML=WTIcon(item[2])+'<span class="dk-lab">'+item[1]+'</span>';document.getElementById('dock').appendChild(b);b.addEventListener('click',function(){if(item[0]==='choiceAI')window.__wtAi.open();else window.showView(item[0]==='choiceResearch'?'research':'documents');});});
  [['beamSearchBtn','search'],['beamDrawerBtn','menu'],['beamCloudIc','cloud']].forEach(function(item){var b=document.getElementById(item[0]);if(b)b.innerHTML=WTIcon(item[1]);});
  var tools = [
    {id:'choiceChecker',name:'Link checker',desc:'Find available links from the latest posts.',group:'Links'},
    {id:'choiceTest',name:'Link tester',desc:'Check one address or a whole list of links.',group:'Links'},
    {id:'choiceMovies',name:'Movies & series',desc:'Find something to watch. Pick up where you left off.',group:'Explore'},
    {id:'choiceBrook',name:'Brookwood Hub',desc:'Your day, events, news, and school schedule.',group:'Explore'},
    {id:'choiceBeam',name:'Chat',desc:'Stay in touch, share files, and start a conversation.',group:'Connect'},
    {id:'choiceAI',name:'AI assistant',desc:'Create, research, write, and work with your files.',group:'Create'},
    {id:'choiceDocuments',name:'Documents',desc:'Open documents and presentations in a dedicated workspace.',group:'Create'},
    {id:'choiceResearch',name:'Research',desc:'Read sources, collect evidence, and create cited work.',group:'Create'},
    {id:'choiceGust',name:'Browser',desc:'Open your browser in a separate workspace.',group:'Explore'}
  ];
  var names = {start:'All tools',checker:'Link checker',test:'Link tester',movies:'Movies & series',brook:'Brookwood Hub',beam:'Chat',ai:'AI assistant',documents:'Documents',research:'Research'};
  var $ = function (id) { return document.getElementById(id); };
  function node(tag,cls,text) { var n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n; }
  function sidebar(title,cls) { var side=node('aside','context-sidebar '+(cls||''));side.setAttribute('aria-label',title);side.appendChild(node('h2','context-title',title));return side; }
  function linksSidebar(active) {
    var side=sidebar('Links');
    ['choiceChecker','choiceTest'].forEach(function(id){var t=tools.find(function(x){return x.id===id;}),b=node('button','context-button'+(id===active?' active':''));b.type='button';b.innerHTML=$(id).querySelector('svg').outerHTML+'<span>'+t.name+'</span>';if(id===active)b.setAttribute('aria-current','page');b.addEventListener('click',function(){openTool(id);});side.appendChild(b);});return side;
  }
  // Construct new workspace layouts around the tool logic's stable element IDs.
  var checker=$('container'), checkerSide=linksSidebar('choiceChecker'),checkerStage=node('div','tool-stage'),checkerInner=node('div','tool-stage-inner');
  checkerSide.appendChild(node('div','context-label','Network'));
  checkerSide.appendChild($('blockerBar'));
  checkerSide.appendChild(node('div','context-label','Source'));
  checkerSide.appendChild($('postBar'));
  var checkerNote=node('p','context-note');checkerNote.innerHTML='<strong>Ready when you are.</strong>Choose a post to scan its links. Filter the results or copy the available addresses together.';checkerSide.appendChild(checkerNote);
  while(checker.firstChild)checkerInner.appendChild(checker.firstChild);
  checkerStage.appendChild(checkerInner);checker.append(checkerSide,checkerStage);
  var tester=$('testView'),testSide=linksSidebar('choiceTest'),testStage=node('div','tool-stage'),testInner=node('div','tool-stage-inner');
  var testNote=node('p','context-note');testNote.innerHTML='<strong>One link or a whole list.</strong>Paste addresses separated by spaces or new lines. Press Ctrl + Enter to start checking.';testSide.appendChild(testNote);
  while(tester.firstChild)testInner.appendChild(tester.firstChild);
  testStage.appendChild(testInner);tester.append(testSide,testStage);
  var movies=$('moviesView'),movieSide=sidebar('Library','library-sidebar'),movieContent=node('div','library-content');
  movieSide.appendChild(movies.querySelector('.mv-tabs'));
  var movieNote=node('p','context-note');movieNote.innerHTML='<strong>Something worth watching.</strong>Explore films and series, or search for a title you already have in mind.';movieSide.appendChild(movieNote);
  while(movies.firstChild)movieContent.appendChild(movies.firstChild);
  movies.append(movieSide,movieContent);
  var school=$('brookView'),schoolSide=sidebar('Brookwood','school-sidebar'),schoolContent=node('div','brook-content');schoolSide.appendChild($('brookTabs'));
  var schoolNote=node('p','context-note');schoolNote.innerHTML='<strong>Ahead of your day.</strong>School updates, events, and schedules, together in one workspace.';schoolSide.appendChild(schoolNote);
  while(school.firstChild)schoolContent.appendChild(school.firstChild);
  school.append(schoolSide,schoolContent);
  var intro=$('beamIntro'),introLayout=node('div','chat-intro'),chatWelcome=node('div','chat-welcome');
  chatWelcome.innerHTML='<h2>Good conversations start here.</h2><p>A place to catch up, share an idea, and keep your people close.</p><div class="chat-capabilities"><span>'+ $('choiceBeam').querySelector('svg').outerHTML+'Room chat and direct messages</span><span>'+ $('choiceChecker').querySelector('svg').outerHTML+'Files, pictures, and documents</span><span>'+ $('choiceHome').querySelector('svg').outerHTML+'Your account, across your devices</span></div>';
  introLayout.append(chatWelcome,intro.querySelector('.beam-card'));intro.appendChild(introLayout);
  // The desktop shell uses one persistent contextual sidebar, like the original
  // desktop design. Workspace content never supplies a second navigation shell.
  var globalSide=node('aside','workspace-sidebar');globalSide.id='workspaceSidebar';globalSide.setAttribute('aria-label','Workspace navigation');
  globalSide.innerHTML='<div class="sidebar-heading"><strong>Webtool</strong><button type="button" id="sidebarFinder" aria-label="Find a tool"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg></button></div><div class="sidebar-section-title">Workspace</div>';
  var sideNav=node('nav','sidebar-navigation');sideNav.setAttribute('aria-label','Workspaces');
  [{id:'choiceHome',name:'All tools'}].concat(tools).forEach(function(t){var b=node('button','sidebar-workspace');b.type='button';b.dataset.navigate=t.id;b.innerHTML=$(t.id).querySelector('svg').outerHTML+'<span>'+t.name+'</span>';b.addEventListener('click',function(){openTool(t.id);});sideNav.appendChild(b);});
  globalSide.appendChild(sideNav);
  var detailSlot=node('div','sidebar-detail');globalSide.appendChild(detailSlot);globalSide.appendChild(node('p','sidebar-footer','Everything in one place.'));
  document.body.appendChild(globalSide);
  var mobileContext=node('div','mobile-context');$('workspace').prepend(mobileContext);
  var contextMedia=window.matchMedia('(max-width:640px)'),currentView='start';
  var contextViews={checker:checkerSide,test:testSide,movies:movieSide,brook:schoolSide};
  Object.keys(contextViews).forEach(function(key){var side=contextViews[key];side.querySelectorAll('.context-title,.context-button,.context-note').forEach(function(n){n.remove();});side.remove();});
  function syncSidebar(name){
    currentView=name;
    sideNav.querySelectorAll('[data-navigate]').forEach(function(b){var active=b.dataset.navigate===({start:'choiceHome',checker:'choiceChecker',test:'choiceTest',movies:'choiceMovies',brook:'choiceBrook',beam:'choiceBeam',ai:'choiceAI',documents:'choiceDocuments',research:'choiceResearch'}[name]);b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    Object.values(contextViews).forEach(function(side){side.hidden=true;});
    mobileContext.hidden=!contextViews[name]||!contextViews[name].children.length;
    if(contextViews[name]){contextViews[name].hidden=false;(contextMedia.matches?mobileContext:detailSlot).appendChild(contextViews[name]);}
  }
  contextMedia.addEventListener('change',function(){syncSidebar(currentView);});
  var dialog = $('toolFinder'), finderInput = $('finderInput'), finderList = $('finderList');
  var lastFocus = null;
  function openTool(id) { var button=$(id); if (button) button.click(); }
  function searchTools(query) {
    var q=query.toLowerCase().trim();
    return tools.filter(function(t){return (t.name+' '+t.desc+' '+t.group).toLowerCase().indexOf(q)!==-1;});
  }
  function icon(id) { var svg=$(id).querySelector('svg'); return svg ? svg.outerHTML : ''; }
  var grid=$('toolGrid');
  tools.forEach(function(t) {
    var button=document.createElement('button');
    button.className='tool-card'; button.type='button'; button.dataset.tool=t.id;
    button.innerHTML='<span class="tool-icon" aria-hidden="true">'+icon(t.id)+'</span><span class="tool-description"><span class="tool-name">'+t.name+'</span><span class="tool-desc">'+t.desc+'</span></span><span class="tool-arrow" aria-hidden="true">›</span>';
    button.addEventListener('click',function(){openTool(t.id);}); grid.appendChild(button);
  });
  $('homeSearch').addEventListener('input',function(){
    var ids=searchTools(this.value).map(function(t){return t.id;});
    grid.querySelectorAll('[data-tool]').forEach(function(b){b.hidden=ids.indexOf(b.dataset.tool)===-1;});
    $('homeNoResults').hidden=ids.length>0;
  });
  function renderFinder() {
    finderList.textContent='';
    searchTools(finderInput.value).forEach(function(t) {
      var button=document.createElement('button'); button.type='button';
      button.innerHTML=icon(t.id)+'<span>'+t.name+'<small>'+t.desc+'</small></span>';
      button.addEventListener('click',function(){dialog.close();openTool(t.id);}); finderList.appendChild(button);
    });
    if (!finderList.children.length) { var empty=document.createElement('p'); empty.className='command-empty'; empty.textContent='No tools match that search.'; finderList.appendChild(empty); }
  }
  function openFinder() { lastFocus=document.activeElement; finderInput.value=''; renderFinder(); dialog.showModal(); finderInput.focus(); }
  $('openFinder').addEventListener('click',openFinder);
  $('sidebarFinder').addEventListener('click',openFinder);
  $('finderClose').addEventListener('click',function(){dialog.close();});
  dialog.addEventListener('close',function(){if(lastFocus)lastFocus.focus();});
  dialog.addEventListener('click',function(e){if(e.target===dialog){var r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  finderInput.addEventListener('input',renderFinder);
  finderInput.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){var b=finderList.querySelector('button');if(b){e.preventDefault();b.focus();}} if(e.key==='Enter'){var first=finderList.querySelector('button');if(first){e.preventDefault();first.click();}}});
  finderList.addEventListener('keydown',function(e){
    var items=Array.from(finderList.querySelectorAll('button')),i=items.indexOf(document.activeElement);
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault(); var next=i+(e.key==='ArrowDown'?1:-1);if(next<0)finderInput.focus();else items[Math.min(items.length-1,next)].focus();}
  });
  document.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(dialog.open)dialog.close();else openFinder();}});
  $('assistantForm').addEventListener('submit',function(e){
    e.preventDefault();
    if(window.__wtAi){window.__wtAi.setCfg({on:1});window.__wtAi.open();var input=document.querySelector('.wt-in');if(input){input.value=$('assistantPrompt').value;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}}
  });
  window.wtShellSync=function(name){
    $('workspaceName').textContent=names[name]||'Home'; document.body.dataset.view=name;
    syncSidebar(name);
    var workspace=$('workspace');workspace.scrollTop=0;
    // Focus the workspace after explicit navigation, without scrolling the rail.
    workspace.focus({preventScroll:true});
  };
  document.querySelectorAll('.dock-item').forEach(function(button){button.setAttribute('aria-label',button.querySelector('.dk-lab').textContent);});
  document.querySelectorAll('input,textarea,select').forEach(function(input){if(!input.hasAttribute('aria-label')&&!input.labels?.length&&input.placeholder)input.setAttribute('aria-label',input.placeholder);});
  document.addEventListener('keydown',function(e){
    if(e.key!=='Tab'||dialog.open)return;
    var modal=Array.from(document.querySelectorAll('.beam-pwback:not([hidden]),.bm-fv:not([hidden])')).filter(function(n){return n.getBoundingClientRect().height>0;}).pop();
    if(!modal)return;
    var focusable=Array.from(modal.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]')).filter(function(n){return n.getBoundingClientRect().height>0;});
    if(!focusable.length)return;
    var first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){e.preventDefault();first.focus();}
  });
  window.WTOffice.mount();
  window.WTResearch.mount();
  $('homeTitle').textContent='All tools';
  $('homeTitle').nextElementSibling.textContent='Your tools, together in one place.';
  $('assistantTitle').lastChild.textContent=' Webtool AI';
  $('assistantTitle').nextElementSibling.textContent='Ask a question, work through a problem, or create something.';
  $('workspaceName').textContent='All tools';document.body.dataset.view='start';syncSidebar('start');
})();
