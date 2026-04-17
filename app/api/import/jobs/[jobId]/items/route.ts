import { NextRequest, NextResponse } from "next/server";
import { createPipelineClient } from "@/lib/supabase/admin";
import type { PaginatedResponse } from "@/types/index";
import type { ImportJobItem } from "@/types/pipeline";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse<PaginatedResponse<ImportJobItem>>> {
  try {
    const { jobId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50")));
    const status = searchParams.get("status");

    const supabase = createPipelineClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("import_job_items")
      .select("*", { count: "exact" })
      .eq("import_job_id", jobId)
      .order("numero_linha", { ascending: true })
      .range(from, to);

    if (status) {
      query = query.eq("status_processamento", status);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ data: [], count: 0, page, pageSize }, { status: 500 });
    }

    return NextResponse.json({
      data: (data ?? []) as ImportJobItem[],
      count: count ?? 0,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json({ data: [], count: 0, page: 1, pageSize: 50 }, { status: 500 });
  }
}
