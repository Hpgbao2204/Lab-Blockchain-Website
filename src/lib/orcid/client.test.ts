import { afterEach, describe, expect, it, vi } from "vitest";
import { getOrcidWorks, hasOrcidCredentials } from "./client";

describe("ORCID client", () => {
  afterEach(() => {
    delete process.env.ORCID_CLIENT_ID;
    delete process.env.ORCID_CLIENT_SECRET;
    vi.restoreAllMocks();
  });

  it("reports missing client credentials", () => {
    expect(hasOrcidCredentials()).toBe(false);
  });

  it("uses a read-public access token and batches at 100 put-codes", async () => {
    process.env.ORCID_CLIENT_ID = "client-id";
    process.env.ORCID_CLIENT_SECRET = "client-secret";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "read-token" }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ group: [{ "work-summary": [{ "put-code": 1 }, { "put-code": 2 }] }] }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ bulk: [{ work: { "put-code": 1 } }, { work: { "put-code": 2 } }] }), {
          status: 200
        })
      );

    const works = await getOrcidWorks("0000-0003-1156-7072", fetchMock);

    expect(works).toEqual([{ "put-code": 1 }, { "put-code": 2 }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2]?.[0]).toContain("/works/1,2");
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
      headers: expect.objectContaining({ Authorization: "Bearer read-token" })
    });
  });
});
