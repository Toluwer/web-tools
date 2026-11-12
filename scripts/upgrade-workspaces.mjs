import fs from 'node:fs';
import {writeGenerated} from './write-generated.mjs';
const p=new URL('../WebTool.html',import.meta.url);
let html=fs.readFileSync(p,'utf8');
// Remove the retired preset-only Office instructions from both provider lanes.
html=html.replace(/^    'create_presentation .*\r?\n/m,'').replace(/^    'create_document .*\r?\n/m,'');
html=html.replace('Inline **bold**, *italic* and \x60code\x60 markers work inside paragraphs, bullets, headings and table cells. ', 'Use explicit rich text runs to style generated documents. ');
html=html.replace('el("div", "wt-hstat", "AI assistant")','el("div", "wt-hstat", "Write, research, and create.")').replace('aiStatEl.textContent = "AI assistant"','aiStatEl.textContent = "Write, research, and create."');
html=html.replace('AI assistant on (the floating button and @WebTool)','AI assistant and @WebTool replies enabled').replace('A floating button on every screen opens the assistant drawer;', 'The AI navigation tab opens the assistant workspace;');
// Source models must reach the assistant intact enough for meaningful revision.
html=html.replace('String(m.content || "").slice(0, 1400)', 'String(m.content || "").slice(0, /^TOOL RESULT read_document:/.test(m.content || "") ? 60000 : 1400)');
html=html.replace('last ? 6000 : 900', 'last ? (/^TOOL RESULT read_document:/.test(m.content || "") ? 60000 : 6000) : 900');
html=html.replace('})).slice(0, 1400) }); /* v83', '})).slice(0, tc.name === "read_document" ? 60000 : 1400) }); /* v83');
html=html.replace('})).slice(0, 1400) }); /* v83', '})).slice(0, j.tool === "read_document" ? 60000 : 1400) }); /* v83');

const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const bridge=read('ui/ai-bridge.js').trimEnd();
const vendor=['jszip.min.js','docx-preview.min.js','pptxgen.bundle.js','slides.min.js','word.min.js','readability.min.js'];
let deps='<!-- workspace-engines:start -->\n';
for(const file of vendor)deps+='<script>\n'+read('ui/vendor/'+file).replace(/<\/script/gi,'<\\/script')+'\n</script>\n';
const credits=JSON.parse(read('ui/weather/credits.json'));const photos=Object.fromEntries(credits.photos.map(p=>[p.name,{author:p.author,page:p.page,data:'data:image/jpeg;base64,'+fs.readFileSync(new URL('../ui/weather/'+p.name+'.jpg',import.meta.url)).toString('base64')}]));
const sources=['ui/icons.js','ui/media.js','ui/pagination.js','ui/office-schema.js','ui/presentation.js','ui/weather.js','ui/reader.js','ui/research.js','ui/office.js','ui/office-editor.js'];
deps+='<script>\n'+sources.map(p=>{let code=read(p);if(p==='ui/weather.js')code=code.replace('/* WEATHER_PHOTOS */{}',JSON.stringify(photos));if(p==='ui/reader.js')code=code.replace("/* READER_FRAME */''",JSON.stringify(read('ui/vendor/reader-transport.html'))).replace('/* READER_RELAYS */[]',JSON.stringify(JSON.parse(read('data/wisps.json')).servers.map(s=>s.url)));return code.replace(/<\/script/gi,'<\\/script');}).join('\n')+'\n</script>\n<!-- workspace-engines:end -->\n';
html=html.replace(/<!-- workspace-engines:start -->[\s\S]*?<!-- workspace-engines:end -->\s*/,'');
html=html.replace('<script>',()=>deps+'<script>');
if(!html.includes('/* full AI workspace */')){
 html=html.replace('function showView(name) {','function showView(name) {\n    /* full AI workspace */\n    ["aiWorkspace", "documentsWorkspace"].forEach(function(id){var panel=document.getElementById(id);if(panel)panel.hidden=(id==="aiWorkspace"?name!=="ai":name!=="documents");});');
 html=html.replace('beam: "choiceBeam" };','beam: "choiceBeam", ai: "choiceAI", documents: "choiceDocuments" };');
 html=html.replace(/aiFab = el\("button", "wt-fab"\);[\s\S]*?aiPanel = el\("div", "wt-panel"\);/,'aiFab = el("span"); aiFab.hidden = true;\n    aiBack = el("span"); aiBack.hidden = true;\n    aiPanel = el("section", "ai-workspace"); aiPanel.id = "aiWorkspace";');
 html=html.replace('aiPanel.setAttribute("role", "dialog");','aiPanel.setAttribute("role", "region");');
 html=html.replace('document.body.appendChild(aiPanel);','document.getElementById("workspace").appendChild(aiPanel);');
 html=html.replace('if (!aiCfg.on || !aiPanel) return;','if (!aiPanel) return;\n    if(!aiCfg.on){aiCfg.on=1;aiCfgSave();}\n    showView("ai");');
 html=html.replace('aiPanel.hidden = true;\n    aiBack.hidden = true;','aiPanel.hidden = true;\n    aiBack.hidden = true;\n    if(document.body.dataset.view === "ai")showView("start");');
 html=html.replace('el("div", "wt-hname", "WebTool")','el("div", "wt-hname", "AI assistant")');
 html=html.replace('xb.textContent = "Close";','xb.textContent = "All tools";');
 const begin=html.indexOf('    if (!aiGreeted && !aiHist.length) {');const end=html.indexOf('    aiScroll();',begin);
 if(begin>=0&&end>=0)html=html.slice(0,begin)+'    if (!aiGreeted && !aiHist.length) { aiGreeted=true; aiBubble("a", "What are we working on? I can help you research, write, work through code, and create documents or presentations. Your files open in the Documents workspace.", 0); }\n'+html.slice(end);
 html=html.replace('function aiArtifact(name, res) {','function aiArtifact(name, res) {\n    if(res && res._office) return window.WTOffice.card(res._office);');
 html=html.replace('var kind = fileKind(m, mime);','var kind = fileKind(m, mime);\n    if(kind === "docx" || kind === "pptx"){window.WTOffice.renderInto(body,m,blob);return;}');
 html=html.replace('  aiBuild();',bridge);
}
html=html.replace(/  AI_TOOLS\.create_document\.run = function\(args\)[\s\S]*?  aiBuild\(\);/,()=>bridge);
html=html.replace(/  aiBuild\(\);\n{2,}/,'  aiBuild();\n\n');

