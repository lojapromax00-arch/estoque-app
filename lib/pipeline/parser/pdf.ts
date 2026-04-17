import type { RawRow } from "@/types/pipeline";

/**
 * Parse a PDF buffer and return an array of raw rows.
 * Each text line that looks like a product row is returned as a RawRow.
 */
export async function parsePdf(buffer: Buffer): Promise<RawRow[]> {
  // Lazy import to avoid issues in edge environments
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (
    buf: Buffer
  ) => Promise<{ text: string }>;

  const result = await pdfParse(buffer);
  const lines = result.text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 3);

  const rows: RawRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip obvious headers / footers / page markers
    if (isHeaderOrFooter(line)) continue;

    // Skip lines that are purely numeric (page numbers, totals summaries without product info)
    if (/^\d+$/.test(line)) continue;

    // A product line typically contains at least one letter and one digit
    if (!/[a-zA-ZÀ-ú]/.test(line) || !/\d/.test(line)) continue;

    const parsed = splitLine(line, i);
    if (parsed) rows.push(parsed);
  }

  return rows;
}

function isHeaderOrFooter(line: string): boolean {
  const lowered = line.toLowerCase();
  const patterns = [
    /^página\s*\d+/i,
    /^page\s*\d+/i,
    /^total\s*geral/i,
    /^subtotal/i,
    /^relatório/i,
    /^report/i,
    /^empresa/i,
    /^cnpj/i,
    /^data\s*(emissão|emissao)/i,
    /^\s*-+\s*$/,
    /^={3,}/,
    /^_{3,}/,
  ];
  return patterns.some((p) => p.test(lowered));
}

function splitLine(line: string, index: number): RawRow | null {
  // Try delimiters in order: tab, semicolon, pipe, 2+ spaces
  const delimiters = ["\t", ";", "|", /\s{2,}/];

  for (const delim of delimiters) {
    const parts =
      typeof delim === "string" ? line.split(delim) : line.split(delim);
    if (parts.length >= 2) {
      const row: RawRow = { _linha: index + 1 };
      parts.forEach((p, idx) => {
        row[`coluna_${idx}`] = p.trim() || null;
      });
      return row;
    }
  }

  // Fallback: treat the entire line as a single "nome" column
  return { _linha: index + 1, coluna_0: line };
}
