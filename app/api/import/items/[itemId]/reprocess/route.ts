import { NextRequest, NextResponse } from "next/server";
import { createPipelineClient } from "@/lib/supabase/admin";
import { normalizeItem, buildNormalizedItem } from "@/lib/pipeline/normalizer";
import { checkDuplicate } from "@/lib/pipeline/dedup";
import { reviewItem } from "@/lib/pipeline/reviewer";
import type { ApiResponse } from "@/types/index";
import type { ImportJobItem, RawRow } from "@/types/pipeline";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
): Promise<NextResponse<ApiResponse<ImportJobItem>>> {
  try {
    const { itemId } = await params;
    const supabase = createPipelineClient();

    // Load item
    const { data: itemData, error: itemErr } = await supabase
      .from("import_job_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (itemErr || !itemData) {
      return NextResponse.json({ data: null, error: "Item não encontrado" }, { status: 404 });
    }

    const item = itemData as ImportJobItem;

    // Re-run pipeline for this single item
    const raw = (item.linha_original ?? {}) as RawRow;
    const parsed = normalizeItem(raw, item.numero_linha ?? 0);
    const normalized = buildNormalizedItem(parsed);
    const dedup = await checkDuplicate(normalized);
    const review = reviewItem(normalized, dedup);

    // Delete existing duplicate checks
    await supabase.from("duplicate_checks").delete().eq("import_job_item_id", itemId);

    // Update item
    const { data: updated, error: updateErr } = await supabase
      .from("import_job_items")
      .update({
        nome_padronizado: normalized.nomePadronizado,
        marca: normalized.marca ?? item.marca ?? null,
        variacao: normalized.variacao ?? item.variacao ?? null,
        volume: normalized.volume ?? item.volume ?? null,
        status_processamento: review.status,
        score_duplicidade: dedup.score,
        motivo_bloqueio: review.motivoBloqueio ?? null,
        produto_id: dedup.candidateProductId ?? null,
      })
      .eq("id", itemId)
      .select("*")
      .single();

    if (updateErr) {
      return NextResponse.json({ data: null, error: updateErr.message }, { status: 500 });
    }

    // Re-save duplicate check
    if (dedup.score > 0 && dedup.candidateProductId) {
      await supabase.from("duplicate_checks").insert({
        import_job_item_id: itemId,
        produto_candidato_id: dedup.candidateProductId,
        score: dedup.score,
        motivo: dedup.motivo,
        detalhes: dedup.detalhes,
      });
    }

    return NextResponse.json({ data: updated as ImportJobItem, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
