import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { parseFile } from "./parser";
import { normalizeItem, buildNormalizedItem } from "./normalizer";
import { checkDuplicate } from "./dedup";
import { reviewItem } from "./reviewer";
import { syncItemToTray } from "./tray-sync";
import { logger } from "@/lib/logger";
import type { ImportJob, RawRow } from "@/types/pipeline";

function getPipelineDb(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const TRAY_CONFIGURED =
  !!process.env.TRAY_API_URL &&
  !!process.env.TRAY_API_KEY &&
  !!process.env.TRAY_STORE_ID;

const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "importacoes";

/**
 * Main pipeline orchestrator. Runs the full import process for a job.
 */
export async function runPipeline(jobId: string): Promise<void> {
  const db = getPipelineDb();
  logger.info(`Pipeline iniciado para job ${jobId}`);

  // 1. Load job and set status to 'processando'
  const { data: jobData, error: jobErr } = await db
    .from("import_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobErr || !jobData) {
    logger.error(`Job ${jobId} não encontrado`, { error: jobErr?.message });
    return;
  }

  const job = jobData as ImportJob;

  await db
    .from("import_jobs")
    .update({ status: "processando", iniciado_em: new Date().toISOString() })
    .eq("id", jobId);

  try {
    // 2. Download file from Storage
    const storagePath = job.storage_path;
    if (!storagePath) throw new Error("Job sem storage_path definido");

    const { data: fileData, error: storageErr } = await db.storage
      .from(STORAGE_BUCKET)
      .download(storagePath);

    if (storageErr || !fileData) {
      throw new Error(`Falha ao baixar arquivo: ${storageErr?.message}`);
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // 3. Parse file
    logger.info(`Parseando arquivo ${job.nome_arquivo} (${job.tipo_arquivo})`);
    const rows: RawRow[] = await parseFile(buffer, job.nome_arquivo);
    logger.info(`${rows.length} linhas extraídas do arquivo`);

    // 4. Process each row
    let aprovados = 0;
    let bloqueados = 0;
    let erros = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // 4a. Normalize
        const parsed = normalizeItem(row, i);
        const normalized = buildNormalizedItem(parsed);

        // 4b. Check duplicate
        const dedup = await checkDuplicate(normalized);

        // 4c. Review
        const review = reviewItem(normalized, dedup);

        // 4d. Save import_job_item
        const { data: savedItem, error: saveErr } = await db
          .from("import_job_items")
          .insert({
            import_job_id: jobId,
            linha_original: row,
            numero_linha: i + 1,
            sku_interno: normalized.sku ?? null,
            codigo_origem: normalized.codigoOrigem ?? null,
            nome_original: normalized.nome ?? null,
            nome_padronizado: normalized.nomePadronizado,
            marca: normalized.marca ?? null,
            linha: normalized.linha ?? null,
            variacao: normalized.variacao ?? null,
            volume: normalized.volume ?? null,
            estoque: normalized.estoque ?? null,
            custo: normalized.custo ?? null,
            preco_venda: normalized.precoVenda ?? null,
            status_processamento: review.status,
            score_duplicidade: dedup.score,
            motivo_bloqueio: review.motivoBloqueio ?? null,
            produto_id: dedup.candidateProductId ?? null,
          })
          .select("id")
          .single();

        if (saveErr || !savedItem) {
          logger.warn(`Falha ao salvar item linha ${i + 1}`, { error: saveErr?.message });
          erros++;
          continue;
        }

        // 4e. Save duplicate check if score > 0
        if (dedup.score > 0 && dedup.candidateProductId) {
          await db.from("duplicate_checks").insert({
            import_job_item_id: (savedItem as { id: string }).id,
            produto_candidato_id: dedup.candidateProductId,
            score: dedup.score,
            motivo: dedup.motivo,
            detalhes: dedup.detalhes,
          });
        }

        // 4f. Count results
        if (review.status === "aprovado_automaticamente") {
          aprovados++;

          // Also insert into supplier_items
          await db.from("supplier_items").insert({
            import_job_item_id: (savedItem as { id: string }).id,
            product_id: dedup.candidateProductId ?? null,
            sku_interno: normalized.sku ?? null,
            codigo_origem: normalized.codigoOrigem ?? null,
            nome_original: normalized.nome ?? "Produto",
            nome_padronizado: normalized.nomePadronizado,
            marca: normalized.marca ?? null,
            variacao: normalized.variacao ?? null,
            volume: normalized.volume ?? null,
            estoque: normalized.estoque ?? 0,
            custo: normalized.custo ?? null,
            preco_venda: normalized.precoVenda ?? null,
          });

          // 4g. Sync to Tray if configured
          if (TRAY_CONFIGURED) {
            syncItemToTray((savedItem as { id: string }).id).catch((err) => {
              logger.error(`Tray sync falhou para item linha ${i + 1}`, { error: err });
            });
          }
        } else if (review.status === "erro_tecnico") {
          erros++;
        } else {
          bloqueados++;
        }
      } catch (rowErr) {
        logger.error(`Erro ao processar linha ${i + 1}`, { error: rowErr });
        erros++;

        // Save as erro_tecnico
        await db.from("import_job_items").insert({
          import_job_id: jobId,
          linha_original: row,
          numero_linha: i + 1,
          nome_original: String(row[Object.keys(row)[0]] ?? ""),
          status_processamento: "erro_tecnico",
          motivo_bloqueio:
            rowErr instanceof Error ? rowErr.message : "Erro desconhecido",
        });
      }
    }

    // 5. Update job as completed
    await db
      .from("import_jobs")
      .update({
        status: "concluido",
        total_itens: rows.length,
        itens_aprovados: aprovados,
        itens_bloqueados: bloqueados,
        itens_erro: erros,
        concluido_em: new Date().toISOString(),
      })
      .eq("id", jobId);

    logger.info(`Pipeline concluído para job ${jobId}`, {
      total: rows.length,
      aprovados,
      bloqueados,
      erros,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Pipeline falhou para job ${jobId}`, { error: msg });

    await db
      .from("import_jobs")
      .update({
        status: "erro",
        erro_mensagem: msg,
        concluido_em: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}
