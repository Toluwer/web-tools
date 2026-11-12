import {Readability} from '@mozilla/readability';
export function extract(html,url,plain=false){
  if(plain)return {title:new URL(url).hostname,text:html};
  const d=new DOMParser().parseFromString(html,'text/html'),base=d.createElement('base');base.href=url;d.head.prepend(base);
  const article=new Readability(d,{charThreshold:100}).parse();
  if(!article?.textContent?.trim())throw Error('This page has no extractable article text. Open its original URL to view it.');
  return {title:article.title||new URL(url).hostname,author:article.byline||'',text:article.textContent.replace(/\n[\t ]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim()};
}
