/**
 * Render App Store screenshots from local HTML mockups.
 *
 * Sizes (portrait):
 *   - 1290×2796  iPhone 6.7"  (14/15/16 Pro Max class — widely accepted)
 *   - 1320×2868  iPhone 6.9"  (16 Pro Max / 17 Pro Max class — required set)
 *
 * Usage: node store/ios/screenshots/render.mjs
 */
import { chromium } from 'playwright';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.join(__dirname, 'out');

const SIZES = [
  { name: '6.7', width: 1290, height: 2796 },
  { name: '6.9', width: 1320, height: 2868 },
];

const PAGES = [
  '01-welcome.html',
  '02-dial.html',
  '03-playing.html',
  '04-session.html',
  '05-offline.html',
];

async function main() {
  const browser = await chromium.launch();
  for (const size of SIZES) {
    const dir = path.join(outRoot, size.name);
    await mkdir(dir, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const file of PAGES) {
      const filePath = path.join(__dirname, file);
      const url = pathToFileURL(filePath).href;
      await page.goto(url, { waitUntil: 'networkidle' });
      // Scale mock (authored at 1290×2796) to the target viewport
      await page.evaluate(
        ({ w, h }) => {
          const phone = document.querySelector('.phone');
          if (!phone) return;
          const baseW = 1290;
          const baseH = 2796;
          const sx = w / baseW;
          const sy = h / baseH;
          document.documentElement.style.width = w + 'px';
          document.documentElement.style.height = h + 'px';
          document.body.style.width = w + 'px';
          document.body.style.height = h + 'px';
          phone.style.transformOrigin = 'top left';
          phone.style.transform = `scale(${sx}, ${sy})`;
        },
        { w: size.width, h: size.height },
      );
      // Wait for Google Fonts
      await page.waitForTimeout(600);
      const stem = file.replace(/\.html$/, '');
      const out = path.join(dir, `${stem}.png`);
      await page.screenshot({ path: out, type: 'png', fullPage: false });
      console.log('wrote', path.relative(process.cwd(), out));
    }
    await context.close();
  }
  await browser.close();

  const listed = await readdir(outRoot, { recursive: true });
  console.log('\nDone. Files:', listed.filter((f) => f.endsWith('.png')).length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
