import type { Metadata } from "next";
import { ApiExplorer } from "@/components/dev/api-explorer";
import { PageHead, SectionHead } from "@/components/site/page-head";
import { endpoints } from "@/lib/api/catalog";

export const metadata: Metadata = { title: "API", description: "The public JSON API behind the Blockchainist website." };

export default function DevelopersPage() {
  return (
    <div className="wrap page">
      <PageHead eyebrow="Developers" title={<>Public <span className="hl">API</span></>}>
        Every page on this site reads from the same versioned JSON API. Public endpoints are open; member and admin endpoints need a session.
      </PageHead>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="endpoints">
          <SectionHead id="endpoints" no={String(endpoints.length).padStart(2, "0")} title="Endpoints" />
          <ul className="grid gap-3">
            {endpoints.map((e) => (
              <li key={`${e.method} ${e.path}`} className="card grid gap-1.5 p-4" style={{ boxShadow: "var(--shadow)" }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tag" style={{ "--c": e.method === "GET" ? "var(--color-lime)" : e.method === "POST" ? "var(--color-orange)" : "var(--color-blue)" } as React.CSSProperties}>
                    {e.method}
                  </span>
                  <code className="mono text-[13px] font-bold">{e.path}</code>
                  {e.auth && e.auth !== "public" && (
                    <span className="tag ml-auto" style={{ "--c": e.auth === "admin" ? "var(--color-pink)" : "var(--color-yellow)" } as React.CSSProperties}>
                      {e.auth}
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-2">{e.summary}</p>
                {e.params && <p className="mono text-xs text-muted">params: {e.params}</p>}
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 lg:sticky lg:top-24" aria-label="Try the API">
          <ApiExplorer />
          <div className="grid gap-2">
            <h2 className="eyebrow">Response shape</h2>
            <pre className="code">
              <span className="kw">200</span> {"{ "}
              <span className="st">&quot;data&quot;</span>: …, <span className="st">&quot;meta&quot;</span>: {"{ "}
              <span className="ty">count</span>, … {"} }"}
              {"\n"}
              <span className="kw">4xx</span> {"{ "}
              <span className="st">&quot;error&quot;</span>: {"{ "}
              <span className="ty">code</span>, <span className="ty">message</span> {"} }"}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
