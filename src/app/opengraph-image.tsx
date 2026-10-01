import { ImageResponse } from "next/og";

export const alt = "Blockchainist, a blockchain research group at UIT – VNU-HCM";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share card for Facebook, Zalo, LinkedIn and chat apps, in the site's paper-and-ink style. */
export default function OpengraphImage() {
  const ink = "#16140f";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#f6f3ec", color: ink }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 88, height: 88, display: "flex", background: "#ffc730", border: `6px solid ${ink}`, borderRadius: 18, boxShadow: `8px 8px 0 ${ink}` }}>
            <div style={{ margin: "auto", width: 36, height: 36, background: "#3d8bff", border: `5px solid ${ink}`, borderRadius: 6 }} />
          </div>
          <div style={{ fontSize: 44, fontWeight: 800 }}>Blockchainist</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>Blockchain research group</div>
          <div style={{ fontSize: 34, color: "#3a362e" }}>Cross-chain interoperability · zero-knowledge proofs · smart contract security</div>
        </div>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>
          <div style={{ display: "flex", padding: "10px 22px", background: "#ffc730", border: `4px solid ${ink}`, borderRadius: 14 }}>UIT – VNU-HCM</div>
        </div>
      </div>
    ),
    size,
  );
}
