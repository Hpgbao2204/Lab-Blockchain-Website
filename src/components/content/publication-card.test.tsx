import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicationCard } from "./publication-card";

const publication = {
  id: "publication-id",
  title: "A publication",
  authors: ["Author One"],
  orcidPutCodes: [],
  externalIds: {},
  isFeatured: false,
  isPublished: true
};

describe("PublicationCard", () => {
  it("uses the card itself as the external link when a URL exists", () => {
    const markup = renderToStaticMarkup(
      <PublicationCard publication={{ ...publication, url: "https://doi.org/10.1/example" }} />
    );

    expect(markup.startsWith("<a ")).toBe(true);
    expect(markup).toContain('href="https://doi.org/10.1/example"');
    expect(markup.match(/<a /g)).toHaveLength(1);
  });

  it("keeps cards without a URL non-interactive", () => {
    const markup = renderToStaticMarkup(<PublicationCard publication={publication} />);

    expect(markup.startsWith("<article")).toBe(true);
    expect(markup).not.toContain("<a ");
  });
});
