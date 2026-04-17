import type { RawRow } from "@/types/pipeline";
import { parseCsv } from "./csv";
import { parseExcel } from "./excel";
import { parsePdf } from "./pdf";

/**
 * Detect file type from filename extension or mimeType and parse it.
 */
export async function parseFile(
  buffer: Buffer,
  filename: string
): Promise<RawRow[]> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  switch (ext) {
    case "csv":
      return parseCsv(buffer);

    case "xls":
    case "xlsx":
      return parseExcel(buffer);

    case "pdf":
      return await parsePdf(buffer);

    default:
      throw new Error(
        `Tipo de arquivo não suportado: .${ext}. Use CSV, Excel ou PDF.`
      );
  }
}

export function detectFileType(
  filename: string
): "csv" | "excel" | "pdf" | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "csv") return "csv";
  if (ext === "xls" || ext === "xlsx") return "excel";
  if (ext === "pdf") return "pdf";
  return null;
}
