import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const vendor=path.join(root,'ui/vendor');fs.mkdirSync(vendor,{recursive:true});
for(const [name,from,to] of [['jszip','dist/jszip.min.js','jszip.min.js'],['docx-preview','dist/docx-preview.min.js','docx-preview.min.js'],['pptxgenjs','dist/pptxgen.bundle.js','pptxgen.bundle.js']])fs.copyFileSync(path.join(root,'node_modules',name,from),path.join(vendor,to));
const result=await build({absWorkingDir:root,entryPoints:['ui/slides-entry.mjs'],bundle:true,platform:'browser',format:'iife',globalName:'WTSlideEngine',target:'es2022',minify:true,metafile:true,outfile:'ui/vendor/slides.min.js',legalComments:'inline'});
const packages=new Set(['jszip','docx-preview','pptxgenjs']);
for(const input of Object.keys(result.metafile.inputs)){const match=input.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);if(match)packages.add(match[1]);}
let notice='# Bundled Office libraries\n\nCompiled runtime files are included unchanged or bundled with esbuild.\n\n';
for(const name of [...packages].sort()){
 const dir=path.join(root,'node_modules',name),pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));notice+='## '+name+' '+pkg.version+'\n\n';
 const license=fs.readdirSync(dir).find(f=>/^licen[sc]e(?:\.|$)/i.test(f));
 if(license)notice+=fs.readFileSync(path.join(dir,license),'utf8')+'\n\n';else notice+='License: '+pkg.license+'; source: '+JSON.stringify(pkg.repository||'')+'\n\n';
}
fs.writeFileSync(path.join(vendor,'THIRD_PARTY_NOTICES.md'),notice.trimEnd()+'\n');
console.log('Bundled Office engines and retained notices for '+packages.size+' packages.');
