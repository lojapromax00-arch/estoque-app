import { NextRequest, NextResponse } from "next/server";
import { createPipelineClient } from "@/lib/supabase/admin";
import type { ApiResponse } from "@/types/index";
import type { ImportJob } from "@/types/pipeline";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse<ApiResponse<ImportJob & { counts_by_status: Record<string, number> }>>> {
  try {
    const { jobId } = await params;
    const supabase = createPipelineClient();

    const { data: job, error } = await supabase
      .from("import_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { data: null, error: "Job não encontrado" },
        { status: 404 }
      );
    }

    // Get item counts by status
    const { data: itemCounts } = await supabase
      .from("import_job_items")
      .select("status_processamento")
      .eq("import_job_id", jobId);

    const counts_by_status: Record<string, number> = {};
    for (const row of itemCounts ?? []) {
      const s = (row as { status_processamento: string }).status_processamento;
      counts_by_status[s] = (counts_by_status[s] ?? 0) + 1;
    }

    return NextResponse.json({
      data: { ...(job as ImportJob), counts_by_status },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
