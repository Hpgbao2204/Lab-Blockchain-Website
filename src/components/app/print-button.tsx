"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" className="btn btn-sm" onClick={() => window.print()}>
      <Printer size={15} aria-hidden /> Print / save as PDF
    </button>
  );
}
