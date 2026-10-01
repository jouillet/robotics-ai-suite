const { chromium } = require("playwright");

const BASE_URL = process.argv[2] || process.env.TEST_URL || "http://localhost:3000";

const VIEWPORTS = [
  { name: "Mobile Small (iPhone SE / Galaxy Fold)", width: 320, height: 568 },
  { name: "Mobile Standard (iPhone 12/13/14/15/16)", width: 390, height: 844 },
  { name: "Mobile Large (Pixel 7 / Galaxy S21)", width: 412, height: 915 },
  { name: "Mobile Pro Max (iPhone Plus / Max)", width: 430, height: 932 },
  { name: "Small Tablet / Landscape Mobile", width: 640, height: 800 },
  { name: "Tablet Portrait (iPad Mini / Air)", width: 768, height: 1024 },
];

const ROUTES = [
  "/",
  "/models/",
  "/models/act-fp16-ov/",
  "/skills/",
];

async function run() {
  console.log(`\n🔍 Running Mobile Viewport Regression Tests against: ${BASE_URL}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Abort external resources that can hang or fail when offline / firewall restricted
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (
      url.includes("fonts.googleapis.com") ||
      url.includes("fonts.gstatic.com") ||
      url.includes("google-analytics") ||
      url.includes("googletagmanager")
    ) {
      route.abort();
    } else {
      route.continue();
    }
  });

  let totalTests = 0;
  let passedTests = 0;
  const failures = [];

  for (const route of ROUTES) {
    const url = `${BASE_URL.replace(/\/$/, "")}${route}`;
    await page.goto(url, { waitUntil: "commit", timeout: 15000 });
    // Brief settle for hydration
    await page.waitForTimeout(600);

    for (const vp of VIEWPORTS) {
      totalTests++;
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(150);

      const metrics = await page.evaluate(() => {
        const cw = document.documentElement.clientWidth;
        const sw = document.documentElement.scrollWidth;
        const diff = sw - cw;

        let culprits = [];
        if (diff > 1) {
          const allElements = document.querySelectorAll("*");
          for (const el of allElements) {
            const rect = el.getBoundingClientRect();
            if (rect.right > cw + 1) {
              const tag = el.tagName.toLowerCase();
              const cls = typeof el.className === "string" ? el.className.split(" ")[0] : "";
              culprits.push(`${tag}${cls ? "." + cls : ""} (right: ${Math.round(rect.right)}px, w: ${Math.round(rect.width)}px)`);
              if (culprits.length >= 3) break;
            }
          }
        }

        return { cw, sw, diff, culprits };
      });

      if (metrics.diff <= 1) {
        passedTests++;
        console.log(`  ✓ [${vp.name} - ${vp.width}x${vp.height}] ${route} (cw: ${metrics.cw}px, sw: ${metrics.sw}px)`);
      } else {
        failures.push({
          route,
          viewport: vp,
          metrics,
        });
        console.error(`  ✗ [${vp.name} - ${vp.width}x${vp.height}] ${route} OVERFLOW: scrollWidth ${metrics.sw}px > clientWidth ${metrics.cw}px (+${metrics.diff}px)`);
        if (metrics.culprits.length > 0) {
          console.error(`    Culprit elements: ${metrics.culprits.join(", ")}`);
        }
      }
    }
    console.log("");
  }

  await browser.close();

  console.log("--------------------------------------------------------------------------------");
  console.log(`Total Checks: ${totalTests} | Passed: ${passedTests} | Failed: ${failures.length}`);
  console.log("--------------------------------------------------------------------------------\n");

  if (failures.length > 0) {
    console.error(`❌ Mobile regression test failed: ${failures.length} viewport/route combinations exhibited horizontal overflow.`);
    process.exit(1);
  } else {
    console.log("✅ All mobile viewport checks passed with 0px horizontal overflow!");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
