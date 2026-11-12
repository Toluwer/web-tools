/* Runs alone in an opaque-origin frame. No user browser cookies are shared. */
(function(){
  const ready=libcurl.load_wasm();let busy=false;
  function allowed(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[|.*\.local$)/i.test(u.hostname)||/^172\.(1[6-9]|2\d|3[01])\./.test(u.hostname))throw Error('Only public HTTPS sources can be read.');return u.href;}
  addEventListener('message',async event=>{
    if(event.source!==parent||event.data?.type!=='webtool-source-read'||!event.ports[0])return;
    const port=event.ports[0];if(busy){port.postMessage({error:'Another source is being read. Try again when it finishes.'});port.close();return;}busy=true;
    try{
      await ready;const relay=new URL(event.data.relay);if(relay.protocol!=='wss:')throw Error('Use a secure reader relay.');libcurl.set_websocket(relay.href);
      let url=allowed(event.data.url),response;const signal=AbortSignal.timeout(35000);
      for(let redirects=0;redirects<6;redirects++){
        response=await libcurl.fetch(url,{signal,redirect:'manual',headers:{Accept:'text/html,application/xhtml+xml,text/plain;q=0.8'}});
        if(response.status>=300&&response.status<400){const location=response.headers.get('location');if(!location)throw Error('The source returned an empty redirect.');url=allowed(new URL(location,url).href);continue;}break;
      }
      if(!response?.ok)throw Error('The source returned HTTP '+response?.status+'. It was not marked as read.');
      const type=response.headers.get('content-type')||'';if(!/html|text\/plain/i.test(type))throw Error('This source is not a readable web page. Use an article URL.');
      const reader=response.body.getReader(),decoder=new TextDecoder();let html='',bytes=0;
      while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>5*1024*1024){await reader.cancel();throw Error('This page exceeds the 5 MB source-reading limit.');}html+=decoder.decode(value,{stream:true});}html+=decoder.decode();
      port.postMessage({html,url,plain:/text\/plain/i.test(type)});
    }catch(e){port.postMessage({error:e.message||'The reader connection failed.'});}
    finally{busy=false;port.close();}
  });
})();
