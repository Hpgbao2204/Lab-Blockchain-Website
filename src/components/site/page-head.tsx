export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="page-head">
      <p className="eyebrow">
        <span className="dot" />
        {eyebrow}
      </p>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </header>
  );
}

export function SectionHead({ id, no, title, children }: { id?: string; no: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="section-head">
      <span className="section-no">{no}</span>
      <h2 id={id}>{title}</h2>
      {children}
    </header>
  );
}
