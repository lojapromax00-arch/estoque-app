import { NextRequest, NextResponse } from "next/server";
import { createPipelineClient } from "@/lib/supabase/admin";
import type { PaginatedResponse } from "@/types/index";
import type { ImportJob } from "@/types/pipeline";

export async function GET(
  request: NextRequest
): Promise<NextResponse<PaginatedResponse<ImportJob>>> {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "20"))
    );
    const status = searchParams.get("status");

    const supabase = createPipelineClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("import_jobs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { data: [], count: 0, page, pageSize },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: (data ?? []) as ImportJob[],
      count: count ?? 0,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json(
      { data: [], count: 0, page: 1, pageSize: 20 },
      { status: 500 }
    );
  }
}
