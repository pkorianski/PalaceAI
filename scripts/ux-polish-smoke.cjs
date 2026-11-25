// Browser regression checks, not a replacement for iOS VoiceOver/Dynamic Type testing.
const { chromium } = require('playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve('dist-preview'), out = path.resolve('screenshots/tour-preview');
const server = http.createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(r => server.listen(18082, '127.0.0.1', r));
  let browser;
  try {
    browser = await chromium.launch({headless:true, executablePath: process.env.PALACE_CHROMIUM_PATH || undefined});
    const errors = [];
    async function checkHand(page) {
      const strip = page.getByTestId('hand-strip');
      const before = await strip.boundingBox(), actions = await page.getByTestId('game-actions').boundingBox();
      assert.ok(before.height >= 106, 'Hand strip reserves full card height and selection lift');
      assert.ok(before.y >= 0 && before.y + before.height <= actions.y + 1, 'Entire hand stays above action buttons');
      const boxes = await strip.getByRole('button').evaluateAll(nodes => nodes.map(n => {const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));
      assert.ok(boxes.length > 0, 'Fixture has selectable hand cards');
      assert.ok(boxes.every(r => r.top >= before.y - 1 && r.bottom <= before.y + before.height + 1), 'No hand card is vertically clipped, including selected cards');
      await page.getByTestId('board-scroll').evaluate(el => {el.scrollTop=el.scrollHeight;});
      const after = await strip.boundingBox();
      assert.ok(Math.abs(after.y - before.y) < 1, 'Scrolling table cannot move the hand under the controls');
    }
    for (const viewport of [{width:375,height:667},{width:390,height:844},{width:320,height:568},{width:393,height:852},{width:440,height:956}]) {
      const c = await browser.newContext({viewport, deviceScaleFactor:2, isMobile:true, hasTouch:true, reducedMotion:'reduce'}), p = await c.newPage();
      p.on('pageerror', e => errors.push(e.message));
      if (viewport.width >= 393) {
        // Browser env() is zero. Model native iPhone safe areas in the provider's probe only.
        await c.addInitScript(() => {
          const original = window.getComputedStyle;
          window.getComputedStyle = function(element, ...args) {
            const value = original.call(this, element, ...args);
            if (element.style?.position === 'fixed' && element.style?.visibility === 'hidden' && element.style?.transitionProperty === 'padding') {
              return new Proxy(value, {get(target,key) {if(key==='paddingTop')return '62px';if(key==='paddingBottom')return '34px';return Reflect.get(target,key);}});
            }
            return value;
          };
        });
      }
      await p.goto('http://127.0.0.1:18082');
      await p.getByTestId('studio-intro').waitFor({state:'hidden',timeout:5000});
      const quick = p.getByRole('button',{name:'Quick Play',exact:true}); await quick.waitFor();
      const q = await quick.boundingBox(); assert.ok(q.y >= 0 && q.y + q.height <= viewport.height, 'Quick Play visible without scrolling');
      const tour = p.getByRole('button',{name:'Continue Palace Tour',exact:true});
      const t = await tour.boundingBox(); assert.ok(t.y + t.height <= viewport.height, 'Tour action visible on compact Home');
      const progress = p.getByRole('button',{name:'Achievements and mastery',exact:true});
      await progress.getByText('Your progress',{exact:true}).waitFor();
      const daily = p.getByTestId('home-daily'); await daily.waitFor();
      const help = p.getByRole('button',{name:'How to Play',exact:true});
      const d = await daily.boundingBox(), h = await help.boundingBox();
      assert.ok(d.y < h.y, 'Daily challenge appears before utility navigation');
      await p.screenshot({path:path.join(out,`18-polish-home-${viewport.width}.png`)});
      // Utilities may sit below the fold; scrolling must reveal an operable control.
      await help.scrollIntoViewIfNeeded();
      const helpBox = await help.boundingBox();
      assert.ok(helpBox.y >= 0 && helpBox.y + helpBox.height <= viewport.height && helpBox.height >= 44, 'Help stays reachable by scrolling');
      const stats = p.getByRole('button',{name:'Statistics',exact:true});
      await stats.scrollIntoViewIfNeeded();
      await stats.click();
      await p.getByRole('heading',{name:'Statistics',exact:true}).waitFor();
      await p.getByRole('button',{name:'Back',exact:true}).click(); await quick.waitFor();
      await quick.click(); await p.getByRole('button',{name:'Confirm Palace (0/3)',exact:true}).waitFor();
      const confirm = await p.getByRole('button',{name:'Confirm Palace (0/3)',exact:true}).boundingBox(); assert.ok(confirm.y + confirm.height <= viewport.height && confirm.height >= 44, 'Setup action stays reachable');
      await p.screenshot({path:path.join(out,`19-polish-guide-${viewport.width}.png`)});
      const skip = p.getByRole('button',{name:'Skip guide'}); await skip.scrollIntoViewIfNeeded(); await skip.click();
      const cards = p.getByRole('button',{name:/ of (hearts|clubs|diamonds|spades)$/});
      await cards.nth(0).click(); await cards.nth(1).click(); await cards.nth(2).click();
      await checkHand(p);
      await p.getByRole('button',{name:'Confirm Palace (3/3)',exact:true}).click();
      await p.getByRole('button',{name:'Pick Up',exact:true}).waitFor();
      const a = await p.getByRole('button',{name:'Pick Up',exact:true}).boundingBox(); assert.ok(a.height >= 44 && a.y + a.height <= viewport.height, 'In-game action stays on screen');
      await checkHand(p);
      if (viewport.width >= 393) {
        const safe = await p.getByTestId('game-table').evaluate(el => ({top:getComputedStyle(el).paddingTop,bottom:getComputedStyle(el).paddingBottom}));
        assert.deepEqual(safe,{top:'62px',bottom:'34px'},'Native-size safe areas are exercised');
      }
      await p.screenshot({path:path.join(out,`20-polish-playing-${viewport.width}.png`)});
      // Open help during the game, return without replacing the game route.
      await p.getByRole('button',{name:'Game menu',exact:true}).click();
      assert.equal(await p.getByTestId('game-menu-sheet').evaluate(el => getComputedStyle(el).backgroundColor),'rgb(11, 32, 28)','Game menu uses shared menu green');
      if(viewport.width===393)await p.screenshot({path:path.join(out,'30-game-menu-iphone16.png')});
      const matchUrl = p.url();
      await p.getByRole('button',{name:'How to Play',exact:true}).click();
      await p.getByRole('heading',{name:'Setup',exact:true}).waitFor();
      assert.equal(await p.getByRole('heading',{name:'Winning',exact:true}).count(),1,'In-game rules include the complete shared reference');
      if(viewport.width===393)await p.screenshot({path:path.join(out,'31-game-rules-iphone16.png')});
      await p.getByRole('button',{name:'Close rules',exact:true}).click();
      assert.equal(p.url(),matchUrl,'Rules do not replace the match route');
      await checkHand(p);
      await p.getByRole('button',{name:'Game menu',exact:true}).waitFor();
      await c.close();
    }
    // Start a real saved series, then use labeled QA fixtures for rare endgame states.
    const c = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,reducedMotion:'reduce'}), p = await c.newPage();
    p.on('pageerror', e => errors.push(e.message));
    await p.goto('http://127.0.0.1:18082'); await p.getByTestId('studio-intro').waitFor({state:'hidden',timeout:5000});
    await p.getByRole('button',{name:'Continue Palace Tour'}).click();
    await p.getByRole('button',{name:/^Joey, Two Times\./}).click();
    await p.getByRole('button',{name:'Take your seat',exact:true}).click();
    await p.getByRole('button',{name:'Confirm Palace (0/3)',exact:true}).waitFor();
    await p.waitForFunction(() => JSON.parse(localStorage.getItem('palace_tour_v1'))?.active?.game);
    const baseline = await p.evaluate(() => localStorage.getItem('palace_tour_v1'));
    await p.evaluate(() => {const c=JSON.parse(localStorage.getItem('palace_tour_v1')),s=c.active.game;s.phase='playing';s.currentPlayerIndex=0;s.players[0].hand=[];s.players[0].faceUpPalace=[];s.deck=[];localStorage.setItem('palace_tour_v1',JSON.stringify(c));localStorage.setItem('palace_tutorial_done','true');});
    await p.reload(); await p.getByTestId('studio-intro').waitFor({state:'hidden',timeout:5000});
    await p.getByRole('button',{name:'Face-down card 1',exact:true}).waitFor();
    await p.getByText('Tap a face-down card to flip it',{exact:true}).waitFor();
    assert.equal(await p.getByRole('button',{name:/^Face-down card [123]$/}).count(),3,'All blind cards expose only positions');
    assert.equal(await p.getByRole('button',{name:/ of (hearts|clubs|diamonds|spades)$/}).count(),0,'No human blind ranks exposed to assistive tech');
    await p.screenshot({path:path.join(out,'21-polish-blind-fixture.png')});
    // A large pickup hand must remain horizontally browsable and selectable.
    await p.evaluate(raw => { const c=JSON.parse(raw),s=c.active.game;s.phase='playing';s.currentPlayerIndex=0;s.players[0].hand.push(...s.deck);s.deck=[];s.pile=[];localStorage.setItem('palace_tour_v1',JSON.stringify(c)); },baseline);
    await p.reload(); await p.getByRole('button',{name:'Pick Up',exact:true}).waitFor();
    const longHand = p.getByRole('button',{name:/ of (hearts|clubs|diamonds|spades)$/});
    assert.ok(await longHand.count() > 20,'Fixture represents a large pickup hand');
    await longHand.last().click();
    assert.equal(await p.getByRole('button',{name:'Play',exact:true}).isEnabled(),true,'Last offscreen card can be selected');
    await p.screenshot({path:path.join(out,'23-polish-long-hand-fixture.png')});
    // Save a known round end, return to the previous Tour, then Back reaches Home once.
    await p.evaluate(raw => {const c=JSON.parse(raw);c.active.game.phase='game_over';c.active.game.winner='human';localStorage.setItem('palace_tour_v1',JSON.stringify(c));},baseline);
    await p.goto('http://127.0.0.1:18082');
    await p.getByTestId('studio-intro').waitFor({state:'hidden',timeout:5000});
    await p.screenshot({path:path.join(out,'24-rewards-home.png')});
    await p.getByRole('button',{name:'Continue Palace Tour'}).click();
    await p.screenshot({path:path.join(out,'25-rewards-tour.png')});
    await p.evaluate(() => {
      window.__setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) { if(key === 'palace_mastery_v1') throw Error('QA result disk failure'); return window.__setItem.call(this,key,value); };
    });
    await p.getByRole('button',{name:'Resume • Joey',exact:true}).click();
    await p.getByRole('button',{name:'Retry saving result',exact:true}).waitFor();
    assert.equal(await p.getByRole('button',{name:'Next round',exact:true}).isDisabled(),true,'Cannot leave pending result before save');
    await p.evaluate(() => { Storage.prototype.setItem = window.__setItem; });
    await p.getByRole('button',{name:'Retry saving result',exact:true}).click();
    await p.getByRole('button',{name:'Back to the tour',exact:true}).waitFor();
    await p.getByRole('button',{name:'Back to the tour',exact:true}).waitFor({state:'visible'});
    await p.waitForFunction(() => document.querySelector('[aria-label="Back to the tour"]')?.getAttribute('aria-disabled') !== 'true');
    await p.screenshot({path:path.join(out,'22-polish-result-fixture.png')});
    await p.getByRole('button',{name:'Back to the tour',exact:true}).click();
    await p.getByRole('button',{name:'Back',exact:true}).click();
    await p.getByRole('button',{name:'Quick Play',exact:true}).waitFor();
    assert.equal(new URL(p.url()).pathname,'/','Single Back from Tour reaches Home');
    const saved = await p.evaluate(() => ({career:JSON.parse(localStorage.getItem('palace_tour_v1')),mastery:JSON.parse(localStorage.getItem('palace_mastery_v1'))}));
    assert.equal(saved.career.receipts.length,1,'Retry awards one Tour receipt');
    assert.equal(saved.mastery.stats.gamesPlayed,1,'Retry records one game');
    // Separate, labeled fixture for a first champion trophy and table unlock.
    await p.evaluate(raw => {
      const career=JSON.parse(raw); career.active.rivalId='quarter-rosa'; career.trophies={'quarter-joey':1,'quarter-mina':1,'quarter-frankie':1};
      career.active.id='qa-champion'; career.active.roundId='qa-champion-round';
      career.active.game.phase='game_over';career.active.game.winner='human';
      localStorage.setItem('palace_tour_v1',JSON.stringify(career));
    },baseline);
    await p.reload(); await p.getByTestId('studio-intro').waitFor({state:'hidden',timeout:5000});
    await p.getByRole('button',{name:'Continue Palace Tour'}).click();
    const resume = p.getByRole('button',{name:/^Resume •/}); await resume.click();
    await p.getByText('NEW TABLE STYLE UNLOCKED',{exact:true}).waitFor();
    await p.screenshot({path:path.join(out,'26-rewards-champion-fixture.png')});
    await c.close(); assert.deepEqual(errors,[],'No uncaught UI exceptions');
    console.log('UX polish smoke passed: compact Home/actions, help round-trip, blind secrecy, Tour return.');
  } finally {await browser?.close();server.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
