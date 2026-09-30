import { route } from "@/lib/api/handler";
import { monthlyReport, reportCsv } from "@/server/services/reports";
import { monthParam } from "@/server/validation";
import { labToday } from "@/lib/weeks";

/** `?month=YYYY-MM` (default: this month), `&format=csv` for a spreadsheet download. */
export const GET = route(async ({ db, user, req }) => {
  const sp = new URL(req.url).searchParams;
  const month = monthParam.parse(sp.get("month") ?? labToday().slice(0, 7));
  const report = await monthlyReport(db, user, month);
  if (sp.get("format") === "csv") {
    return new Response(reportCsv(report), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="blockchainist-progress-${month}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return report;
});
