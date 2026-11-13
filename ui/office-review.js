(function(){
 async function capture(record,requested,render){
  if(!record)throw Error('File not found.');
  const target=document.createElement('div');target.style.cssText='position:fixed;left:-1800px;top:0;width:1200px;z-index:-1;background:#ddd';document.body.append(target);
  try{
   await render(record,target,document.createElement('nav'));const frames=[...target.querySelectorAll('iframe')];
   for(const f of frames){if(!f.contentDocument?.body?.children.length)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Preview frame did not load.')),20000);f.addEventListener('load',()=>{clearTimeout(timer);resolve();},{once:true});});await f.contentDocument.fonts.ready;}
   const pages=record.kind==='docx'?[...frames[0].contentDocument.querySelectorAll('section.office-docx')]:frames.map(f=>f.contentDocument.body),indices=[...new Set(requested)];
   if(indices.length>4)throw Error('Inspect up to four pages per batch.');if(indices.some(i=>!Number.isInteger(i)||i<1||i>pages.length))throw Error('Page numbers must be between 1 and '+pages.length);
   const images=[],warnings=[];
   for(const i of indices){const page=pages[i-1],d=page.ownerDocument;await Promise.all([...page.querySelectorAll('img')].map(img=>img.decode().catch(()=>warnings.push('Page '+i+': image failed to decode'))));
    const rect=page.getBoundingClientRect();for(const e of page.querySelectorAll('p,table,img,svg')){const r=e.getBoundingClientRect();if(r.right>rect.right+3||r.bottom>rect.bottom+3)warnings.push('Page '+i+': content may overflow page boundary');}
    let surface=page,width=960,height=540;
    if(record.kind==='docx'){
     width=Math.ceil(rect.width);height=Math.ceil(rect.height);surface=page.cloneNode(true);surface.style.setProperty('margin','0','important');surface.style.setProperty('box-shadow','none','important');surface.style.width=width+'px';surface.style.minHeight=height+'px';surface.style.height=height+'px';
     // Freeze a page at origin. Capturing a scrolled, offset iframe directly
     // otherwise clips its header and applies the wrong viewport dimensions.
     const original=[...d.body.childNodes],bodyStyle=d.body.style.cssText;d.body.replaceChildren(surface);d.body.style.cssText='margin:0;padding:0;background:white;width:'+width+'px;height:'+height+'px;zoom:1';
     const canvas=await html2canvas(surface,{foreignObjectRendering:true,scale:1,logging:false,backgroundColor:'#fff',width,height,windowWidth:width,windowHeight:height,scrollX:0,scrollY:0});images.push({page:i,url:canvas.toDataURL('image/jpeg',.86)});d.body.replaceChildren(...original);d.body.style.cssText=bodyStyle;
    }else{
     const vb=surface.querySelector('svg')?.viewBox?.baseVal;if(vb?.width&&vb?.height){height=width*vb.height/vb.width;if(height>2000){width*=2000/height;height=2000;}}
     surface.style.width=width+'px';surface.style.height=height+'px';const canvas=await html2canvas(surface,{foreignObjectRendering:true,scale:1,logging:false,backgroundColor:'#fff',width,height,windowWidth:width,windowHeight:height,scrollX:0,scrollY:0});images.push({page:i,url:canvas.toDataURL('image/jpeg',.86)});
    }
   }
   return {pages:pages.length,images,warnings:[...new Set(warnings)],renderer:'Browser Office preview; native Word/PowerPoint may paginate or render some features differently.'};
  }finally{target.remove();}
 }
 window.WTReview={capture};
})();
