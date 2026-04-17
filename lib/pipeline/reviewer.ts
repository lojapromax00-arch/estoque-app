import type { NormalizedItem, DedupResult, ReviewResult } from "@/types/pipeline";

const DUPLICATE_SCORE_THRESHOLD = 70;

/**
 * Classify a normalized item as APPROVED, BLOCKED, or ERROR.
 */
export function reviewItem(
  item: NormalizedItem,
  dedup: DedupResult
): ReviewResult {
  // 1. Technical error: empty or invalid name
  if (!item.nome || item.nome.trim().length < 3) {
    return {
      status: "bloqueado_por_duvida",
      motivoBloqueio: "Nome do produto inválido ou muito curto",
    };
  }

  // 2. Duplicate detection
  if (dedup.score >= DUPLICATE_SCORE_THRESHOLD) {
    return {
      status: "bloqueado_por_duvida",
      motivoBloqueio: `Duplicidade detectada: ${dedup.motivo} (score: ${dedup.score})`,
    };
  }

  // 3. Invalid price
  if (item.precoVenda !== undefined && item.precoVenda <= 0) {
    return {
      status: "bloqueado_por_duvida",
      motivoBloqueio: "Preço de venda inválido (deve ser maior que zero)",
    };
  }

  // 4. Negative stock
  if (item.estoque !== undefined && item.estoque < 0) {
    return {
      status: "bloqueado_por_duvida",
      motivoBloqueio: "Quantidade em estoque inválida (valor negativo)",
    };
  }

  // 5. Cost higher than sale price (suspicious)
  if (
    item.custo !== undefined &&
    item.precoVenda !== undefined &&
    item.custo > item.precoVenda
  ) {
    return {
      status: "bloqueado_por_duvida",
      motivoBloqueio: `Custo (${item.custo}) maior que preço de venda (${item.precoVenda})`,
    };
  }

  return { status: "aprovado_automaticamente" };
}
