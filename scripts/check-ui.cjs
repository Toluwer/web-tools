/* Run with a local server at WEBTOOL_URL (default port 8765) and Playwright installed. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const base=process.env.WEBTOOL_URL||'http://127.0.0.1:8765';
const output=path.resolve(process.env.UI_OUTPUT||'artifacts/ui');
fs.mkdirSync(output,{recursive:true});
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:960}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/WebTool.html');
  await page.locator('.tool-card').first().waitFor();
  assert.equal(await page.locator('.tool-card').count(),9);
  await page.screenshot({path:path.join(output,'home-desktop.png')});
  await page.locator('#homeSearch').fill('movie');
  assert.equal(await page.locator('.tool-card:visible').count(),1);
  await page.locator('#homeSearch').fill('no-such-tool');
  assert.equal(await page.locator('#homeNoResults').isVisible(),true);
  await page.locator('#homeSearch').fill('');
  await page.keyboard.press('Control+k');
  await page.locator('#finderInput').fill('tester');
  await page.keyboard.press('Enter');
  await page.locator('#testView').waitFor({state:'visible'});
  assert.equal(await page.locator('#workspaceName').textContent(),'Link tester');
  await page.locator('#testBtn').click();
  assert.match(await page.locator('#testErr').textContent(),/doesn't look like/);
  await page.screenshot({path:path.join(output,'tester-desktop.png')});
  for(const [id,name] of [['choiceChecker','checker'],['choiceMovies','movies'],['choiceBrook','school'],['choiceBeam','chat'],['choiceAI','ai'],['choiceDocuments','documents'],['choiceResearch','research']]){
    await page.locator('#'+id).click();
    await page.waitForTimeout(1800);
    assert.equal(await page.locator('#'+id).getAttribute('aria-current'),'page');
    await page.screenshot({path:path.join(output,name+'-desktop.png')});
  }
  await page.locator('#choiceHome').click();
  await page.locator('#assistantPrompt').fill('Help me write an outline');
  await page.locator('#assistantForm button').click();
  assert.equal(await page.locator('.wt-in').inputValue(),'Help me write an outline');
  await page.screenshot({path:path.join(output,'assistant-desktop.png')});
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await page.screenshot({path:path.join(output,'ai-settings-desktop.png')});
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  for(const width of [390,768]){
    await page.setViewportSize({width,height:844});
    for(const [id,name] of [['choiceHome','home'],['choiceTest','tester'],['choiceChecker','checker'],['choiceMovies','movies'],['choiceBrook','school'],['choiceBeam','chat']]){
      await page.locator('#'+id).click();
      await page.screenshot({path:path.join(output,name+'-'+width+'.png')});
      const overflow=await page.evaluate(()=>{const m=document.querySelector('#workspace');return {body:document.documentElement.scrollWidth>innerWidth,workspace:m.scrollWidth>m.clientWidth+2};});
      assert.deepEqual(overflow,{body:false,workspace:false},name+' overflow at '+width);
    }
  }
  assert.deepEqual(errors,[], 'Unhandled browser errors');
  console.log(JSON.stringify({passed:true,screenshots:fs.readdirSync(output).filter(f=>f.endsWith('.png')).length,errors},null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
