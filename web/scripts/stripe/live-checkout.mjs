import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

const targets = [
  // start small; expand once automation is stable
  { url: 'https://example.com', tiers: ['mini'] },
];

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

async function completeCheckout(page) {
  // Stripe hosted checkout uses iframes for card details.
  await page.waitForLoadState('domcontentloaded');

  // Email
  const email = page.getByLabel(/email/i).first();
  if (await email.count()) {
    await email.fill('test+bfsg-webcheck@example.com');
  }

  // Ensure Card payment method is selected (Stripe shows methods list first).
  // On some configurations, card details appear only AFTER clicking the first "Pay" (as a continue step).
  const cardOption = page.getByText(/^Card$/).first();
  if (await cardOption.count()) {
    await cardOption.click({ timeout: 15000 }).catch(() => {});
  }
  const cardRadio = page.getByRole('radio', { name: /card/i }).first();
  if (await cardRadio.count()) {
    await cardRadio.check({ timeout: 15000 }).catch(() => {});
  }

  const payBtn0 = page.getByRole('button', { name: /pay|bezahlen|zahlen/i }).first();
  if (await payBtn0.count()) {
    await payBtn0.click({ timeout: 30000 }).catch(() => {});
  }

  // Stripe Elements are inside one or more iframes. Find the frame that contains cc-number.
  const findInFrames = async (selectors, timeoutMs = 45000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      for (const fr of page.frames()) {
        for (const sel of selectors) {
          try {
            const loc = fr.locator(sel).first();
            if (await loc.count()) return { frame: fr, locator: loc };
          } catch {}
        }
      }
      await page.waitForTimeout(250);
    }
    return null;
  };

  const numberHit = await findInFrames([
    'input[autocomplete="cc-number"]',
    'input[name="cardnumber"]',
    'input[placeholder*="1234"]',
    'input[aria-label*="card number" i]',
    'input[aria-label*="kart" i]',
  ]);
  if (!numberHit) throw new Error('stripe_card_number_input_not_found');

  const fr = numberHit.frame;
  const number = numberHit.locator;
  const exp = fr.locator('input[autocomplete="cc-exp"], input[name="exp-date"], input[placeholder*="MM"], input[aria-label*="expiration" i], input[aria-label*="ablauf" i]').first();
  const cvc = fr.locator('input[autocomplete="cc-csc"], input[name="cvc"], input[placeholder*="CVC"], input[aria-label*="security" i], input[aria-label*="prüf" i]').first();

  await number.click({ timeout: 30000 });
  await number.fill('4242424242424242');
  await exp.fill('1234');
  await cvc.fill('123');

  // Some checkouts also ask for postal code outside the iframe.
  const postalOutside = page.getByLabel(/postal|zip|plz/i).first();
  if (await postalOutside.count()) await postalOutside.fill('10115');

  // Pay button
  const payBtn = page.getByRole('button', { name: /pay|bezahlen|zahlen/i }).first();
  await payBtn.click({ timeout: 30000 });
}

async function runOne({ url, tier }) {
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-default-browser-check',
      '--disable-dev-shm-usage',
    ],
  });
  const context = await browser.newContext({
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  log('open scan page', BASE_URL);
  await page.goto(`${BASE_URL}/scan`, { waitUntil: 'domcontentloaded' });

  // Fill URL
  await page.getByPlaceholder('https://deine-website.de').fill(url);
  await page.getByRole('button', { name: /scan starten/i }).click();

  // Wait for result card
  await page.getByText('Ergebnis für', { exact: false }).waitFor({ timeout: 60000 });

  // Select tier
  const tierLabel = tier === 'mini' ? /€29\s*Mini/i : tier === 'standard' ? /€59\s*Standard/i : /€99\s*Plus/i;
  await page.getByRole('button', { name: tierLabel }).click();

  // Unlock (redirects to stripe checkout)
  await page.getByRole('button', { name: /report freischalten/i }).click();

  // We should now be on Stripe checkout
  await page.waitForURL(/stripe\.com\/pay|checkout\.stripe\.com/i, { timeout: 60000 });
  log('on stripe checkout', tier, url);

  await completeCheckout(page);

  // Back to app success url
  await page.waitForURL(new RegExp(`${BASE_URL.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}/scan\?success=1&scanId=`), {
    timeout: 60000,
  });

  // Confirm unlocked badge
  await page.getByText(/Freigeschaltet/i).waitFor({ timeout: 60000 });

  // Extract scanId from URL
  const u = new URL(page.url());
  const scanId = u.searchParams.get('scanId');
  if (!scanId) throw new Error('missing scanId after payment');

  // Verify API returns findings
  const res = await page.evaluate(async (scanId) => {
    const r = await fetch(`/api/scans/get?scanId=${encodeURIComponent(scanId)}`, { cache: 'no-store' });
    const j = await r.json();
    return { status: r.status, json: j };
  }, scanId);

  if (!res?.json?.isPaid) throw new Error(`scan not marked paid (tier=${tier}): ${JSON.stringify(res)}`);

  // Verify pdf download endpoint responds
  const pdfOk = await page.evaluate(async (targetUrl) => {
    const r = await fetch(`/api/report/pdf?url=${encodeURIComponent(targetUrl)}`);
    const b = await r.arrayBuffer();
    return { status: r.status, bytes: b.byteLength, ct: r.headers.get('content-type') };
  }, url);

  if (pdfOk.status !== 200 || !String(pdfOk.ct || '').includes('pdf') || pdfOk.bytes < 50_000) {
    throw new Error(`pdf check failed: ${JSON.stringify(pdfOk)}`);
  }

  log('OK', { url, tier, scanId, pdf: pdfOk });

  await browser.close();
  return { url, tier, scanId, pdfOk };
}

(async () => {
  const results = [];
  for (const t of targets) {
    for (const tier of t.tiers) {
      try {
        // eslint-disable-next-line no-await-in-loop
        results.push(await runOne({ url: t.url, tier }));
      } catch (e) {
        console.error('FAIL', t.url, tier, e?.message || e);
      }
    }
  }

  console.log('\nSUMMARY');
  for (const r of results) {
    console.log(JSON.stringify(r));
  }
})();
