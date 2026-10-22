/**
 * Minimal RFC 4180 CSV reader (quoted fields, "" escapes, CRLF), used in the browser by the
 * admin importer and by `npm run venues:import`. Returns the header and the data rows.
 */
export function parseCsv(text: string): { columns: string[]; rows: string[][] } {
  const out: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0; // byte order mark
  for (; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      out.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    out.push(row);
  }
  const [columns = [], ...rows] = out.filter((r) => r.length > 1 || r[0] !== "");
  return { columns: columns.map((c) => c.trim()), rows };
}

/** Which venue file this is, from its header: the conference file has `conference_id`, journals `journal_id`. */
export function venueFileKind(columns: string[]): "conference" | "journal" | null {
  if (columns.includes("conference_id")) return "conference";
  if (columns.includes("journal_id")) return "journal";
  return null;
}
