// page-eval.mjs: load a page the way render.mjs does and print the JSON of one expression.
//   node bin/page-eval.mjs --page=spark.html [--query=real=1] "window.audit()"
// Use it for checks that print numbers. Pipe the output through bin/lyricguard when the
// page holds lyrics, and never evaluate an expression that returns word text.
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const i = a.indexOf('='); return i < 0 ? [a.slice(2), true] : [a.slice(2, i), a.slice(i + 1)]; }));
const expr = process.argv.slice(2).filter(a => !a.startsWith('--')).join(' ');
const CHROME = [args.chrome, process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => p && existsSync(p));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
page.on('pageerror', e => console.log('[page error]', e.message));
await page.goto(pathToFileURL(resolve(args.page || 'spark.html')).href + '?render' + (args.query ? '&' + args.query : ''), { waitUntil: 'networkidle0' });
await page.waitForFunction('window.ready === true', { timeout: 60000 });
console.log(JSON.stringify(await page.evaluate(expr), null, 1));
await browser.close();
