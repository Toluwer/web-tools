import {
  Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,ImageRun,
  Header,Footer,PageNumber,PageBreak,ColumnBreak,Bookmark,InternalHyperlink,
  ExternalHyperlink,FootnoteReferenceRun,AlignmentType,HeadingLevel,
  BorderStyle,WidthType,PageOrientation,SectionType,LevelFormat,ShadingType,
  VerticalAlign,UnderlineType
} from 'docx';

const number=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
const clamp=(v,a,b,d=a)=>Math.min(b,Math.max(a,number(v,d)));
const hex=(s,d='222222')=>/^[\da-f]{6}$/i.test(String(s||'').replace('#',''))?String(s).replace('#',''):d;
const align=s=>({left:AlignmentType.LEFT,right:AlignmentType.RIGHT,center:AlignmentType.CENTER,justify:AlignmentType.JUSTIFIED}[s]||AlignmentType.LEFT);
const textOf=b=>b.text??(b.runs||[]).map(r=>typeof r==='string'?r:r.text||'').join('');
const url=s=>/^https?:\/\/|^mailto:/i.test(String(s||''));

export function inline(value,style={}){
  if(Array.isArray(value))return value.flatMap(r=>typeof r==='string'?inline(r,style):[{...style,...r}]);
  const text=String(value??''),result=[],pattern=/(\*\*([^*]+)\*\*|~~([^~]+)~~|==([^=]+)==|`([^`]+)`|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
  let cursor=0,match;
  while((match=pattern.exec(text))){
    if(match.index>cursor)result.push({...style,text:text.slice(cursor,match.index)});
    result.push({...style,text:match[2]||match[3]||match[4]||match[5]||match[6]||match[7],...(match[2]?{bold:true}:match[3]?{strike:true}:match[4]?{highlight:'yellow'}:match[5]?{font:'Consolas'}:match[6]?{italic:true}:{link:match[8]})});cursor=pattern.lastIndex;
  }
  if(cursor<text.length||!result.length)result.push({...style,text:text.slice(cursor)});
  return result;
}

export async function create(spec){
  if(!spec||!Array.isArray(spec.blocks)&&!Array.isArray(spec.sections))throw Error('A document needs blocks or sections.');
  const footnotes={},references=spec.references||[],font=spec.font||'Arial',size=clamp(spec.fontSize,6,48,11),accent=hex(spec.accent,'245B9B');
  let foot=1,headingIndex=0;
  const headingList=[];
  const scan=items=>{for(const b of items||[]){if(b.type==='heading')headingList.push({text:textOf(b),level:clamp(b.level,1,6),id:'heading_'+headingList.length});if(b.blocks)scan(b.blocks);}};
  scan(spec.blocks);for(const s of spec.sections||[])scan(s.blocks);
  function runs(value,style={}){
    return inline(value,style).flatMap(r=>{
      const opts={text:String(r.text??''),bold:!!r.bold,italics:!!r.italic,strike:!!r.strike,font:r.font||font,size:clamp(r.fontSize,4,144,size)*2,color:r.color?hex(r.color):undefined,underline:r.underline?{type:UnderlineType.SINGLE}:undefined,highlight:r.highlight,subScript:r.subscript,superScript:r.superscript,shading:r.background?{fill:hex(r.background)}:undefined,break:r.break?1:undefined};
      const parts=opts.text.split('\n'),children=parts.map((t,i)=>new TextRun({...opts,text:t,break:i?1:opts.break}));
      const linked=r.link&&url(r.link)?[new ExternalHyperlink({children,link:r.link})]:children;
      if(r.footnote||r.citation){
        const ref=r.citation?references.find((v,i)=>String(v.id||i+1)===String(r.citation)):null;
        if(r.citation&&!ref)throw Error('Citation '+r.citation+' has no matching reference.');
        const note=r.footnote||[ref.author,ref.title,ref.year,ref.url].filter(Boolean).join('. '),id=foot++;
        footnotes[id]={children:[new Paragraph({children:[new TextRun(String(note))]})]};linked.push(new FootnoteReferenceRun(id));
      }
      return linked;
    });
  }
  function para(b={},extra={}){
    const p={children:runs(b.runs||b.text||'',b.bold?{bold:true}:{}),alignment:align(b.align),spacing:{before:Math.max(0,number(b.spaceBefore,0))*20,after:Math.max(0,number(b.spaceAfter,8))*20,line:clamp(b.lineSpacing,.7,4,1.2)*240},keepNext:!!b.keepWithNext,keepLines:!!b.keepTogether,widowControl:true,pageBreakBefore:!!b.pageBreakBefore,bidirectional:!!b.rtl,indent:b.indent?{left:number(b.indent,0)*1440}:undefined,shading:b.background?{fill:hex(b.background),type:ShadingType.CLEAR}:undefined,...extra};
    if(b.type==='heading'){
      const h=headingList[headingIndex++];p.heading=HeadingLevel['HEADING_'+clamp(b.level,1,6)];p.keepNext=true;p.children=[new Bookmark({id:h?.id||'heading_'+headingIndex,children:p.children})];
    }
    return new Paragraph(p);
  }
  async function blocks(items,available){
    const out=[];
    for(const [index,b] of (items||[]).entries()){
      if(!b||typeof b!=='object')throw Error('Block '+(index+1)+' must be an object.');
      const type=b.type||'paragraph';
      if(['paragraph','heading','caption','hyperlink'].includes(type))out.push(para(type==='hyperlink'?{...b,runs:[{text:b.text||b.url,link:b.url}]}:type==='caption'?{...b,runs:inline(b.text,{italic:true,color:'666666',fontSize:9})}:b));
      else if(type==='pagebreak'||type==='columnbreak')out.push(new Paragraph({children:[type==='pagebreak'?new PageBreak():new ColumnBreak()]}));
      else if(type==='bullet'||type==='numbered'||type==='checklist'){
        const level=clamp(b.level,0,8),items=Array.isArray(b.items)?b.items:[b];
        for(const item of items){const entry=typeof item==='string'?{text:item}:item;out.push(para({...b,...entry},type==='checklist'?{children:runs((entry.checked?'☑ ':'☐ ')+(entry.text||''))}:{numbering:{reference:type==='bullet'?'bullets':'numbers',level,instance:number(b.listId,0)}}));}
      }else if(type==='table'||type==='kv'){
        if(!Array.isArray(b.rows)||!b.rows.length)throw Error('Table '+(index+1)+' needs rows.');
        const count=Math.max(...b.rows.map(row=>row.reduce((n,c)=>n+clamp(c?.colSpan??c?.span,1,100),0)));
        const widths=Array.from({length:count},(_,i)=>Math.round(available*(b.columnWidths?.[i]||1)/((b.columnWidths||Array(count).fill(1)).reduce((a,n)=>a+Number(n),0))));
        const border={style:type==='kv'||b.border===false?BorderStyle.NONE:BorderStyle.SINGLE,size:4,color:hex(b.borderColor,'D7DBE0')};
        const rows=[];
        for(const [ri,row] of b.rows.entries()){
          const cells=[];let ci=0;
          for(const raw of row){
            const c=raw&&typeof raw==='object'?raw:{text:String(raw??'')},span=clamp(c.colSpan??c.span,1,count),header=b.header!==false&&ri===0&&type!=='kv';
            cells.push(new TableCell({children:c.blocks?await blocks(c.blocks,widths[ci]||available/count):[para({...c,runs:c.runs||inline(c.text??'',{bold:c.bold??header})})],columnSpan:span,rowSpan:c.rowSpan?clamp(c.rowSpan,1,100):undefined,width:{size:widths.slice(ci,ci+span).reduce((a,n)=>a+n,0),type:WidthType.DXA},shading:c.background||header?{fill:hex(c.background,b.headerColor?hex(b.headerColor):'E8EDF4')}:undefined,verticalAlign:VerticalAlign.CENTER,margins:{top:100,bottom:100,left:140,right:140}}));ci+=span;
          }
          rows.push(new TableRow({children:cells,tableHeader:b.header!==false&&ri===0,cantSplit:b.allowSplit!==true}));
        }
        out.push(new Table({rows,width:{size:100,type:WidthType.PERCENTAGE},columnWidths:widths,borders:Object.fromEntries(['top','left','bottom','right','insideHorizontal','insideVertical'].map(k=>[k,border]))}),new Paragraph({text:'',spacing:{after:80}}));
        if(b.caption)out.push(para({type:'caption',text:b.caption}));
      }else if(type==='image'){
        const image=await window.WTMedia.image(b.data||b.src),maxWidth=available/1440*96;
        const w=Math.min(maxWidth,clamp(b.width,.1,22,Math.min(maxWidth/96,image.width/96))*96),h=b.height?clamp(b.height,.1,22)*96:w*image.height/image.width;
        out.push(new Paragraph({alignment:align(b.align||'center'),children:[new ImageRun({type:image.type,data:image.bytes,transformation:{width:Math.round(w),height:Math.round(h),rotation:number(b.rotate,0)},altText:{title:b.alt||b.caption||'Image',description:b.alt||'',name:b.alt||'Image'}})]}));
        if(b.caption||b.credit)out.push(para({type:'caption',text:[b.caption,b.credit].filter(Boolean).join(' · '),align:b.align||'center'}));
      }else if(type==='cover'){
        out.push(para({text:b.title||spec.title,runs:[{text:b.title||spec.title,fontSize:36,bold:true,color:accent}],align:b.align||'center',spaceBefore:90,spaceAfter:24}),para({text:b.subtitle||spec.subtitle||'',align:b.align||'center'}),para({text:[b.author,b.date].filter(Boolean).join(' · '),align:b.align||'center'}));
        if(b.pageBreakAfter!==false)out.push(new Paragraph({children:[new PageBreak()]}));
      }else if(type==='toc'){
        out.push(para({text:b.title||'Contents',runs:[{text:b.title||'Contents',fontSize:22,bold:true,color:accent}],keepWithNext:true}));
        for(const h of headingList.filter(h=>h.level<=number(b.levels,6)))out.push(new Paragraph({indent:{left:(h.level-1)*240},spacing:{after:100},children:[new InternalHyperlink({anchor:h.id,children:[new TextRun({text:h.text,color:accent})]})]}));
      }else if(type==='code'||type==='quote'||type==='callout'){
        out.push(para({...b,text:undefined,runs:[...(b.title?[{text:b.title+'\n',bold:true}]:[]),...(type==='code'?[{text:b.text||b.lines?.join('\n')||'',font:'Consolas',fontSize:9}]:inline(b.text||'',type==='quote'?{italic:true}:{}))],background:b.background|| (type==='quote'?'F5F5F5':'EEF3FA')},{border:type==='quote'?{left:{style:BorderStyle.SINGLE,size:16,color:accent,space:12}}:undefined}));
      }else if(type==='divider')out.push(new Paragraph({text:'',border:{bottom:{style:BorderStyle.SINGLE,size:6,color:hex(b.color,'CCD3DB')}},spacing:{before:160,after:160}}));
      else if(type==='spacer')out.push(new Paragraph({text:'',spacing:{after:clamp(b.lines,0,20,1)*size*20}}));
      else if(type==='columns')throw Error('Use a section with columns and blocks for a multi-column layout.');
      else throw Error('Unsupported document block: '+type+'. Supported blocks are described by the create_document tool.');
    }
    return out;
  }
  const sections=[];
  const models=spec.sections?.length?spec.sections:[{blocks:spec.blocks}];
  for(const model of models){
    const settings={...spec,...model},landscape=settings.orientation==='landscape',a4=settings.pageSize==='A4';
    let w=number(settings.pageWidth,a4?8.2677:8.5),h=number(settings.pageHeight,a4?11.6929:11);if(landscape&&w<h)[w,h]=[h,w];
    const margins={top:1,right:1,bottom:1,left:1,...settings.margins},available=(w-margins.left-margins.right)*1440;
    if(available<1440||h-margins.top-margins.bottom<1)throw Error('Page margins leave less than one inch of usable space.');
    const section={properties:{type:settings.continuous?SectionType.CONTINUOUS:SectionType.NEXT_PAGE,page:{size:{width:w*1440,height:h*1440,orientation:landscape?PageOrientation.LANDSCAPE:PageOrientation.PORTRAIT},margin:Object.fromEntries(Object.entries(margins).map(([k,v])=>[k,Math.round(number(v,1)*1440)])),pageNumbers:settings.pageNumberStart?{start:settings.pageNumberStart}:undefined},column:settings.columns?{count:clamp(settings.columns,1,6),space:360,separate:!!settings.columnDivider}:undefined,titlePage:!!settings.differentFirstPage},children:await blocks(model.blocks||[],available)};
    if(settings.header)section.headers={default:new Header({children:[para({text:settings.header,spaceAfter:0})]})};
    if(settings.footer||settings.pageNumbers||settings.pageNum){const content=[...runs(settings.footer||'')];if(settings.pageNumbers||settings.pageNum)content.push(new TextRun('  '),new TextRun({children:[PageNumber.CURRENT]}),new TextRun(' / '),new TextRun({children:[PageNumber.TOTAL_PAGES]}));section.footers={default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:content})]})};}
    sections.push(section);
  }
  if(references.length){const last=sections.at(-1);last.children.push(para({text:'References',runs:[{text:'References',bold:true,fontSize:18,color:accent}],pageBreakBefore:!!spec.referencesNewPage,keepWithNext:true}));for(const [i,r] of references.entries())last.children.push(para({runs:[{text:'['+(i+1)+'] '+[r.author,r.title,r.year].filter(Boolean).join('. ')+'. '},...(r.url?[{text:r.url,link:r.url}]:[])]}));}
  const levels=format=>Array.from({length:9},(_,level)=>({level,format,text:format===LevelFormat.BULLET?'•':'%'+(level+1)+'.',alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720+level*360,hanging:360}}}}));
  const headingStyles=Object.fromEntries(Array.from({length:6},(_,i)=>['heading'+(i+1),{run:{font,bold:true,color:accent,size:[44,34,28,25,23,22][i]},paragraph:{spacing:{before:260,after:140},keepNext:true}}]));
  const doc=new Document({
    title:spec.title||'Document',creator:spec.author||'Webtool',description:spec.description||'',subject:spec.subject||'',sections,footnotes,
    features:{updateFields:true},
    numbering:{config:[{reference:'numbers',levels:levels(LevelFormat.DECIMAL)},{reference:'bullets',levels:levels(LevelFormat.BULLET)}]},
    styles:{default:{document:{run:{font,size:size*2,color:hex(spec.color)},paragraph:{spacing:{after:160,line:288}}},...headingStyles}}
  });
  return Packer.toBlob(doc);
}
