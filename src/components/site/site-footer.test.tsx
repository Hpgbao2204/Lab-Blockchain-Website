import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("renders configured contact, ORCID, and Google Scholar links with external-link security", () => {
    const html = renderToStaticMarkup(
      <SiteFooter
        settings={{
          contactEmail: "research@blockchainist.id.vn",
          orcidId: "0000-0001-2345-6789",
          googleScholarUrl: "https://scholar.google.com/citations?user=custom"
        }}
      />
    );

    expect(html).toContain('href="mailto:research@blockchainist.id.vn"');
    expect(html).toContain('href="https://orcid.org/0000-0001-2345-6789"');
    expect(html).toContain('href="https://scholar.google.com/citations?user=custom"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer noopener"');
  });

  it("falls back to documented defaults when settings are absent", () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).toContain('href="mailto:contact@blockchainist.id.vn"');
    expect(html).toContain('href="https://orcid.org/0000-0003-1156-7072"');
    expect(html).not.toContain("Google Scholar");
  });
});
