import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedItem, DedupResult } from "@/types/pipeline";

function getPipelineDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

interface ProductRow {
  id: string;
  sku_interno?: string;
  codigo_origem?: string;
  nome_padronizado?: string;
  marca?: string;
  volume?: string;
}

/**
 * Check if a normalized item is a duplicate of an existing product.
 * Returns a DedupResult with score 0–100.
 */
export async function checkDuplicate(item: NormalizedItem): Promise<DedupResult> {
  const db = getPipelineDb();

  // 1. Exact SKU match
  if (item.sku) {
    const { data } = await db
      .from("products")
      .select("id, sku_interno, codigo_origem, nome_padronizado, marca, volume")
      .eq("sku_interno", item.sku)
      .limit(1);

    const match = (data as ProductRow[] | null)?.[0];
    if (match) {
      return {
        isDuplicate: true,
        score: 100,
        motivo: "SKU interno idêntico",
        candidateProductId: match.id,
        detalhes: { sku_match: item.sku, product_id: match.id },
      };
    }
  }

  // 2. Exact origin code match
  if (item.codigoOrigem) {
    const { data } = await db
      .from("products")
      .select("id, sku_interno, codigo_origem, nome_padronizado, marca, volume")
      .eq("codigo_origem", item.codigoOrigem)
      .limit(1);

    const match = (data as ProductRow[] | null)?.[0];
    if (match) {
      return {
        isDuplicate: true,
        score: 95,
        motivo: "Código de origem idêntico",
        candidateProductId: match.id,
        detalhes: { codigo_match: item.codigoOrigem, product_id: match.id },
      };
    }
  }

  // 3. Name similarity check
  if (item.nomePadronizado && item.nomePadronizado.length >= 5) {
    // Get first 3 significant words from the normalized name
    const words = item.nomePadronizado
      .split(" ")
      .filter((w) => w.length > 2)
      .slice(0, 4);

    if (words.length === 0) {
      return { isDuplicate: false, score: 0, motivo: "Sem dados suficientes", detalhes: {} };
    }

    // Query products whose nome_padronizado contains the first word (broad match)
    const { data: candidates } = await db
      .from("products")
      .select("id, sku_interno, codigo_origem, nome_padronizado, marca, volume")
      .ilike("nome_padronizado", `%${words[0]}%`)
      .limit(20);

    const rows = (candidates as ProductRow[] | null) ?? [];

    let bestScore = 0;
    let bestMatch: ProductRow | null = null;
    let bestMotivo = "";

    for (const candidate of rows) {
      const candName = (candidate.nome_padronizado ?? "").toUpperCase();
      const itemName = item.nomePadronizado;

      let score = 0;
      const reasons: string[] = [];

      // Exact name match
      if (candName === itemName) {
        score = 90;
        reasons.push("Nome idêntico");
      } else {
        // Word overlap score
        const itemWords = new Set(itemName.split(" ").filter((w) => w.length > 2));
        const candWords = new Set(candName.split(" ").filter((w) => w.length > 2));
        const overlap = [...itemWords].filter((w) => candWords.has(w));
        const overlapRatio = itemWords.size > 0 ? overlap.length / itemWords.size : 0;

        if (overlapRatio >= 0.8) {
          score = 80;
          reasons.push(`${Math.round(overlapRatio * 100)}% de palavras em comum`);
        } else if (overlapRatio >= 0.6) {
          score = 60;
          reasons.push(`${Math.round(overlapRatio * 100)}% de palavras em comum`);
        }

        // Bonus: same brand AND same volume
        const brandMatch =
          item.marca &&
          candidate.marca &&
          item.marca.toUpperCase() === candidate.marca.toUpperCase();
        const volumeMatch =
          item.volume &&
          candidate.volume &&
          item.volume.toLowerCase() === candidate.volume.toLowerCase();

        if (brandMatch && volumeMatch && score >= 50) {
          score = Math.min(score + 15, 90);
          reasons.push("Mesma marca e volume");
        } else if (brandMatch && score >= 50) {
          score = Math.min(score + 8, 85);
          reasons.push("Mesma marca");
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
        bestMotivo = reasons.join("; ");
      }
    }

    if (bestScore > 0 && bestMatch) {
      return {
        isDuplicate: bestScore >= 70,
        score: bestScore,
        motivo: bestMotivo || "Similaridade de nome",
        candidateProductId: bestMatch.id,
        detalhes: {
          candidate_id: bestMatch.id,
          candidate_name: bestMatch.nome_padronizado,
          item_name: item.nomePadronizado,
        },
      };
    }
  }

  return {
    isDuplicate: false,
    score: 0,
    motivo: "Nenhum produto similar encontrado",
    detalhes: {},
  };
}
