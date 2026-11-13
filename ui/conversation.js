/* Local AI history is durable; localStorage is only a fast-start cache. */
(function(){
 let dbp;const db=()=>dbp||(dbp=new Promise((resolve,reject)=>{const r=indexedDB.open('webtool-conversations',1);r.onupgradeneeded=()=>r.result.createObjectStore('chats');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}));
 function merge(a,b){const rows=new Map();for(const m of [...a,...b]){const key=m.id||m.r+'|'+m.ts+'|'+m.x;rows.set(key,{...rows.get(key),...m});}return [...rows.values()].sort((a,b)=>(a.ts||0)-(b.ts||0));}
 async function load(){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('chats').objectStore('chats').get('main');r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}
 async function save(messages,clear=false){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('chats','readwrite'),store=t.objectStore('chats'),r=store.get('main');r.onsuccess=()=>store.put(clear?[]:merge(r.result||[],messages),'main');t.oncomplete=resolve;t.onerror=()=>reject(t.error);});}
 window.WTConversation={load,save,merge};
})();
