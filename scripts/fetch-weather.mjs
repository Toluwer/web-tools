import fs from 'node:fs';
const root=new URL('../ui/weather/',import.meta.url);fs.mkdirSync(root,{recursive:true});
const photos=[
  {name:'day',photo:'1525490829609-d166ddb58678',author:'CHUTTERSNAP',page:'https://unsplash.com/photos/TSgwbumanuE'},
  {name:'night',photo:'1550124211-d393ce20cda6',author:'David Monje',page:'https://unsplash.com/photos/s8i0-0RRK0E'},
  {name:'rain',photo:'1485714555834-1e2553e56899',author:'Kelly Sikkema',page:'https://unsplash.com/photos/j7fnWpHTBPA'},
  {name:'snow',photo:'1658501738491-5e82c25cf103',author:'Anna Artiukh',page:'https://unsplash.com/photos/mirziP7S3h8'},
  {name:'fog',photo:'1707500879909-498ea09cf899',author:'Rajesh Ram',page:'https://unsplash.com/photos/PqTxPU2pypQ'},
  {name:'storm',photo:'1561495249-db07c3bbe793',author:'Ben Owen',page:'https://unsplash.com/photos/v1CqPUBe5dk'}
];
for(const p of photos){const url='https://images.unsplash.com/photo-'+p.photo+'?fm=jpg&fit=crop&w=1100&q=68';const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw Error(p.name+' image request failed: '+r.status);const bytes=new Uint8Array(await r.arrayBuffer());fs.writeFileSync(new URL(p.name+'.jpg',root),bytes);console.log(p.name,bytes.length);}
fs.writeFileSync(new URL('credits.json',root),JSON.stringify({license:'https://unsplash.com/license',photos},null,2)+'\n');
