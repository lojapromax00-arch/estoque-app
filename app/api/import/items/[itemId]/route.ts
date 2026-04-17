import { NextRequest, NextResponse } from "next/server";
import { createPipelineClient } from "@/lib/supabase/admin";
import type { ApiResponse } from "@/types/index";
import type { ImportJobItem, DuplicateCheck } from "@/types/pipeline";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
): Promise<NextResponse<ApiResponse<ImportJobItem & { duplicate_checks: DuplicateCheck[] }>>> {
  try {
    const { itemId } = await params;
    const supabase = createPipelineClient();

    const { data: item, error } = await supabase
      .from("import_job_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (error || !item) {
      return NextResponse.json({ data: null, error: "Item não encontrado" }, { status: 404 });
    }

    const { data: checks } = await supabase
      .from("duplicate_checks")
      .select("*")
      .eq("import_job_item_id", itemId)
      .order("score", { ascending: false });

    return NextResponse.json({
      data: {
        ...(item as ImportJobItem),
        duplicate_checks: (checks ?? []) as DuplicateCheck[],
      },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
): Promise<NextResponse<ApiResponse<ImportJobItem>>> {
  try {
    const { itemId } = await params;
    const body = (await request.json()) as Partial<ImportJobItem>;
    const supabase = createPipelineClient();

    // Allow editing these fields only
    const allowed = [
      "nome_padronizado", "marca", "variacao", "volume", "linha",
      "sku_interno", "codigo_origem", "estoque", "custo", "preco_venda",
    ];
    const update: Partial<ImportJobItem> = {};
    for (const key of allowed) {
      if (key in body) {
        (update as Record<string, unknown>)[key] = (body as Record<string, unknown>)[key];
      }
    }

    const { data, error } = await supabase
      .from("import_job_items")
      .update(update)
      .eq("id", itemId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data as ImportJobItem, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