// Retire the SVG weather scene implementation and route cards through photography.
const wxStart=html.indexOf('  function aiWxGroup('),wxEnd=html.indexOf('  /* ---------- v83: artifact cards',wxStart);
if(wxStart>=0&&wxEnd>=0)html=html.slice(0,wxStart)+'  function aiWxCard(card){return window.WTWeather.render(card); }\n\n'+html.slice(wxEnd);
html=html.replace(/\["aiWorkspace", "documentsWorkspace"\]/g,'["aiWorkspace", "documentsWorkspace", "researchWorkspace"]');
html=html.replace('id==="aiWorkspace"?name!=="ai":name!=="documents"','id==="aiWorkspace"?name!=="ai":id==="documentsWorkspace"?name!=="documents":name!=="research"');
html=html.replace('ai: "choiceAI", documents: "choiceDocuments" };','ai: "choiceAI", documents: "choiceDocuments", research: "choiceResearch" };');
if(!html.includes('compose: function(prompt,send)'))html=html.replace('open: aiOpen,', 'compose: function(prompt,send){aiOpen();aiIn.value=prompt;aiIn.focus();window.WTContextRefresh?.();if(send)aiSendB.click();},\n    open: aiOpen,');
html=html.replace(/    showView\("ai"\);(?:\n    window.WTContextRefresh\?\.\(\);)*/,'    showView("ai");\n    window.WTContextRefresh?.();');
html=html.replace('Use at most 5 tool calls per question','Use at most 12 tool calls per question').replace(/at most 5 calls per question/g,'at most 12 calls per question').replace(/calls >= 5/g,'calls >= 12');
html=html.replace('if (calls >= 12) break;', 'if (calls >= 12) return {text:"The current research step limit is reached. Your sources and files are saved; ask me to continue if more work is needed.",calls:calls};');
html=html.replace('/create_document|create_presentation/.test(name) ? 180000 : 12000','/create_document|create_presentation|edit_document/.test(name) ? 180000 : /research_|weather/.test(name) ? 60000 : 12000');
html=html.replace(/\/\^TOOL RESULT read_document:\//g,'/\x5eTOOL RESULT (read_document|research_read_source):/');
html=html.replace('tc.name === "read_document" ? 60000 : 1400','/read_document|research_read_source/.test(tc.name) ? 60000 : tc.name === "research_search" ? 10000 : 4000').replace('j.tool === "read_document" ? 60000 : 1400','/read_document|research_read_source/.test(j.tool) ? 60000 : j.tool === "research_search" ? 10000 : 4000');

const css=['ui/workspaces.css','ui/research.css','ui/weather.css'].map(read).join('\n');
html=html.replace(/<style id="office-design">[\s\S]*?<\/style>\s*/,'');
html=html.replace('</head>','<style id="office-design">\n'+css+'\n</style>\n</head>');
writeGenerated(p,html.replace(/\r\n/g,'\n'));
