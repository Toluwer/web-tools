// Publicly documented endpoints only. A working result must return HTTP through
// a Wisp TCP stream; WebSocket upgrades alone are not accepted.
const fs=require('node:fs'),cp=require('node:child_process');
const WebSocket=require('ws');
const output='artifacts/wisp-audit.json';
fs.mkdirSync('artifacts',{recursive:true});
async function discover(){
 const candidates=new Map((fs.existsSync('artifacts/wisp-candidates.json')?JSON.parse(fs.readFileSync('artifacts/wisp-candidates.json')):[]).map(x=>[x.url,x]));
 const add=(url,source)=>{try{const u=new URL(url);if(u.protocol!=='wss:'||/localhost|example|your[-.]|127\.|192\.168\.|10\.|\$|\{/.test(u.hostname))return;candidates.set(u.href,{url:u.href,source});}catch{}};
 const original=fs.readFileSync('GUST.html','utf8').match(/const WISP_POOL_DEFAULTS = \[\.\.\.new Set\(\[([\s\S]*?)\]\)\]/)?.[1]||'';
 for(const m of original.matchAll(/"(wss:[^"]+)"/g))add(m[1],'existing pool');
 for(let page=Number(process.argv[2]||1);page<=Number(process.argv[3]||4);page++){
  const q=new URLSearchParams({q:process.env.WISP_QUERY||'wisp "wss://" -path:node_modules -path:package-lock.json',per_page:'100',page:String(page)});
  let data;try{data=JSON.parse(cp.execFileSync('gh',['api','search/code?'+q],{encoding:'utf8',maxBuffer:3000000}));}catch{break;}
  const items=data.items||[];let cursor=0;
  await Promise.all(Array.from({length:5},async()=>{while(cursor<items.length){const item=items[cursor++];try{const raw='https://raw.githubusercontent.com/'+item.repository.full_name+'/HEAD/'+item.path;const r=await fetch(raw,{signal:AbortSignal.timeout(10000)});if(!r.ok)continue;const text=await r.text();for(const line of text.split('\n')){if(!/wisp/i.test(line))continue;for(const m of line.matchAll(/wss:\/\/[a-zA-Z0-9._-]+(?::\d+)?(?:\/[a-zA-Z0-9_./-]*)?/g))add(m[0],item.html_url);}}catch{}}}));
  fs.writeFileSync('artifacts/wisp-candidates.json',JSON.stringify([...candidates.values()],null,2));console.log('Discovery',page,candidates.size);
 }
 return [...candidates.values()];
}
function probe(entry){return new Promise(resolve=>{
 const start=Date.now();let socket,done=false,received='',sent=false;
 const finish=(ok,reason)=>{if(done)return;done=true;clearTimeout(timer);try{socket.terminate();}catch{}resolve({...entry,ok,reason,latencyMs:Date.now()-start,checkedAt:new Date().toISOString()});};
 const timer=setTimeout(()=>finish(false,'TCP/HTTP probe timed out'),8000);
 try{socket=new WebSocket(entry.url,{origin:'null',handshakeTimeout:5000});}catch(e){finish(false,e.message);return;}
 socket.on('open',()=>{const host=Buffer.from('example.com');const packet=Buffer.alloc(8+host.length);packet[0]=1;packet.writeUInt32LE(1,1);packet[5]=1;packet.writeUInt16LE(80,6);host.copy(packet,8);socket.send(packet);const req=Buffer.from('GET / HTTP/1.1\r\nHost: example.com\r\nConnection: close\r\n\r\n');const data=Buffer.alloc(5+req.length);data[0]=2;data.writeUInt32LE(1,1);req.copy(data,5);socket.send(data);sent=true;});
 socket.on('message',data=>{const b=Buffer.from(data);if(b[0]===2&&b.readUInt32LE(1)===1){received+=b.subarray(5).toString();if(/HTTP\/1\.[01] 200/.test(received)&&/Example Domain/i.test(received))finish(true,'Wisp TCP stream returned example.com HTTP 200');if(received.length>64000)finish(false,'Unexpected response');}});
 socket.on('error',e=>finish(false,e.message));socket.on('close',()=>{if(!done)finish(false,received?'Closed without verified HTTP response':'Connection closed');});
});}
(async()=>{const candidates=await discover();let cursor=0;const results=[];await Promise.all(Array.from({length:5},async()=>{while(cursor<candidates.length){const entry=candidates[cursor++];const result=await probe(entry);results.push(result);fs.writeFileSync(output,JSON.stringify(results,null,2));if(result.ok)console.log('Verified',results.filter(r=>r.ok).length,entry.url);}}));console.log('Finished',results.filter(r=>r.ok).length,'of',results.length);})().catch(e=>{console.error(e);process.exit(1);});
