import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { trayCreateProduct, trayUpdateProduct } from "@/lib/tray/client";
import { logger } from "@/lib/logger";
import type { ImportJobItem } from "@/types/pipeline";

function getPipelineDb(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Sync a single import_job_item to the Tray API.
 * Creates or updates product, records log, updates item status.
 */
export async function syncItemToTray(itemId: string): Promise<void> {
  const db = getPipelineDb();

  // Load item
  const { data: itemData, error: itemErr } = await db
    .from("import_job_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (itemErr || !itemData) {
    throw new Error(`Item ${itemId} não encontrado: ${itemErr?.message}`);
  }

  const item = itemData as ImportJobItem;

  const product = {
    nome: item.nome_padronizado ?? item.nome_original ?? "Produto sem nome",
    sku: item.sku_interno ?? item.codigo_origem ?? undefined,
    preco: item.preco_venda ?? 0,
    custo: item.custo ?? undefined,
    estoque: item.estoque ?? 0,
    marca: item.marca ?? undefined,
  };

  const requestPayload = { ...product };
  let trayProductId: string | undefined;
  let acao: "criar" | "atualizar" | "erro" = "criar";
  let statusCode = 200;
  let erroMensagem: string | undefined;
  let responsePayload: Record<string, unknown> = {};

  try {
    if (item.tray_product_id) {
      // Update existing product
      acao = "atualizar";
      await trayUpdateProduct(item.tray_product_id, product);
      trayProductId = item.tray_product_id;
      responsePayload = { updated: true };
      logger.info(`Tray: produto ${trayProductId} atualizado`, { itemId });
    } else {
      // Create new product
      acao = "criar";
      const result = await trayCreateProduct(product);
      trayProductId = result.id;
      responsePayload = { id: trayProductId };
      logger.info(`Tray: produto ${trayProductId} criado`, { itemId });
    }
  } catch (err) {
    acao = "erro";
    statusCode = 500;
    erroMensagem = err instanceof Error ? err.message : String(err);
    logger.error(`Tray sync falhou para item ${itemId}`, { error: erroMensagem });
  }

  // Save sync log
  await db.from("tray_sync_logs").insert({
    import_job_item_id: itemId,
    product_id: item.produto_id ?? null,
    acao,
    tray_product_id: trayProductId ?? null,
    request_payload: requestPayload,
    response_payload: responsePayload,
    status_code: statusCode,
    erro_mensagem: erroMensagem ?? null,
  });

  // Update item status
  if (acao !== "erro" && trayProductId) {
    await db
      .from("import_job_items")
      .update({
        tray_product_id: trayProductId,
        status_processamento: "sincronizado_tray",
      })
      .eq("id", itemId);
  }
}
