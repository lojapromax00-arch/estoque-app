import { NextRequest, NextResponse } from "next/server";
import { createPipelineClient } from "@/lib/supabase/admin";
import { runPipeline } from "@/lib/pipeline";
import { logger } from "@/lib/logger";
import type { ApiResponse } from "@/types/index";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse<ApiResponse<{ jobId: string }>>> {
  try {
    const { jobId } = await params;
    const supabase = createPipelineClient();

    // Verify job exists
    const { data: job, error: jobErr } = await supabase
      .from("import_jobs")
      .select("id, storage_path")
      .eq("id", jobId)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ data: null, error: "Job não encontrado" }, { status: 404 });
    }

    // Delete existing items
    await supabase.from("import_job_items").delete().eq("import_job_id", jobId);

    // Reset job status
    await supabase
      .from("import_jobs")
      .update({
        status: "pendente",
        total_itens: 0,
        itens_aprovados: 0,
        itens_bloqueados: 0,
        itens_erro: 0,
        erro_mensagem: null,
        iniciado_em: null,
        concluido_em: null,
      })
      .eq("id", jobId);

    // Fire-and-forget
    runPipeline(jobId).catch((err) => {
      logger.error(`Reprocessamento falhou para job ${jobId}`, { error: err });
    });

    return NextResponse.json({ data: { jobId }, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
