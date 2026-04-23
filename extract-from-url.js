import { chromium } from "playwright";
import { ChromaClient } from "chromadb";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const HOMEPAGE = "https://cheerio.js.org/";
const MAX_PAGES = 100; // safety cap — increase if needed

// Crawl all internal links starting from homepage using BFS
async function crawlAllUrls(homepage) {
  const origin = new URL(homepage).origin;
  const visited = new Set();
  const queue = [homepage];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const url = queue.shift();

    // Normalise: strip hash fragments and trailing slashes for deduplication
    const normalised = url.split("#")[0].replace(/\/$/, "");
    if (visited.has(normalised)) continue;
    visited.add(normalised);

    console.log(`[crawl] Discovering links on: ${normalised}`);

    try {
      const page = await context.newPage();
      await page.goto(normalised, { waitUntil: "networkidle", timeout: 60000 });

      const hrefs = await page.locator("a[href]").evaluateAll((els) =>
        els.map((el) => el.href).filter(Boolean),
      );

      await page.close();

      for (const href of hrefs) {
        const clean = href.split("#")[0].replace(/\/$/, "");
        // Only follow links that belong to the same origin
        if (clean.startsWith(origin) && !visited.has(clean)) {
          queue.push(clean);
        }
      }
    } catch (err) {
      console.warn(`  [skip] Failed to crawl ${normalised}: ${err.message}`);
    }
  }

  await browser.close();
  return [...visited];
}

// Scrape meaningful text content from a single page
async function scrapePage(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  const title = await page.title();

  const blocks = await page.locator("h1, h2, h3, p, li").allTextContents();
  const cleanedBlocks = blocks
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t.length > 30);

  await browser.close();

  return { url, title, text: cleanedBlocks.join("\n\n") };
}

// Split text into overlapping chunks
async function chunkText(text) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
  });
  return splitter.splitText(text);
}

async function main() {
  console.log(`Starting crawl from: ${HOMEPAGE}\n`);
  const urls = await crawlAllUrls(HOMEPAGE);
  console.log(`\nFound ${urls.length} pages to scrape.\n`);

  const client = new ChromaClient({ path: "http://localhost:8000" });

  // Derive a stable, valid collection name from the hostname (e.g. "cheerio-js-org")
  const collectionName = new URL(HOMEPAGE).hostname.replace(/[^a-z0-9]/gi, "-");
  console.log(`Using collection: "${collectionName}"\n`);

  const collection = await client.getOrCreateCollection({ name: collectionName });

  let totalChunksStored = 0;

  for (const url of urls) {
    console.log(`Scraping: ${url}`);
    try {
      const scraped = await scrapePage(url);

      if (!scraped.text.trim()) {
        console.log("  [skip] No useful text found.");
        continue;
      }

      const chunks = await chunkText(scraped.text);
      const slugId = url.replace(/https?:\/\//, "").replace(/[^a-z0-9]/gi, "-");

      await collection.upsert({
        ids: chunks.map((_, i) => `${slugId}-${i}`),
        documents: chunks,
        metadatas: chunks.map((_, i) => ({
          source: "cheerio",
          url: scraped.url,
          title: scraped.title,
          chunkIndex: i,
          totalChunks: chunks.length,
        })),
      });

      console.log(`  Stored ${chunks.length} chunks from "${scraped.title}"`);
      totalChunksStored += chunks.length;
    } catch (err) {
      console.warn(`  [skip] Error scraping ${url}: ${err.message}`);
    }
  }

  console.log(`\nDone! Total chunks stored: ${totalChunksStored}`);
}

main().catch(console.error);
