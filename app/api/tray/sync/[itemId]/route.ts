import { NextRequest, NextResponse } from "next/server";
import { syncItemToTray } from "@/lib/pipeline/tray-sync";
import type { ApiResponse } from "@/types/index";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
): Promise<NextResponse<ApiResponse<{ synced: boolean }>>> {
  try {
    const { itemId } = await params;
    await syncItemToTray(itemId);
    return NextResponse.json({ data: { synced: true }, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : "Erro ao sincronizar" },
      { status: 500 }
    );
  }
}
