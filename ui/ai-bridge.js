  AI_TOOLS.create_document.run = function(args){
    attachResearchSources(args);
    return WTOffice.createDocument(args);
  };
  AI_TOOLS.create_presentation.run = function(args){
    attachResearchSources(args);
    return WTOffice.createPresentation(args);
  };
  AI_TOOLS.list_documents = {run:function(){return {files:WTOffice.list()};}};
  function attachResearchSources(args){if(!args.sourceIds?.length)return;var ids=[...new Set(args.sourceIds)],refs=WTResearch.references(ids);if(refs.length!==ids.length)throw Error('Some research source ids were not found. Read the dossier before creating a cited file.');args.references=[...(args.references||[]).filter(r=>!ids.includes(r.id)),...refs];}
  AI_TOOLS.read_document = {run:function(args){return WTOffice.read(args.id);}};
  AI_TOOLS.edit_document = {run:function(args){return WTOffice.edit({...args,operations:(args.operations||[]).map(op=>({...op,path:Array.isArray(op.path)?op.path:String(op.path).split('.'),value:op.value_json!==undefined?JSON.parse(op.value_json):op.value}))});}};
  AI_TOOLS.restore_document_version = {run:function(args){return WTOffice.restoreVersion(args.id,args.revision);}};
  AI_TOOLS.document_versions = {run:function(args){var r=WTOffice.get(args.id);return r?{current:r.revision,versions:(r.history||[]).map(v=>({revision:v.revision,updated:v.updated,name:v.name}))}:{error:'File not found'};}};
  AI_TOOLS.weather.run = WTWeather.fetch;
  AI_TOOLS.search_images = {run:WTMedia.search};
  AI_TOOLS.research_create_project = {run:async function(args){var r=await WTResearch.create(args.title);WTResearch.activate();return r;}};
  AI_TOOLS.research_list_projects = {run:function(){return {projects:WTResearch.list()};}};
  AI_TOOLS.research_search = {run:function(args){return WTResearch.search(args.query,args.scope);}};
  AI_TOOLS.research_save_source = {run:async function(args){var r=await WTResearch.save(args);WTResearch.activate();return {id:r.id,title:r.title,url:r.url,readState:r.readState,characters:r.text.length};}};
  AI_TOOLS.research_read_source = {run:function(args){return WTResearch.read(args);}};
  var originalAiSystem = aiSysFor;
  aiSysFor = function(){return originalAiSystem()+WTOffice.prompt+WTResearch.prompt+WTResearch.context()+WTOffice.context();};
  Object.entries(WTAuthoring.definitions).forEach(function(entry){var name=entry[0],definition=entry[1],tool=AI_FN_TOOLS.find(t=>t.function.name===name);if(tool){tool.function.description=definition.description;tool.function.parameters=definition.parameters;}else AI_FN_TOOLS.push({type:'function',function:{name:name,...definition}});});
  ['list_documents','read_document','document_versions'].forEach(function(name){if(!AI_FN_TOOLS.some(t=>t.function.name===name))AI_FN_TOOLS.push({type:'function',function:{name:name,description:name==='list_documents'?'List local generated and imported files with ids and revisions.':name==='read_document'?'Read a generated source model or imported file text.':'List retained revisions of a file.',parameters:{type:'object',properties:name==='list_documents'?{}:{id:{type:'string'}},...(name==='list_documents'?{}:{required:['id']})}}});});
  window.WTContextRefresh = function(){
    var panel=document.getElementById('aiWorkspace');if(!panel)return;panel.querySelector('.ai-context')?.remove();var labels=[WTResearch.label(),WTOffice.label()].filter(Boolean);if(!labels.length)return;var bar=el('div','ai-context');bar.appendChild(el('span',null,'Attached: '+labels.join(' · ')));var clear=el('button',null,'Detach');clear.type='button';clear.onclick=function(){WTResearch.detach();WTOffice.detach();WTContextRefresh();};bar.appendChild(clear);panel.insertBefore(bar,panel.querySelector('.wt-log'));
  };
  aiBuild();
