import { describe, expect, it } from "vitest";
import { canEmbed, fetchable, frameAllowed } from "./portfolio-frame";

const site = "https://blockchainist.net";
const h = (o: Record<string, string>) => new Headers(o);

describe("portfolio framing", () => {
  it("allows sites that say nothing, and ones that list us", () => {
    expect(frameAllowed(h({}), site)).toBe(true);
    expect(frameAllowed(h({ "content-security-policy": "default-src 'self'" }), site)).toBe(true);
    expect(frameAllowed(h({ "content-security-policy": "frame-ancestors *" }), site)).toBe(true);
    expect(frameAllowed(h({ "content-security-policy": "frame-ancestors 'self' https://blockchainist.net" }), site)).toBe(true);
    expect(frameAllowed(h({ "content-security-policy": "frame-ancestors https://*.net" }), site)).toBe(true);
    expect(frameAllowed(h({ "content-security-policy": "frame-ancestors https:" }), site)).toBe(true);
  });

  it("refuses sites that forbid framing", () => {
    expect(frameAllowed(h({ "x-frame-options": "DENY" }), site)).toBe(false);
    expect(frameAllowed(h({ "x-frame-options": "SAMEORIGIN" }), site)).toBe(false);
    expect(frameAllowed(h({ "content-security-policy": "frame-ancestors 'none'" }), site)).toBe(false);
    expect(frameAllowed(h({ "content-security-policy": "script-src 'self'; frame-ancestors 'self' https://notion.so" }), site)).toBe(false);
    expect(frameAllowed(h({ "content-security-policy": "frame-ancestors http://blockchainist.net" }), site)).toBe(false);
  });

  it("only checks public web addresses", () => {
    expect(fetchable("https://hpgbao2204.github.io/Hpgbao2204/", site)).toBe(true);
    expect(fetchable("ftp://example.com", site)).toBe(false);
    expect(fetchable("http://example.com", site)).toBe(false);
    expect(fetchable("not a url", site)).toBe(false);
    expect(fetchable("https://localhost/", site)).toBe(false);
    expect(fetchable("https://169.254.169.254/latest", site)).toBe(false);
    expect(fetchable("http://localhost:4001/", "http://localhost:3000")).toBe(true);
  });

  it("embeds when the site answers without refusing; otherwise redirects", async () => {
    const answer = (status: number, headers: Record<string, string> = {}) => (async () => new Response("<html></html>", { status, headers })) as typeof fetch;
    expect(await canEmbed("https://a.github.io/", site, answer(200))).toBe(true);
    expect(await canEmbed("https://b.example/", site, answer(200, { "x-frame-options": "DENY" }))).toBe(false);
    expect(await canEmbed("https://c.example/", site, answer(404))).toBe(false);
    expect(await canEmbed("https://d.example/", site, (async () => Promise.reject(new Error("timeout"))) as typeof fetch)).toBe(false);
    // the answer is cached, so a later refusal is not seen until the cache expires
    expect(await canEmbed("https://a.github.io/", site, answer(200, { "x-frame-options": "DENY" }))).toBe(true);
  });
});
