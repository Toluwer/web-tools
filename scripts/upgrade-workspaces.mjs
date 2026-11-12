import fs from 'node:fs';
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
const bridge=`  AI_TOOLS.create_document.run = function(args){return window.WTOffice.createDocument(args);};
  AI_TOOLS.create_presentation.run = function(args){return window.WTOffice.createPresentation(args);};
  AI_TOOLS.list_documents = {run:function(){return {files:window.WTOffice.list()};}};
  AI_TOOLS.read_document = {run:function(args){return window.WTOffice.read(args.id);}};
  AI_FN_TOOLS.forEach(function(t){if(t.function.name==="create_presentation")t.function.description="Create an editable PowerPoint file from independently positioned text, shapes, images, charts, and tables, with custom canvas dimensions and speaker notes. Open in Documents or download. No preset-only or fixed slide-count restriction.";if(t.function.name==="create_document")t.function.description="Create a rich Word document with paged preview, headings, rich runs, tables, lists, images, headers, footers, footnotes, and page numbers.";});
  var originalAiSystem = aiSysFor;
  aiSysFor = function(){return originalAiSystem()+window.WTOffice.prompt;};
  AI_FN_TOOLS.forEach(function(t){if(t.function.name === "create_presentation")t.function.parameters={type:"object",properties:{title:{type:"string"},width:{type:"number"},height:{type:"number"},slides:{type:"array",items:{type:"object",properties:{background:{type:"string"},notes:{type:"string"},elements:{type:"array",items:{type:"object",additionalProperties:true}}},additionalProperties:true}}},required:["title","slides"],additionalProperties:true};if(t.function.name === "create_document")t.function.parameters={type:"object",properties:{title:{type:"string"},blocks:{type:"array",items:{type:"object",additionalProperties:true}}},required:["title","blocks"],additionalProperties:true};});
  AI_FN_TOOLS.push({type:"function",function:{name:"list_documents",description:"List files in the local Documents workspace",parameters:{type:"object",properties:{}}}},{type:"function",function:{name:"read_document",description:"Read the source model or text of a local document for revision",parameters:{type:"object",properties:{id:{type:"string"}},required:["id"]}}});
  aiBuild();`;
const vendor=['jszip.min.js','docx-preview.min.js','pptxgen.bundle.js','slides.min.js'];
let deps='<!-- workspace-engines:start -->\n';
for(const file of vendor)deps+='<script>\n'+read('ui/vendor/'+file).replace(/<\/script/gi,'<\\/script')+'\n</script>\n';
deps+='<script>\n'+read('ui/icons.js')+'\n'+read('ui/office.js')+'\n</script>\n<!-- workspace-engines:end -->\n';
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
const css=read('ui/workspaces.css');
html=html.replace(/<style id="office-design">[\s\S]*?<\/style>\s*/,'');
html=html.replace('</head>','<style id="office-design">\n'+css+'\n</style>\n</head>');
fs.writeFileSync(p,html.replace(/\r\n/g,'\n'));
