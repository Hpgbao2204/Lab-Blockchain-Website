/**
 * Feeds the daily desk reads (once a day, see /api/v1/cron/daily-desk). The bot only uses what a
 * feed itself publishes (title, summary or text, link) and always links back; it never downloads
 * the articles. Some publishers (e.g. CoinDesk) forbid scraping and republishing, which is why.
 *
 * `filter`: for broad feeds (all of cryptography, all of security), keep only items whose title or
 * summary mentions one of these words. To stop reading a feed, set `enabled: false`.
 */
export interface Feed {
  key: string;
  name: string;
  url: string;
  /** where readers can find the publisher, shown in the Sources list */
  site: string;
  /** research = papers, research blogs and official project blogs; news = trade press */
  type: "research" | "news";
  filter?: string[];
  enabled?: boolean;
}

const CHAIN_WORDS = ["blockchain", "smart contract", "consensus", "ethereum", "bitcoin", "defi", "rollup", "zk", "zero-knowledge", "crypto", "ledger", "mev", "wallet", "bridge", "solidity", "evm", "stablecoin"];

export const FEEDS: Feed[] = [
  { key: "chainalysis", name: "Chainalysis", url: "https://www.chainalysis.com/blog/feed/", site: "https://www.chainalysis.com/blog/", type: "research" },
  { key: "ethereum", name: "Ethereum Foundation blog", url: "https://blog.ethereum.org/feed.xml", site: "https://blog.ethereum.org", type: "research" },
  { key: "ethresearch", name: "Ethereum Research forum", url: "https://ethresear.ch/latest.rss", site: "https://ethresear.ch", type: "research" },
  { key: "iacr", name: "IACR Cryptology ePrint Archive", url: "https://eprint.iacr.org/rss/rss.xml", site: "https://eprint.iacr.org", type: "research", filter: CHAIN_WORDS },
  { key: "arxiv-cr", name: "arXiv cs.CR", url: "https://rss.arxiv.org/rss/cs.CR", site: "https://arxiv.org/list/cs.CR/recent", type: "research", filter: CHAIN_WORDS },
  { key: "trailofbits", name: "Trail of Bits blog", url: "https://blog.trailofbits.com/feed/", site: "https://blog.trailofbits.com", type: "research", filter: CHAIN_WORDS },
  { key: "rekt", name: "Rekt News", url: "https://rekt.news/rss/feed.xml", site: "https://rekt.news", type: "news" },
  { key: "theblock", name: "The Block", url: "https://www.theblock.co/rss.xml", site: "https://www.theblock.co", type: "news" },
  { key: "coindesk", name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", site: "https://www.coindesk.com", type: "news" },
  { key: "decrypt", name: "Decrypt", url: "https://decrypt.co/feed", site: "https://decrypt.co", type: "news" },
];

export const enabledFeeds = () => FEEDS.filter((f) => f.enabled !== false);
export const feedByKey = (key: string) => FEEDS.find((f) => f.key === key);
