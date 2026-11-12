/* Lazy browser transport for source reading, using the app's verified relay pool. */
(function(){
  const frameSource=/* READER_FRAME */'';
  const relays=/* READER_RELAYS */[];
  let frame,loaded;
  function load(){if(loaded)return loaded;loaded=new Promise((resolve,reject)=>{frame=document.createElement('iframe');frame.hidden=true;frame.title='Research source transport';frame.setAttribute('sandbox','allow-scripts');frame.srcdoc=frameSource;frame.onload=()=>resolve(frame);frame.onerror=()=>reject(Error('The source transport could not load.'));document.body.appendChild(frame);});return loaded;}
  async function read(url){
    const target=await load(),channel=new MessageChannel(),relay=localStorage.getItem('wt-reader-relay')||relays[0];
    return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{channel.port1.close();frame.remove();loaded=null;reject(Error('The reader connection timed out. Select a different connection server in Research.'));},45000);channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();if(event.data.error)reject(Error(event.data.error));else {try{resolve({...WTReadability.extract(event.data.html,event.data.url,event.data.plain),url:event.data.url});}catch(e){reject(e);}}};target.contentWindow.postMessage({type:'webtool-source-read',url,relay},'*',[channel.port2]);});
  }
  window.WTReader={read,relays};
})();
