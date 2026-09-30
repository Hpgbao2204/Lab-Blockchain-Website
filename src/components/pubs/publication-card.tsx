import type { Publication } from "@/data/publications";
import { publicationUrl } from "@/lib/content";
import { accentVar, kindAccent, kindLabel } from "@/components/site/accent";

const PI = "TD Tran";

export function PublicationCard({ pub, no }: { pub: Publication; no: number }) {
  const href = publicationUrl(pub);
  return (
    <li className="pub" style={{ "--c": accentVar(kindAccent[pub.kind]) } as React.CSSProperties}>
      <div className="pub-meta">
        <span className="pub-no">{String(no).padStart(2, "0")}</span>
        <span className="pub-year">{pub.year}</span>
        <span className="tag">{kindLabel[pub.kind]}</span>
        <a className="pub-link" href={href} target="_blank" rel="noopener noreferrer">
          {pub.doi ? "DOI" : "Scholar"} <span aria-hidden>↗</span>
        </a>
      </div>
      <h3 className="pub-title">
        <a href={href} target="_blank" rel="noopener noreferrer">
          <span className="pub-name">{pub.name}</span>
          {pub.title}
        </a>
      </h3>
      <p className="pub-authors">
        {pub.authors.map((a, i) => (
          <span key={`${a}-${i}`}>
            {i > 0 && ", "}
            {a === PI ? (
              <span className="pi" title="Principal investigator">
                {a}
              </span>
            ) : (
              a
            )}
          </span>
        ))}
      </p>
      {pub.venue && <p className="pub-venue">{pub.venue}</p>}
    </li>
  );
}
