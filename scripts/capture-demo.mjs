#!/usr/bin/env node
/**
 * Records a short product demo for LinkedIn / Twitter.
 * Requires Google Chrome and ffmpeg.
 *
 *   npm run demo
 *   DEMO_URL=http://localhost:3000 npm run demo
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs/demo");
const FRAMES_DIR = path.join(OUT_DIR, "frames");
const BASE_URL = process.env.DEMO_URL ?? "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FPS = 15;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve(undefined) : reject(new Error(`${cmd} exited ${code}`)),
    );
  });
}

async function waitForBookCount(page, count) {
  await page.waitForFunction(
    (expected) => {
      const text = document.body.textContent ?? "";
      const match = text.match(/(\d+)\s+of\s+(\d+)\s+books/);
      return match && Number(match[2]) >= expected;
    },
    { timeout: 120_000 },
    count,
  );
}

async function clickText(page, text) {
  return page.evaluate((label) => {
    const node = [...document.querySelectorAll("button, span, a")].find(
      (el) => el.textContent?.trim() === label,
    );
    if (!node) return false;
    node.click();
    return true;
  }, text);
}

async function encodeVideo() {
  const mp4 = path.join(OUT_DIR, "bookshelf-demo.mp4");
  await run("ffmpeg", [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    path.join(FRAMES_DIR, "frame-%05d.jpg"),
    "-vf",
    "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x120f0c,format=yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "22",
    "-movflags",
    "+faststart",
    mp4,
  ]);

  const gif = path.join(OUT_DIR, "bookshelf-demo.gif");
  await run("ffmpeg", [
    "-y",
    "-i",
    mp4,
    "-vf",
    "fps=10,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
    "-loop",
    "0",
    gif,
  ]);

  const poster = path.join(OUT_DIR, "bookshelf-demo-poster.jpg");
  await run("ffmpeg", [
    "-y",
    "-i",
    mp4,
    "-vf",
    "select=eq(n\\,45)",
    "-vframes",
    "1",
    "-update",
    "1",
    "-q:v",
    "2",
    poster,
  ]);
}

async function encodeTwitterGif(mp4) {
  const gif = path.join(OUT_DIR, "bookshelf-demo-twitter.gif");
  await run("ffmpeg", [
    "-y",
    "-i",
    mp4,
    "-t",
    "15",
    "-vf",
    "fps=12,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
    "-loop",
    "0",
    gif,
  ]);
}

async function main() {
  await rm(FRAMES_DIR, { recursive: true, force: true });
  await mkdir(FRAMES_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 2 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const client = await page.createCDPSession();

  let frameIndex = 0;
  let recording = false;

  client.on("Page.screencastFrame", async ({ data, sessionId }) => {
    if (!recording) {
      await client.send("Page.screencastFrameAck", { sessionId });
      return;
    }
    const file = path.join(
      FRAMES_DIR,
      `frame-${String(frameIndex++).padStart(5, "0")}.jpg`,
    );
    await writeFile(file, Buffer.from(data, "base64"));
    await client.send("Page.screencastFrameAck", { sessionId });
  });

  await client.send("Page.startScreencast", {
    format: "jpeg",
    quality: 82,
    maxWidth: 2560,
    maxHeight: 1440,
    everyNthFrame: 1,
  });

  try {
    console.log(`Loading ${BASE_URL}…`);
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 120_000 });
    await page.waitForSelector(".label-hand", { timeout: 60_000 });
    await waitForBookCount(page, 12);
    await wait(1800);

    console.log("Recording demo…");
    recording = true;

    // Shelf hero — let quotes rotate
    await wait(2200);

    const firstBook = await page.$("[data-book-id]");
    if (firstBook) {
      await firstBook.click();
      await wait(1400);
    }

    const readClicked = await clickText(page, "Read");
    if (!readClicked) throw new Error('Could not find "Read" button.');

    await page.waitForSelector('[aria-label="Find in document"]', {
      timeout: 30_000,
    });
    await page.waitForSelector("canvas", { timeout: 30_000 });
    await wait(1600);

    // Ambient sounds in reader footer
    const ambientPill = await page.$('button[aria-label*="ambient" i], button[title*="Ambient" i]');
    if (ambientPill) {
      await ambientPill.click();
      await wait(900);
      const rain = await page.evaluate(() => {
        const btn = [...document.querySelectorAll("button")].find((el) =>
          el.textContent?.includes("Light rain"),
        );
        if (!btn) return false;
        btn.click();
        return true;
      });
      if (rain) await wait(1200);
    }

    await page.click('[aria-label="Next page"]');
    await wait(1000);
    await page.click('[aria-label="Next page"]');
    await wait(1200);

    // Search highlight
    await page.click('[aria-label="Find in document"]');
    await wait(400);
    await page.type('input[placeholder*="Search" i], .reader-search input', "the", {
      delay: 60,
    });
    await wait(1800);

    recording = false;
    await wait(400);
  } finally {
    await client.send("Page.stopScreencast").catch(() => undefined);
    await browser.close();
  }

  console.log(`Captured ${frameIndex} frames. Encoding…`);
  const mp4 = path.join(OUT_DIR, "bookshelf-demo.mp4");
  await encodeVideo();
  await encodeTwitterGif(mp4);
  console.log(`\nDone:\n  ${mp4}\n  ${path.join(OUT_DIR, "bookshelf-demo.gif")}\n  ${path.join(OUT_DIR, "bookshelf-demo-twitter.gif")}\n  ${path.join(OUT_DIR, "bookshelf-demo-poster.jpg")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
