import { CalendarClock, ExternalLink, MapPin, Mic } from "lucide-react";
import { formatStamp } from "@/lib/weeks";

export interface MeetingCardData {
  id: string;
  title: string;
  startsAt: Date | string;
  location: string | null;
  link: string | null;
  notes: string | null;
  presenters: { id: string; name: string; topic: string | null }[];
}

/** A lab meeting: when, where and who presents. Highlights the viewer's own slot. */
export function MeetingCard({ meeting: m, viewerId, children, highlight }: { meeting: MeetingCardData; viewerId?: string; children?: React.ReactNode; highlight?: boolean }) {
  const mine = m.presenters.some((p) => p.id === viewerId);
  return (
    <article className="card grid gap-2.5 p-4" style={{ boxShadow: "var(--shadow)", background: highlight ? "color-mix(in srgb, var(--color-yellow) 28%, var(--color-card))" : undefined }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-bold [font-family:var(--font-display)]">{m.title}</h3>
        {mine && (
          <span className="tag" style={{ "--c": "var(--color-yellow)" } as React.CSSProperties}>
            You present
          </span>
        )}
      </div>
      <p className="mono flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock size={14} aria-hidden /> {formatStamp(m.startsAt)}
        </span>
        {m.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} aria-hidden /> {m.location}
          </span>
        )}
        {m.link && (
          <a href={m.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 underline">
            <ExternalLink size={14} aria-hidden /> Join online
          </a>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Mic size={15} aria-hidden />
        {m.presenters.length ? (
          <ul className="chips">
            {m.presenters.map((p) => (
              <li key={p.id} style={p.id === viewerId ? { background: "var(--color-yellow)" } : undefined}>
                {p.name}
                {p.topic ? ` · ${p.topic}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-muted">Presenter to be announced</span>
        )}
      </div>
      {m.notes && <p className="whitespace-pre-line text-sm text-ink-2">{m.notes}</p>}
      {children}
    </article>
  );
}
