import type { ParsedItem, NormalizedItem, RawRow } from "@/types/pipeline";

// Common brand patterns to detect in product names
const KNOWN_BRANDS = [
  "DOVE", "NIVEA", "LOREAL", "L'OREAL", "PANTENE", "SEDA", "ELSEVE",
  "GARNIER", "REVLON", "MAYBELLINE", "MAC", "BOTICARIO", "O BOTICARIO",
  "NATURA", "AVON", "MARY KAY", "NEUTROGENA", "JOHNSON", "REXONA",
  "AXE", "GILLETTE", "ORAL-B", "COLGATE", "SENSODYNE", "CREST",
  "HEAD SHOULDERS", "CLEAR", "AUSSIE", "TRESEMME", "SCHWARZKOPF",
  "WELLA", "KERASTASE", "KÉRASTASE", "REDKEN", "MATRIX",
];

// Volume patterns: 100ml, 1.5L, 500g, 1kg, 250gr, etc.
const VOLUME_REGEX = /(\d+(?:[.,]\d+)?\s*(?:ml|l|g|gr|kg|mg|oz|fl\.?oz))/i;

// Variation patterns: colors, sizes, etc.
const VARIATION_INDICATORS = [
  /\b(rosa|azul|vermelho|verde|amarelo|branco|preto|dourado|prata|nude)\b/i,
  /\b(pequeno|médio|grande|p\b|m\b|g\b|pp\b|gg\b|xg\b)\b/i,
  /\b(original|classic|intensive|plus|pro|max|ultra)\b/i,
  /\b(masculino|feminino|unissex|infantil)\b/i,
];

/** Find a column value by trying multiple key patterns */
function findColumn(
  row: RawRow,
  patterns: string[]
): string | number | null | undefined {
  const keys = Object.keys(row);
  for (const pattern of patterns) {
    const found = keys.find((k) => k.toLowerCase().includes(pattern));
    if (found !== undefined) return row[found];
  }
  return undefined;
}

/** Safely convert a value to a number */
function toNumber(val: unknown): number | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  const cleaned = String(val).replace(/[R$\s.]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

/** Clean text: trim, collapse spaces, keep accents */
function cleanText(val: unknown): string {
  if (!val) return "";
  return String(val)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\sÀ-ú.,\-/()]/g, "")
    .trim();
}

/** Normalize to uppercase for comparison */
function standardizeName(name: string): string {
  return name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/\s+/g, " ")
    .trim();
}

/** Try to extract brand from product name */
function extractBrandFromName(name: string): string | undefined {
  const upper = name.toUpperCase();
  for (const brand of KNOWN_BRANDS) {
    if (upper.includes(brand)) return brand;
  }
  return undefined;
}

/** Try to extract volume from product name */
function extractVolumeFromName(name: string): string | undefined {
  const match = name.match(VOLUME_REGEX);
  return match ? match[1].replace(/\s+/g, "").toLowerCase() : undefined;
}

/** Try to extract variation from product name */
function extractVariationFromName(name: string): string | undefined {
  for (const pattern of VARIATION_INDICATORS) {
    const match = name.match(pattern);
    if (match) return match[1];
  }
  return undefined;
}

/**
 * Convert a raw CSV/Excel/PDF row to a ParsedItem.
 */
export function normalizeItem(row: RawRow, rowIndex: number): ParsedItem {
  // Detect name
  const nomeRaw = findColumn(row, ["nome", "descri", "produto", "name", "item", "coluna_0"]);
  const nome = cleanText(nomeRaw);

  // Detect SKU/code
  const skuRaw = findColumn(row, ["sku", "ref", "referencia", "codigo", "cod", "id_produto"]);
  const sku = skuRaw ? cleanText(skuRaw) : undefined;

  // Detect origin code (supplier code)
  const codigoRaw = findColumn(row, ["codigo_origem", "cod_orig", "codigo_fornecedor", "cod_forn"]);
  const codigoOrigem = codigoRaw ? cleanText(codigoRaw) : undefined;

  // Detect brand
  const marcaRaw = findColumn(row, ["marca", "brand", "fabricante"]);
  const marca = marcaRaw ? cleanText(marcaRaw) : undefined;

  // Detect volume
  const volumeRaw = findColumn(row, ["volume", "ml", "peso", "gramagem"]);
  const volume = volumeRaw ? cleanText(volumeRaw) : undefined;

  // Detect variation
  const variacaoRaw = findColumn(row, ["variacao", "variação", "cor", "tamanho", "size"]);
  const variacao = variacaoRaw ? cleanText(variacaoRaw) : undefined;

  // Detect linha (product line)
  const linhaRaw = findColumn(row, ["linha", "line", "linha_produto"]);
  const linha = linhaRaw ? cleanText(linhaRaw) : undefined;

  // Detect stock
  const estoqueRaw = findColumn(row, ["estoque", "qtd", "quantidade", "stock", "qty"]);
  const estoque = toNumber(estoqueRaw);

  // Detect cost
  const custoRaw = findColumn(row, ["custo", "cost", "preco_custo", "vlr_custo"]);
  const custo = toNumber(custoRaw);

  // Detect sale price
  const precoRaw = findColumn(row, ["preco_venda", "preco", "price", "valor", "venda", "pvenda"]);
  const precoVenda = toNumber(precoRaw);

  return {
    rowIndex,
    raw: row,
    nome: nome || undefined,
    sku: sku || undefined,
    codigoOrigem: codigoOrigem || undefined,
    marca: marca || undefined,
    volume: volume || undefined,
    variacao: variacao || undefined,
    linha: linha || undefined,
    estoque,
    custo,
    precoVenda,
  };
}

/**
 * Enrich a ParsedItem with normalized name and inferred fields.
 */
export function buildNormalizedItem(item: ParsedItem): NormalizedItem {
  const nome = item.nome ?? "";

  // Try to infer brand if not provided
  const marca = item.marca ?? extractBrandFromName(nome);

  // Try to infer volume if not provided
  const volume = item.volume ?? extractVolumeFromName(nome);

  // Try to infer variation if not provided
  const variacao = item.variacao ?? extractVariationFromName(nome);

  // Build standardized name
  const nomePadronizado = standardizeName(nome);

  return {
    ...item,
    marca,
    volume,
    variacao,
    nomePadronizado,
  };
}
