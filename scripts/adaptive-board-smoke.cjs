// Render the actual app with isolated QA endgame saves, never player progress.
const { chromium } = require('playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve('dist-preview'), out = path.resolve('../board-review');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(r => server.listen(18083, '127.0.0.1', r));
  let browser;
  try {
    browser = await chromium.launch({headless:true, executablePath: process.env.PALACE_CHROMIUM_PATH || undefined});
    const errors=[];
    for (const viewport of [{width:390,height:844},{width:375,height:667},{width:320,height:568}]) {
      const context=await browser.newContext({viewport,deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'}), p=await context.newPage();
      p.on('pageerror', e => errors.push(e.message));
      await p.goto('http://127.0.0.1:18083');
      await p.getByTestId('studio-intro').waitFor({state:'hidden',timeout:5000});
      await p.getByRole('button',{name:'Continue Palace Tour'}).click();
      await p.getByRole('button',{name:/^Joey, Two Times\./}).click();
      await p.getByRole('button',{name:'Take your seat',exact:true}).click();
      await p.getByRole('button',{name:'Confirm Palace (0/3)',exact:true}).waitFor();
      await p.waitForFunction(() => JSON.parse(localStorage.getItem('palace_tour_v1'))?.active?.game);
      const baseline=await p.evaluate(() => localStorage.getItem('palace_tour_v1'));
      const fixture=async phase => {
        await p.evaluate(({baseline,phase}) => {
          const c=JSON.parse(baseline),s=c.active.game;
          const card=(rank,suit='hearts') => ({rank,suit,id:`${rank}-${suit}`});
          s.phase='playing';s.currentPlayerIndex=0;s.deck=[];s.pile=[card('6','clubs')];s.burnPile=[];s.lastBurned=false;s.message='Your turn';
          s.players[0].hand=phase==='hand' ? [card('8','clubs')] : [];
          s.players[0].faceUpPalace=phase==='facedown' ? [] : [card('8'),card('Q','spades'),card('10','diamonds')];
          s.players[0].faceDownPalace=[card('4','diamonds'),card('5','clubs'),card('7','spades')];
          s.players[1].hand=[card('9','clubs'),card('J','diamonds'),card('K','clubs')];
          localStorage.setItem('palace_tour_v1',JSON.stringify(c));localStorage.setItem('palace_tutorial_done','true');
        },{baseline,phase});
        await p.reload();await p.getByTestId('active-cards').waitFor();
      };
      const capture=async name => {if(viewport.width===390) await p.screenshot({path:path.join(out, name+'.png')});};
      const active=p.getByTestId('active-cards');
      // Empty the hand through a real play; palace cards move into the active area.
      await fixture('hand');
      assert.equal(await p.getByTestId('reserve-palace').getByLabel('Queen of spades',{exact:true}).count(),1);
      await active.getByRole('button',{name:'8 of clubs',exact:true}).click();
      await p.getByRole('button',{name:'Play',exact:true}).click();
      await active.getByText('FACE-UP PALACE',{exact:true}).waitFor();
      await fixture('faceup');
      assert.equal(await active.getByRole('button',{name:'Queen of spades'}).count(),1);
      assert.equal(await p.getByTestId('reserve-palace').getByLabel('Queen of spades',{exact:true}).count(),0,'Active face-up cards are not duplicated');
      const queen=active.getByRole('button',{name:'Queen of spades'});
      let box=await queen.boundingBox();assert.equal(box.width,84);assert.equal(box.height,118);
      await capture('Palace-Face-Up');
      await queen.click();assert.equal(await p.getByRole('button',{name:'Play',exact:true}).isEnabled(),true);
      await p.getByRole('button',{name:'Pick Up',exact:true}).click();
      await active.getByText('YOUR HAND',{exact:true}).waitFor();
      await p.getByTestId('reserve-palace').getByLabel('Queen of spades',{exact:true}).waitFor();
      assert.equal(await active.getByRole('button',{name:'Queen of spades'}).count(),0,'Pickup restores palace to reserve');
      await capture('Palace-After-Pickup');
      await fixture('facedown');
      assert.equal(await p.getByTestId('reserve-palace').count(),0);
      const blind=active.getByRole('button',{name:'Face-down card 1',exact:true});
      box=await blind.boundingBox();assert.equal(box.width,84);assert.equal(box.height,118);
      assert.equal(await active.getByRole('button',{name:/ of (hearts|clubs|diamonds|spades)$/}).count(),0);
      await capture('Palace-Face-Down');
      // Invalid blind play picks up, while preserving the remaining blind positions.
      await blind.click();await active.getByText('YOUR HAND',{exact:true}).waitFor();
      await p.getByTestId('reserve-palace').getByLabel('Face-down card 2',{exact:true}).waitFor();
      assert.equal(await p.getByTestId('reserve-palace').getByLabel('Face-down card 1',{exact:true}).count(),0);
      assert.ok((await p.getByRole('button',{name:'Game menu'}).boundingBox()).y>=0);
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,'No horizontal page overflow');
      await context.close();
    }
    assert.deepEqual(errors,[]);
    console.log('Adaptive board passed at 390x844, 375x667, 320x568: active card sizes, selection, pickup, blind secrecy and remaining positions.');
  } finally {await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
