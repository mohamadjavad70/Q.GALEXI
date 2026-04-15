import { chromium } from "playwright";
import fs from "fs";

const base = "http://localhost:5174/galaxial-whispers";
const routes = ["/","/q","/command","/command-center","/sun-core","/empire","/star/testslug","/nope"];

fs.mkdirSync("predeploy-shots", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

for (const r of routes) {
  const url = base + r;
  console.log("SNAP", url);
  await page.goto(url, { waitUntil: "networkidle" });
  const safe = r.replace(/\//g, "_").replace(/[^a-zA-Z0-9_:-]/g, "");
  await page.screenshot({ path: `predeploy-shots/${safe || "_root"}.png`, fullPage: true });
}

await browser.close();
console.log("DONE -> predeploy-shots/");
