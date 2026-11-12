/* Editable slide authoring, with one normalization path for AI and revisions. */
(function(){
  const n=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
  const colorCanvas=document.createElement('canvas');colorCanvas.width=colorCanvas.height=1;
  function color(value,otherwise='222222'){
    if(value==null||value==='')return otherwise;
    const text=String(value).trim();if(/^[a-f\d]{6}$/i.test(text))return text;
    const css=/^#?[a-f\d]{3}$/i.test(text)?'#'+text.replace('#',''):text;
    if(!CSS.supports('color',css))throw Error('Invalid color: '+text);
    const c=colorCanvas.getContext('2d',{willReadFrequently:true});c.clearRect(0,0,1,1);c.fillStyle=css;c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data].slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  const paint=value=>typeof value==='string'?{color:color(value)}:value?{...value,color:color(value.color,'FFFFFF')}:undefined;
  const themes={charcoal:{background:'202020',color:'F5F5F5',accent:'3B82F6'},dark:{background:'171717',color:'F5F5F5',accent:'3B82F6'},ocean:{background:'0E2436',color:'F4F9FC',accent:'56CFE1'},clean:{background:'FFFFFF',color:'172033',accent:'3B82F6'},noir:{background:'101010',color:'FFFFFF',accent:'A1B7FF'}};
  const measure=document.createElement('canvas').getContext('2d');
  function runs(value){
    if(typeof value==='string')return WTWordEngine.inline(value).map(r=>({text:r.text,options:{bold:r.bold,italic:r.italic,strike:r.strike,fontFace:r.font,fontSize:r.fontSize,color:r.color?color(r.color):undefined,hyperlink:r.link?{url:r.link}:undefined}}));
    return (value||[]).map(r=>typeof r==='string'?{text:r}:({text:String(r.text||''),options:{...r.options,...Object.fromEntries(['bold','italic','fontSize','color','fontFace','bullet','breakLine','subscript','superscript'].filter(k=>r[k]!=null).map(k=>[k,r[k]]))}}));
  }
  function sizedText(value,options,warnings,label){
    const entries=runs(value),text=entries.map(r=>r.text).join('');
    let size=n(options.fontSize,20),margin=Array.isArray(options.margin)?options.margin:[n(options.margin,3),n(options.margin,3),n(options.margin,3),n(options.margin,3)];
    const available=Math.max(1,options.w*96-(margin[1]+margin[3])*4/3),height=Math.max(1,options.h*96-(margin[0]+margin[2])*4/3);
    const lineCount=points=>{measure.font=(options.bold?'bold ':'')+(points*4/3)+'px '+(options.fontFace||'Arial');let lines=0;for(const paragraph of text.split('\n')){let width=0;lines++;for(const word of paragraph.split(/(\s+)/)){const w=measure.measureText(word).width;if(width+w>available&&width){lines++;width=w;}else width+=w;}}return lines;};
    if(options.fit!=='none'){while(size>9&&lineCount(size)*size*1.55>height)size-=.5;options.fontSize=size;if(lineCount(size)*size*1.55>height)warnings.push(label+': text may exceed its box; enlarge it or shorten the text.');}
    return entries;
  }
  async function create(spec){
    if(!Array.isArray(spec?.slides)||!spec.slides.length)throw Error('Provide at least one slide.');
    const warnings=[],ppt=new PptxGenJS(),width=n(spec.width,13.333),height=n(spec.height,7.5);
    if(width<1||height<1||width>56||height>56)throw Error('Slide dimensions must be between 1 and 56 inches.');
    const theme={...themes.clean,...(typeof spec.theme==='string'?(themes[spec.theme]||{}):spec.theme||{})};theme.background=color(theme.background);theme.color=color(theme.color);theme.accent=color(theme.accent);
    ppt.defineLayout({name:'CUSTOM',width,height});ppt.layout='CUSTOM';ppt.title=spec.title||'Presentation';ppt.author=spec.author||'Webtool';ppt.subject=spec.subject||'';ppt.lang=spec.lang||'en-US';ppt.theme={headFontFace:theme.headFontFace||'Arial',bodyFontFace:theme.bodyFontFace||'Arial',lang:ppt.lang};
    const references=spec.references||[];const credits=[];
    let total=0;
    for(const [si,model] of spec.slides.entries()){
      const slide=ppt.addSlide(),bg=color(model.background||model.bg,theme.background),fg=model.color?color(model.color):model.background||model.bg?(parseInt(bg,16)>0x888888?'222222':'F5F5F5'):theme.color;
      slide.background={color:bg};if(model.backgroundImage){const image=await WTMedia.image(model.backgroundImage);slide.addImage({data:image.data,x:0,y:0,w:width,h:height,sizing:{type:'cover',w:width,h:height}});}
      let elements=model.elements;
      if(!Array.isArray(elements)){
        elements=[{type:'text',text:model.title||'',x:.65,y:.45,w:width-1.3,h:1,fontSize:34,bold:true}];
        if(model.subtitle)elements.push({type:'text',text:model.subtitle,x:.65,y:1.65,w:width-1.3,h:1,fontSize:23});
        if(model.bullets)elements.push({type:'text',text:model.bullets.map(t=>({text:typeof t==='string'?t:t.text,options:{bullet:{indent:20},breakLine:true,indentLevel:t.level||0}})),x:.7,y:2,w:width-1.4,h:height-2.7,fontSize:23});
        for(const [i,c] of (model.columns||[]).entries())elements.push({type:'text',text:[{text:c.title+'\n',options:{bold:true} },...(c.bullets||[]).map(t=>({text:String(t),options:{bullet:true,breakLine:true}}))],x:.7+i*(width-1.4)/model.columns.length,y:2,w:(width-1.8)/model.columns.length,h:height-2.7,fontSize:22});
      }
      async function add(entries,offset={x:0,y:0},prefix=''){
        for(const [ei,raw] of entries.entries()){
          const e={...raw},label='Slide '+(si+1)+', '+prefix+'element '+(ei+1),type=e.type||'text';
          if(type==='group'){await add(e.elements||[],{x:offset.x+n(e.x,0),y:offset.y+n(e.y,0)},prefix+(ei+1)+'.');continue;}
          const o={...e.options,x:offset.x+n(e.x,n(e.options?.x,.5)),y:offset.y+n(e.y,n(e.options?.y,.5)),w:n(e.w,n(e.options?.w,3)),h:n(e.h,n(e.options?.h,1))};
          if(o.w<=0||o.h<0||(!['line'].includes(type)&&!o.h))throw Error(label+': width and height must be positive.');
          for(const k of ['fontSize','fontFace','bold','italic','underline','strike','align','valign','margin','rotate','transparency','shadow','hyperlink','charSpacing','paraSpaceAfter','bullet','breakLine','radius','flipH','flipV'])if(e[k]!=null)o[k]=e[k];
          if(o.x<0||o.y<0||o.x+o.w>width+.02||o.y+o.h>height+.02)warnings.push(label+' extends outside the slide canvas.');
          if(e.fill!=null||o.fill)o.fill=paint(e.fill??o.fill);if(e.line!=null||o.line)o.line=typeof (e.line??o.line)==='string'?{color:color(e.line??o.line)}:{...(e.line??o.line),color:color((e.line??o.line).color,'DDDDDD')};o.color=color(e.color??o.color,fg);
          try{
            if(type==='text'){
              o.fontFace=o.fontFace||theme.bodyFontFace||'Arial';o.fontSize=n(o.fontSize,20);o.margin=o.margin??3;o.fit=e.fit||'shrink';o.valign=o.valign||'top';slide.addText(sizedText(e.text??'',o,warnings,label),o);
            }else if(type==='shape'||type==='line')slide.addShape(type==='line'?'line':({roundedRect:'roundRect',rectangle:'rect',circle:'ellipse'}[e.shape]||e.shape||'rect'),o);
            else if(type==='image'||type==='svg'){
              let source=e.data||e.src;if(type==='svg')source='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(e.svg||'');
              const image=await WTMedia.image(source),sizing=e.sizing||'contain';
              if(e.credit)credits.push('Slide '+(si+1)+': '+e.credit);slide.addImage({...o,data:image.data,...(sizing==='stretch'?{}:{sizing:{type:sizing==='cover'?'cover':'contain',w:o.w,h:o.h}}),altText:e.alt||'Image'});
            }else if(type==='table'){
              if(!e.rows?.length)throw Error('A table needs at least one row.');
              const rows=e.rows.map((row,ri)=>row.map(c=>typeof c==='string'||typeof c==='number'?{text:String(c),options:{bold:e.header!==false&&ri===0,fill:ri===0&&e.header!==false?(e.headerColor||theme.accent):undefined,color:ri===0&&e.header!==false?'FFFFFF':fg}}:{...c,options:{...c.options,fill:c.options?.fill?color(c.options.fill):undefined}}));
              slide.addTable(rows,{...o,fontSize:n(e.fontSize,14),border:e.border||{type:'solid',pt:1,color:'D5DAE0'},fill:undefined,margin:e.margin??5,autoPage:e.autoPage===true,autoPageRepeatHeader:e.header!==false,colW:e.columnWidths,rowH:e.rowHeight,verbose:false});
            }else if(type==='chart'){
              if(!e.data?.length)throw Error('A chart needs data series.');
              const allowed=['bar','line','pie','doughnut','area','scatter','bubble','radar'];if(!allowed.includes(e.chartType||'bar'))throw Error('Use chartType '+allowed.join(', ')+'.');
              slide.addChart(e.chartType||'bar',e.data,{...o,showLegend:e.data.length>1,showTitle:!!e.title,title:e.title||'',showValue:false,showCatName:false,showBorder:false,catAxisLabelColor:fg,valAxisLabelColor:fg,legendColor:fg,chartColors:[theme.accent,'71A7F8','65C6B1','DFB96D'],...e.chartOptions});
            }else if(type==='diagram'){
              const nodes=e.nodes||[],edges=e.edges||[];if(!nodes.length)throw Error('A diagram needs nodes.');const positions=new Map();
              nodes.forEach((node,i)=>{const rows=e.layout==='vertical';const nx=node.x??(rows?o.x:o.x+i*o.w/nodes.length),ny=node.y??(rows?o.y+i*o.h/nodes.length:o.y);positions.set(String(node.id||i),{...node,x:nx,y:ny,w:node.w??(rows?o.w:o.w/nodes.length-.45),h:node.h??(rows?o.h/nodes.length-.4:o.h)});});
              for(const edge of edges){const a=positions.get(String(edge.from)),b=positions.get(String(edge.to));if(!a||!b)throw Error('Diagram edge references a missing node.');const vertical=Math.abs(b.y-a.y)>Math.abs(b.x-a.x),ax=vertical?a.x+a.w/2:a.x+(b.x>=a.x?a.w:0),ay=vertical?a.y+(b.y>=a.y?a.h:0):a.y+a.h/2,bx=vertical?b.x+b.w/2:b.x+(b.x>=a.x?0:b.w),by=vertical?b.y+(b.y>=a.y?0:b.h):b.y+b.h/2;slide.addShape('line',{x:ax,y:ay,w:bx-ax,h:by-ay,line:{color:color(edge.color,theme.accent),width:1.5,beginArrowType:edge.bidirectional?'triangle':undefined,endArrowType:'triangle'}});}
              for(const node of positions.values()){slide.addShape(node.shape||'roundRect',{x:node.x,y:node.y,w:node.w,h:node.h,rectRadius:.08,fill:{color:color(node.fill,theme.accent)},line:{color:color(node.fill,theme.accent)}});const opts={x:node.x+.1,y:node.y+.1,w:node.w-.2,h:node.h-.2,fontSize:n(node.fontSize,18),color:color(node.color,'FFFFFF'),align:'center',valign:'mid',margin:3};slide.addText(sizedText(node.text||node.label||'',opts,warnings,label),opts);}
            }else throw Error('Unsupported element type '+type+'.');
          }catch(error){throw Error(label+': '+error.message);}
        }
      }
      await add([...(spec.master?.elements||[]),...elements]);
      if(spec.footer||spec.numbers)slide.addText([spec.footer,spec.numbers?String(si+1):''].filter(Boolean).join('  ·  '),{x:.5,y:height-.35,w:width-1,h:.2,fontSize:9,color:fg,margin:0,align:'right'});
      const refs=(model.sourceIds||[]).map(id=>references.find((r,i)=>String(r.id||i+1)===String(id)));if(refs.some(r=>!r))throw Error('Slide '+(si+1)+' cites a missing reference.');
      slide.addNotes([model.notes||'',...refs.map(r=>[r.author,r.title,r.year,r.url].filter(Boolean).join('. ')),...credits.filter(c=>c.startsWith('Slide '+(si+1)+':'))].join('\n\n'));
      total+=1+(slide.newAutoPagedSlides?.length||0);
    }
    if(references.length&&spec.includeReferences!==false){for(let i=0;i<references.length;i+=6){const slide=ppt.addSlide();slide.background={color:theme.background};slide.addText('Sources',{x:.65,y:.45,w:width-1.3,h:.6,fontSize:28,bold:true,color:theme.color,margin:0});for(const [j,r] of references.slice(i,i+6).entries()){const y=1.5+j*(height-2)/6;slide.addText('['+(i+j+1)+'] '+[r.author,r.title,r.year].filter(Boolean).join('. '),{x:.65,y,w:width-1.3,h:.5,fontSize:14,color:theme.color,margin:0});if(r.url)slide.addText(r.url,{x:.65,y:y+.45,w:width-1.3,h:.25,fontSize:10,color:theme.accent,margin:0,hyperlink:{url:r.url}});}total++;}}
    return {blob:new Blob([await ppt.write({outputType:'arraybuffer',compression:true})],{type:'application/vnd.openxmlformats-officedocument.presentationml.presentation'}),warnings:[...new Set(warnings)],slides:total};
  }
  window.WTDeckEngine={create,color};
})();
