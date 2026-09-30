// Downloads freely-licensed portraits of blockchain / cryptography pioneers from
// Wikimedia Commons into public/pioneers and writes src/data/pioneers.generated.json
// with license + attribution so the site can credit every image.
// Only CC-BY, CC-BY-SA, CC0 and public-domain files are kept.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp"; // ships with Next.js

const UA = "BlockchainistLabWeb/0.1 (https://blockchainist.id.vn; admin.blockchainist.uit@gmail.com)";
const OUT_DIR = path.resolve("public/pioneers");
const OUT_JSON = path.resolve("src/data/pioneers.generated.json");

const PEOPLE = [
  { id: "chaum", wiki: "David_Chaum" },
  { id: "merkle", wiki: "Ralph_Merkle" },
  { id: "diffie", wiki: "Whitfield_Diffie" },
  { id: "hellman", wiki: "Martin_Hellman" },
  { id: "stornetta", wiki: "Scott_Stornetta" },
  { id: "haber", wiki: "Stuart_Haber" },
  { id: "szabo", wiki: "Nick_Szabo" },
  { id: "finney", wiki: "Hal_Finney_(computer_scientist)" },
  { id: "back", wiki: "Adam_Back" },
  { id: "lamport", wiki: "Leslie_Lamport" },
  { id: "goldwasser", wiki: "Shafi_Goldwasser" },
  { id: "micali", wiki: "Silvio_Micali" },
  { id: "buterin", wiki: "Vitalik_Buterin" },
  { id: "rivest", wiki: "Ron_Rivest" },
  { id: "shamir", wiki: "Adi_Shamir" },
  { id: "wood", wiki: "Gavin_Wood" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, asBuffer = false) {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429 || res.status >= 500) { await sleep(1500 * (i + 1)); continue; }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return asBuffer ? Buffer.from(await res.arrayBuffer()) : res.json();
  }
  throw new Error(`gave up ${url}`);
}
const strip = (s = "") => s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const OK_LICENSE = /^(cc[- ]by|cc[- ]by[- ]sa|cc0|public domain|pd)/i;

await mkdir(OUT_DIR, { recursive: true });
const results = [];
for (const p of PEOPLE) {
  try {
    const page = await get(`https://en.wikipedia.org/w/api.php?action=query&titles=${p.wiki}&prop=pageimages|extracts&piprop=name&exintro=1&explaintext=1&exsentences=1&format=json&redirects=1`);
    const pg = Object.values(page.query.pages)[0];
    const file = pg.pageimage;
    if (!file) { console.log(`- ${p.id}: no lead image`); continue; }
    const info = await get(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(file)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=720&format=json`);
    const ii = Object.values(info.query.pages)[0].imageinfo?.[0];
    if (!ii) { console.log(`- ${p.id}: no imageinfo`); continue; }
    const m = ii.extmetadata ?? {};
    const license = strip(m.LicenseShortName?.value);
    if (!OK_LICENSE.test(license)) { console.log(`- ${p.id}: skipped, license "${license}"`); continue; }
    const buf = await get(ii.thumburl, true);
    const img = await sharp(buf).resize({ width: 560, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
    await writeFile(path.join(OUT_DIR, `${p.id}.jpg`), img);
    results.push({
      id: p.id,
      name: pg.title,
      image: `/pioneers/${p.id}.jpg`,
      license,
      licenseUrl: strip(m.LicenseUrl?.value) || null,
      author: strip(m.Artist?.value) || "Unknown",
      source: ii.descriptionurl,
    });
    console.log(`+ ${p.id}: ${license} — ${strip(m.Artist?.value).slice(0, 60)}`);
  } catch (e) {
    console.log(`! ${p.id}: ${e.message}`);
  }
  await sleep(400);
}
await mkdir(path.dirname(OUT_JSON), { recursive: true });
await writeFile(OUT_JSON, JSON.stringify(results, null, 2) + "\n");
console.log(`\n${results.length}/${PEOPLE.length} portraits saved`);
