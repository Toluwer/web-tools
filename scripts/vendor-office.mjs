import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const vendor=path.join(root,'ui/vendor');fs.mkdirSync(vendor,{recursive:true});
for(const [name,from,to] of [['jszip','dist/jszip.min.js','jszip.min.js'],['docx-preview','dist/docx-preview.min.js','docx-preview.min.js'],['pptxgenjs','dist/pptxgen.bundle.js','pptxgen.bundle.js'],['html2canvas','dist/html2canvas.min.js','html2canvas.min.js']])fs.copyFileSync(path.join(root,'node_modules',name,from),path.join(vendor,to));
const result=await build({absWorkingDir:root,entryPoints:['ui/slides-entry.mjs'],bundle:true,platform:'browser',format:'iife',globalName:'WTSlideEngine',target:'es2022',minify:true,metafile:true,outfile:'ui/vendor/slides.min.js',legalComments:'inline'});
const word=await build({absWorkingDir:root,entryPoints:['ui/word-entry.mjs'],bundle:true,platform:'browser',format:'iife',globalName:'WTWordEngine',target:'es2022',minify:true,metafile:true,outfile:'ui/vendor/word.min.js',legalComments:'inline'});
const reader=await build({absWorkingDir:root,entryPoints:['ui/reader-entry.mjs'],bundle:true,platform:'browser',format:'iife',globalName:'WTReadability',target:'es2022',minify:true,metafile:true,outfile:'ui/vendor/readability.min.js',legalComments:'inline'});
const gust=fs.readFileSync(path.join(root,'GUST.html'),'utf8'),start=gust.indexOf('const libcurl = (function()'),end=gust.indexOf('</script>',start);
if(start<0||end<0)throw Error('The existing browser transport could not be located.');
fs.writeFileSync(path.join(vendor,'reader-transport.html'),'<!doctype html><meta charset="utf-8"><title>Research transport</title>\n<!-- libcurl.js: Copyright (C) 2024 ading2210. GNU LGPL v3. Source: https://github.com/ading2210/libcurl.js -->\n<script>\n'+gust.slice(start,end).replace(/[ \t]+$/gm,'')+'\n'+fs.readFileSync(path.join(root,'ui/reader-frame.js'),'utf8')+'\n</script>');
const packages=new Set(['jszip','docx-preview','pptxgenjs','docx','@mozilla/readability','html2canvas']);
for(const input of [...Object.keys(result.metafile.inputs),...Object.keys(word.metafile.inputs),...Object.keys(reader.metafile.inputs)]){const match=input.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);if(match)packages.add(match[1]);}
function collectDependencies(name){const pkg=JSON.parse(fs.readFileSync(path.join(root,'node_modules',name,'package.json'),'utf8'));for(const dep of Object.keys(pkg.dependencies||{})){if(packages.has(dep))continue;packages.add(dep);collectDependencies(dep);}}
collectDependencies('html2canvas');
let notice='# Bundled Office libraries\n\nCompiled runtime files are included unchanged or bundled with esbuild.\n\n';
for(const name of [...packages].sort()){
 const dir=path.join(root,'node_modules',name),pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));notice+='## '+name+' '+pkg.version+'\n\n';
 const license=fs.readdirSync(dir).find(f=>/^licen[sc]e(?:\.|$)/i.test(f));
 if(license)notice+=fs.readFileSync(path.join(dir,license),'utf8')+'\n\n';else notice+='License: '+pkg.license+'; source: '+JSON.stringify(pkg.repository||'')+'\n\n';
}
fs.writeFileSync(path.join(vendor,'THIRD_PARTY_NOTICES.md'),notice.trimEnd()+'\n');
console.log('Bundled Office engines and retained notices for '+packages.size+' packages.');
