const { chromium } = require("playwright");

(async () => {
  const base = "http://localhost:3000";
  const routes = ["/dashboard", "/learn", "/train-ai", "/marketplace", "/billing"];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();

  const result = { login: { ok: false, url: "", error: null }, routes: {} };

  try {
    await page.goto(`${base}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1200);

    const email = page.locator('input[type="email"], input[name="email"]').first();
    const pass = page.locator('input[type="password"], input[name="password"]').first();

    if (await email.count()) await email.fill("demo@artecho.com");
    if (await pass.count()) await pass.fill("demo123");

    const submit = page
      .locator(
        'button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")'
      )
      .first();

    if (await submit.count()) {
      await Promise.allSettled([
        page.waitForLoadState("domcontentloaded", { timeout: 15000 }),
        submit.click(),
      ]);
    }

    await page.waitForTimeout(2000);
    result.login.url = page.url();
    result.login.ok = !page.url().includes("/login");
  } catch (e) {
    result.login.error = String(e);
  }

  for (const route of routes) {
    const r = {
      url: "",
      overflowPx: 0,
      hasHorizontalOverflow: false,
      clippedCriticalButtons: [],
      topNavControls: 0,
      menuButtonDetected: false,
      menuOpenChanged: false,
      error: null,
    };

    try {
      await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(1800);
      r.url = page.url();

      const metrics = await page.evaluate(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const root = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(root ? root.scrollWidth : 0, body ? body.scrollWidth : 0);
        const overflowPx = Math.max(0, scrollWidth - vw);

        const criticalWords = [
          "save",
          "continue",
          "checkout",
          "upgrade",
          "train",
          "publish",
          "buy",
          "subscribe",
          "pay",
          "next",
          "start",
          "create",
          "billing",
        ];

        const nodes = [
          ...document.querySelectorAll(
            'button, a[role="button"], input[type="submit"], a, .btn, [class*="button"]'
          ),
        ];
        const clipped = [];

        for (const n of nodes) {
          const rect = n.getBoundingClientRect();
          const style = window.getComputedStyle(n);
          if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0")
            continue;
          if (rect.width < 28 || rect.height < 20) continue;
          if (rect.bottom < 0 || rect.top > vh * 3) continue;

          const text = (
            n.innerText ||
            n.getAttribute("aria-label") ||
            n.getAttribute("title") ||
            ""
          )
            .trim()
            .toLowerCase();
          const critical = criticalWords.some((w) => text.includes(w));
          if (!critical) continue;

          if (rect.left < 0 || rect.right > vw) {
            clipped.push({
              text: text.slice(0, 80),
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              top: Math.round(rect.top),
            });
          }
        }

        const topNavControls = [
          ...document.querySelectorAll(
            'header a, header button, nav a, nav button, [role="navigation"] a, [role="navigation"] button'
          ),
        ].filter((el) => {
          const rect = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return (
            s.display !== "none" &&
            s.visibility !== "hidden" &&
            s.opacity !== "0" &&
            rect.bottom > 0 &&
            rect.top < 130 &&
            rect.width > 8 &&
            rect.height > 8
          );
        }).length;

        return { overflowPx, clipped, topNavControls };
      });

      r.overflowPx = metrics.overflowPx;
      r.hasHorizontalOverflow = metrics.overflowPx > 0;
      r.clippedCriticalButtons = metrics.clipped;
      r.topNavControls = metrics.topNavControls;

      const menu = page
        .locator('button[aria-label*="menu" i], button:has-text("Menu"), [aria-controls*="menu" i]')
        .first();
      if (await menu.count()) {
        r.menuButtonDetected = true;
        const beforeCount = await page
          .locator('nav a, [role="navigation"] a, [data-state="open"] a')
          .count();
        await menu.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(500);
        const afterCount = await page
          .locator('nav a, [role="navigation"] a, [data-state="open"] a')
          .count();
        r.menuOpenChanged = afterCount !== beforeCount;
      }

      const suffix = route.replace(/\//g, "_") || "root";
      await page.screenshot({ path: `qa-${suffix}-top.png`, fullPage: false });
      await page.screenshot({ path: `qa-${suffix}-full.png`, fullPage: true });
    } catch (e) {
      r.error = String(e);
    }

    result.routes[route] = r;
  }

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
