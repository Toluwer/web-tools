/* Browser pagination for DOCX previews; the exported file keeps native Word flow. */
(function(){
  async function paginate(document){
    await document.fonts.ready;
    await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));
    const view=document.defaultView;
    let pageCount=0;
    for(const original of [...document.querySelectorAll('section.office-docx')]){
      const article=original.querySelector(':scope > article');if(!article)continue;
      const style=view.getComputedStyle(original),height=parseFloat(style.minHeight)||1056,padding=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom),other=[...original.children].filter(n=>n!==article),repeated=other.filter(n=>['HEADER','FOOTER'].includes(n.tagName)),endnotes=other.filter(n=>!['HEADER','FOOTER'].includes(n.tagName)),decorations=repeated.reduce((sum,n)=>sum+n.getBoundingClientRect().height,0),budget=Math.max(80,height-padding-decorations-4);
      if(article.scrollHeight<=budget+2&&parseInt(view.getComputedStyle(article).columnCount||'1')===1)continue;
      const queue=[...article.childNodes],shell=original.cloneNode(false),articleShell=article.cloneNode(false),siblings=repeated.map(n=>n.cloneNode(true));let page=original,body=article;
      article.replaceChildren();
      endnotes.forEach(n=>n.remove());
      const columns=parseInt(view.getComputedStyle(article).columnCount)||1;
      function prepare(){if(columns>1){body.style.height=budget+'px';body.style.columnFill='auto';}body.querySelectorAll('img').forEach(img=>{img.style.maxWidth='100%';});}
      prepare();
      function fits(){return columns>1?body.scrollWidth<=body.clientWidth+2:body.scrollHeight<=budget+2;}
      function next(){if(++pageCount>250)throw Error('This file exceeds the 250-page browser preview limit. Download it to view the complete document.');const p=shell.cloneNode(false),b=articleShell.cloneNode(false);for(const sibling of siblings.filter(n=>n.tagName==='HEADER'))p.appendChild(sibling.cloneNode(true));p.appendChild(b);for(const sibling of siblings.filter(n=>n.tagName!=='HEADER'))p.appendChild(sibling.cloneNode(true));page.after(p);page=p;body=b;prepare();}
      function cleanRepeatedIds(fragment){fragment.querySelectorAll?.('[id]').forEach(n=>n.removeAttribute('id'));return fragment;}
      function cutParagraph(p,count){
        const walker=document.createTreeWalker(p,view.NodeFilter.SHOW_TEXT);let node=walker.nextNode(),remaining=count;
        while(node&&remaining>node.data.length){remaining-=node.data.length;node=walker.nextNode();}
        if(!node)return null;
        const before=document.createRange();before.selectNodeContents(p);before.setEnd(node,remaining);
        const after=document.createRange();after.selectNodeContents(p);after.setStart(node,remaining);
        const a=p.cloneNode(false),b=p.cloneNode(false);a.appendChild(before.cloneContents());b.appendChild(after.cloneContents());b.removeAttribute('id');const ids=new Set([...a.querySelectorAll('[id]')].map(n=>n.id));b.querySelectorAll('[id]').forEach(n=>{if(ids.has(n.id))n.removeAttribute('id');});b.style.marginTop='0';return [a,b];
      }
      function splitParagraph(p){
        const length=p.textContent.length;if(length<2)return null;let low=1,high=length-1,best=0;
        while(low<=high){const middle=Math.floor((low+high)/2),pieces=cutParagraph(p,middle);if(!pieces)break;body.appendChild(pieces[0]);const fit=fits();pieces[0].remove();if(fit){best=middle;low=middle+1;}else high=middle-1;}
        if(!best)return null;const boundary=p.textContent.lastIndexOf(' ',best);if(boundary>best*.65)best=boundary+1;return cutParagraph(p,best);
      }
      function splitTable(table){
        const rows=[...table.rows];if(rows.length<2)return null;
        const header=rows[0],repeat=header.querySelector('th')||[...header.querySelectorAll('span')].some(s=>parseInt(view.getComputedStyle(s).fontWeight)>=600),a=table.cloneNode(false),b=table.cloneNode(false);
        for(const col of table.querySelectorAll(':scope > colgroup')){a.appendChild(col.cloneNode(true));b.appendChild(col.cloneNode(true));}
        const left=document.createElement('tbody'),right=document.createElement('tbody');a.appendChild(left);b.appendChild(right);body.appendChild(a);let accepted=0;
        for(let i=0;i<rows.length;){let end=i;for(let j=i;j<=end;j++)for(const cell of rows[j].cells)end=Math.min(rows.length-1,Math.max(end,j+(cell.rowSpan||1)-1));const group=rows.slice(i,end+1).map(r=>r.cloneNode(true));left.append(...group);if(!fits()){group.forEach(r=>r.remove());break;}accepted=end+1;i=end+1;}
        a.remove();if(!accepted||accepted===(repeat?1:0)||accepted===rows.length)return null;
        if(repeat)right.appendChild(cleanRepeatedIds(header.cloneNode(true)));right.append(...rows.slice(accepted).map(r=>r.cloneNode(true)));return [a,b];
      }
      while(queue.length){
        const block=queue.shift();body.appendChild(block);if(fits())continue;block.remove();
        const pieces=block.nodeType===1&&block.tagName==='P'?splitParagraph(block):block.nodeType===1&&block.tagName==='TABLE'?splitTable(block):null;
        if(pieces){body.appendChild(pieces[0]);next();queue.unshift(pieces[1]);continue;}
        if(body.childNodes.length){next();queue.unshift(block);continue;}
        body.appendChild(block);block.querySelectorAll?.('img').forEach(img=>{if(img.getBoundingClientRect().height>budget){img.style.maxHeight=budget+'px';img.style.width='auto';}});
        if(!fits())page.classList.add('office-page-overflow');
      }
      for(const note of endnotes)page.insertBefore(note,page.querySelector(':scope > footer'));
    }
  }
  window.WTPagination={paginate};
})();
