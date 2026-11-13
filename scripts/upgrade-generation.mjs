import fs from 'node:fs';
import {writeGenerated} from './write-generated.mjs';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8'),p=new URL('WebTool.html',root);let html=read('WebTool.html');
const api={docx:read('node_modules/docx/dist/index.d.ts'),pptxgenjs:read('node_modules/pptxgenjs/types/index.d.ts')};
let sources=read('ui/builds.js').replace('/* BUILD_ENGINES */{}',()=>JSON.stringify({word:read('ui/vendor/word.min.js'),slides:read('ui/vendor/pptxgen.bundle.js')})).replace('/* BUILD_API */{}',()=>JSON.stringify(api));
sources+='\n'+read('ui/agent.js')+'\n'+read('ui/build-ui.js')+'\n'+read('ui/chat-history.js')+'\n'+read('ui/office-review.js')+'\n'+read('ui/conversation.js');
const engine='<script>\n'+read('ui/vendor/html2canvas.min.js').replace(/<\/script/gi,'<\\/script')+'\n</script>\n<script>\n'+sources.replace(/<\/script/gi,'<\\/script')+'\n</script>';
html=html.replace(/<!-- generation-engine:start -->[\s\S]*?<!-- generation-engine:end -->\s*/,'');html=html.replace('<!-- workspace-engines:end -->',()=> '<!-- workspace-engines:end -->\n<!-- generation-engine:start -->\n'+engine+'\n<!-- generation-engine:end -->');
html=html.replace(/  \/\* generation bridge:start \*\/[\s\S]*?  \/\* generation bridge:end \*\/\s*/,'');
html=html.replace('  aiBuild();\n',()=> '  /* generation bridge:start */\n'+read('ui/generation-bridge.js')+'\n'+read('ui/chat-sync-bridge.js')+'\n  /* generation bridge:end */\n  aiBuild();\n');
// Restore generated-file controls beside their saved AI messages.
html=html.replace('content: String(m.x) });',String.raw`content: String(m.x)+((m.files||[]).length?"\nLocal file references: "+JSON.stringify(m.files):"") });`);
html=html.replace('x: m.x.slice(0, 6000), ts: +m.ts || 0','x: m.x, ts: +m.ts || 0, files:Array.isArray(m.files)?m.files:[]');
html=html.replace('aiBubble(m.r === "u" ? "u" : "a", m.x, m.ts); });','aiBubble(m.r === "u" ? "u" : "a", m.x, m.ts); (m.files||[]).forEach(f=>aiLogEl.append(WTOffice.card(f))); });');
html=html.replace('invalidCalls:!!(msg.tool_calls?.length && tcs?.length!==msg.tool_calls.length) };','invalidCalls:!!(msg.tool_calls?.length && tcs?.length!==msg.tool_calls.length),message:msg };');
// Keep complete prompts and detect truncated provider responses before execution.
html=html.replace('function aiAsk(messages, note) {','function aiAsk(messages, note, signal) {').replace('note: note, res: resolve','note: note, signal: signal, res: resolve').replace('it.res(await aiOne(it.m, it.note))','if(it.signal?.aborted)throw new DOMException("Stopped", "AbortError"); it.res(await aiOne(it.m, it.note, it.signal))');
html=html.replace('async function aiOne(messages, note) {','async function aiOne(messages, note, signal) {');
const providerStart=html.indexOf('  async function aiOne('),providerEnd=html.indexOf('  var AI_FN_TOOLS',providerStart);let provider=html.slice(providerStart,providerEnd);
if(!provider.includes('var abortRequest=()=>ctl.abort()'))provider=provider.replace('var ctl = new AbortController();','var ctl = new AbortController();\n      signal?.throwIfAborted(); var abortRequest=()=>ctl.abort();signal?.addEventListener("abort",abortRequest,{once:true});');
if(!provider.includes('removeEventListener("abort",abortRequest)'))provider=provider.replace('clearTimeout(kill);','clearTimeout(kill);\n      signal?.removeEventListener("abort",abortRequest);signal?.throwIfAborted();');
provider=provider.replace('body.reasoning_effort = "low"','body.reasoning_effort = WTAgent.effort()');
provider=provider.replace(/tools: AI_FN_TOOLS/g,'tools: WTAgent.tools(AI_FN_TOOLS)').replace(/body.tools = AI_FN_TOOLS/g,'body.tools = WTAgent.tools(AI_FN_TOOLS)');
provider=provider.replace('attempt >= (free ? 6 : 3) || waited > (free ? 150000 : 45000)','attempt >= (free ? 6 : WTAgent.isOffice() ? 8 : 3) || waited > (free ? 150000 : WTAgent.isOffice() ? 300000 : 45000)').replace('Math.min(free ? 95 : 20, Math.max(1, ra) + 1)','Math.min(free ? 95 : WTAgent.isOffice() ? 180 : 60, Math.max(1, ra) + 1)');
provider=provider.replace(/await aiSleep\(([^\n;]+)\)/g,'await WTAgent.sleep($1,signal)');
html=html.slice(0,providerStart)+provider+html.slice(providerEnd);
html=html.replace('await aiSleep(wait);','await WTAgent.sleep(wait,it.signal);');
html=html.replace(/(?:try \{ )*await WTAgent\.sleep\(wait,it\.signal\);(?: \} catch\(e\) \{ it\.rej\(e\);continue; \})*/g,'try { await WTAgent.sleep(wait,it.signal); } catch(e) { it.rej(e);continue; }');
html=html.replace('name: String(fn.name), args: aj });','name: String(fn.name), args: aj, raw:tc });').replace(/args: aj(?:, raw:tc)+/g,'args: aj, raw:tc');
html=html.replace('return { text: c, tcs: tcs };','return { text: c, tcs: tcs, finishReason:j?.choices?.[0]?.finish_reason, invalidCalls:!!(msg.tool_calls?.length && tcs?.length!==msg.tool_calls.length),message:msg };');
html=html.replace('temperature: 0.3, max_tokens: 16384 };\n    } else if (free)', 'temperature: 0.3, max_tokens: 16384, tools: AI_FN_TOOLS };\n    } else if (free)');
html=html.replaceAll('t.slice(0, 1000)','t').replaceAll('out.text.slice(0, 8000)','out.text').replace('String(m.x).slice(0, 800)','String(m.x)').replace('if (aiSendB) aiSendB.disabled = true;','if (aiSendB) aiSendB.disabled = false;');
html=html.replace('create_presentation|edit_document/.test(name) ? 180000','create_presentation|edit_document|run_build|inspect_build/.test(name) ? 180000');
html=html.replace('for (var i = 0; i < files.length; i++) sendFile(files[i]);','for (var i = 0; i < files.length; i++) sendFile(files[i]).catch(function(e){sysRow(e.message);});');
html=html.replace('u.stat.textContent = fmtB(f.size) + " · cancelled"; return;','u.stat.textContent = fmtB(f.size) + " · cancelled"; reject(Error("Upload cancelled")); return;');
html=html.replace('agent: function (prompt, prior) { return aiAgent(prompt, prior || [], null); }','agent: function (prompt, prior, note) { return aiAgent(prompt, prior || [], note); }');
if(!html.includes('malformed_tool_call'))html=html.replace('var msg = (j && j.choices && j.choices[0] && j.choices[0].message) || {};','var msg = (j && j.choices && j.choices[0] && j.choices[0].message) || {};\n      if(/MALFORMED_FUNCTION_CALL/i.test(j?.choices?.[0]?.finish_reason||""))return {text:"",tcs:null,finishReason:"malformed_tool_call",invalidCalls:true};');
// Upload promises resolve only when an actual chat receipt exists.
const start=html.indexOf('  function sendFile(f) {'),end=html.indexOf('  function fileUploadNtfy(',start);
if(start>=0&&end>=0&&!html.slice(start,end).includes('return new Promise')){let code=html.slice(start,end);code=code.replace('if ((state !== "live" && state !== "relay") || !f) return;','if ((state !== "live" && state !== "relay") || !f) return Promise.reject(Error("Connect to Chat before sending files."));\n    return new Promise(function(resolve,reject){');code=code.replace('      return;\n    }','      reject(Error("File exceeds the upload size limit."));return;\n    }');code=code.replace('if (!got) return;','if (!got) {reject(Error("Upload was cancelled."));return;}');code=code.replace('routeOwn(entry);','routeOwn(entry);resolve(entry);');code=code.replace('      if (u.btn) u.btn.remove();\n    });\n  }','      if (u.btn) u.btn.remove();reject(Error(String(err||"Upload failed")));\n    });\n    });\n  }');html=html.slice(0,start)+code+html.slice(end);}
html=html.replace(/<style id="generation-design">[\s\S]*?<\/style>\s*/,'').replace('</head>',()=>'<style id="generation-design">\n'+read('ui/generation.css')+'\n</style>\n</head>');
// Old unload beacons had neither delivery acknowledgement nor conflict protection.
html=html.replace('if (ACCT.name && ACCT.dirty) {\n        dropOverflowSync();','if (false) {\n        dropOverflowSync();');
html=html.replace('if (cloud && (cloud.rev || 0) > localRev)', 'if (cloud && cloud.name === ACCT.name)');
writeGenerated(p,html);
