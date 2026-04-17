import * as XLSX from "xlsx";
import type { RawRow } from "@/types/pipeline";

/**
 * Parse a CSV buffer and return an array of raw rows.
 */
export function parseCsv(buffer: Buffer): RawRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    defval: null,
    raw: false,
  });

  return rows;
}
