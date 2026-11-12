/* Shared image loading for Office exports. Failures remain visible to the author. */
(function(){
  const cache=new Map();
  async function image(source){
    if(typeof source!=='string'||!source)throw Error('An image needs a data URI or HTTPS URL.');
    if(!/^(data:image\/|https:\/\/)/i.test(source))throw Error('Image sources must use HTTPS or an image data URI.');
    if(cache.has(source))return cache.get(source);
    const pending=(async()=>{
      const response=await fetch(source,{signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw Error('Could not load image (HTTP '+response.status+').');
      const blob=await response.blob();
      if(blob.size>12*1024*1024)throw Error('This image exceeds the 12 MB export limit.');
      if(!blob.type.startsWith('image/'))throw Error('The image URL returned '+(blob.type||'an unknown file type')+'.');
      if(blob.type.includes('svg')){
        const svg=new DOMParser().parseFromString(await blob.text(),'image/svg+xml');
        if(svg.querySelector('parsererror,script,foreignObject'))throw Error('Use an SVG without scripts or embedded HTML.');
        for(const n of svg.querySelectorAll('*'))for(const a of [...n.attributes])if(/^on/i.test(a.name)||(/href$/i.test(a.name)&&!a.value.startsWith('#')))throw Error('External or active SVG content is unsupported.');
      }
      const url=URL.createObjectURL(blob);
      try{
        const img=new Image();img.src=url;await img.decode();
        if(!img.naturalWidth||!img.naturalHeight)throw Error('The image has no usable dimensions.');
        const scale=Math.min(1,2000/Math.max(img.naturalWidth,img.naturalHeight));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        const type=blob.type==='image/jpeg'?'jpeg':'png',data=canvas.toDataURL('image/'+type,.9);
        return {data,width:canvas.width,height:canvas.height,type:type==='jpeg'?'jpg':type,bytes:Uint8Array.from(atob(data.split(',')[1]),c=>c.charCodeAt(0))};
      }finally{URL.revokeObjectURL(url);}
    })();
    cache.set(source,pending);if(cache.size>24)cache.delete(cache.keys().next().value);
    try{return await pending;}catch(e){cache.delete(source);throw e;}
  }
  async function search({query,count=5}){
    const q=String(query||'').trim();if(!q)throw Error('Provide an image search query.');
    const url='https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch='+encodeURIComponent(q)+'&gsrnamespace=6&gsrlimit='+Math.max(1,Math.min(8,Number(count)||5))+'&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=1200&format=json&origin=*';
    const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Image search returned HTTP '+response.status+'.');const data=await response.json();if(data.error)throw Error(data.error.info||'Image search failed.');
    const plain=s=>new DOMParser().parseFromString(s||'','text/html').body.textContent||'';
    return {images:Object.values(data.query?.pages||{}).filter(p=>p.imageinfo?.[0]?.mime?.startsWith('image/')).map(p=>{const i=p.imageinfo[0],m=i.extmetadata||{},creator=plain(m.Artist?.value),license=plain(m.LicenseShortName?.value);return {title:p.title.replace(/^File:/,''),url:i.thumburl||i.url,sourcePage:i.descriptionurl,creator,license,licenseURL:m.LicenseUrl?.value||'',credit:[creator,license,i.descriptionurl].filter(Boolean).join(' · ')};}),note:'Use real returned image URLs. Put credit in image.credit to retain attribution in the document caption or slide notes.'};
  }
  window.WTMedia={image,search};
})();
