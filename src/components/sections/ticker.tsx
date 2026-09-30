const words = ["HTLC", "zk-SNARK", "Merkle proof", "Light client", "BFT", "VRF", "Soulbound", "DID", "Cross-chain relay", "Formal verification", "MEV", "Commitment"];

export function Ticker() {
  const row = [...words, ...words];
  return (
    <div className="overflow-hidden border-y border-line bg-white/55 py-4" aria-hidden>
      <div className="marquee-track flex w-max gap-10 [animation:marquee_38s_linear_infinite]">
        {row.map((w, i) => (
          <span key={i} className="mono flex items-center gap-10 uppercase tracking-[0.18em] text-muted">
            {w}
            <span className="h-1.5 w-1.5 rotate-45 bg-chain-a/70" />
          </span>
        ))}
      </div>
    </div>
  );
}
