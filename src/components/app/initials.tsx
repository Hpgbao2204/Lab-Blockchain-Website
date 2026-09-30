const COLORS = ["var(--color-yellow)", "var(--color-blue)", "var(--color-teal)", "var(--color-pink)", "var(--color-violet)", "var(--color-orange)", "var(--color-lime)"];

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export function Initials({ name, title }: { name: string; title?: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span className="avatar" title={title ?? name} style={{ "--c": COLORS[hash(name) % COLORS.length] } as React.CSSProperties}>
      {letters}
    </span>
  );
}
