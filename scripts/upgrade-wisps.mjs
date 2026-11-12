import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const audit=JSON.parse(read('data/wisps.json'));
if(audit.additional<46||audit.servers.length<46)throw Error('The requested additional verified endpoints are missing.');
let html=read('GUST.html');
const values=audit.servers.map(s=>JSON.stringify(s.url)).join(',\n                ');
html=html.replace(/const WISP_POOL_DEFAULTS = \[\.\.\.new Set\(\[[\s\S]*?\]\)\];/,'const WISP_POOL_DEFAULTS = [...new Set([\n                '+values+'\n            ])];');
html=html.replace(/(?:[ \t]*\/\/[^\n]*\n)+([ \t]*const WISP_POOL_DEFAULTS)/,'            // Verified HTTP and certificate-validated HTTPS through actual Wisp TCP streams.\n            // Deduplicated by hostname. Sources and timestamps: data/wisps.json.\n            // Availability is rechecked at runtime; no invented or handshake-only entries.\n$1');
if(!html.includes('/* bounded relay audit */')){
 html=html.replace('await Promise.all(pool.map(async url => {','/* bounded relay audit */\n                        let cursor = 0;\n                        await Promise.all(Array.from({length: Math.min(4,pool.length)},async () => {\n                          while(cursor < pool.length){const url = pool[cursor++];');
 html=html.replace("if (typeof renderGXWispList === 'function') renderGXWispList();\n                        }));","if (typeof renderGXWispList === 'function') renderGXWispList();\n                          }\n                        }));");
 const start=html.indexOf('                    // ── Boot gate: full WISP-pool benchmark');
 const end=html.indexOf('            // Signal that libcurl init is complete',start);
 if(start>=0&&end>=0)html=html.slice(0,start)+`                    // Audit the expanded pool in the background. Navigation is ready
                    // immediately; a larger relay directory must not block the UI.
                    if(poolModeOn() && typeof curl !== 'undefined' && curl){
                        benchmarkWispPool().then(()=>{try{rememberFastestRelay();}catch(e){}}).catch(()=>{});
                    }

`+html.slice(end);
}
fs.writeFileSync(new URL('../GUST.html',import.meta.url),html);
