"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/admin/Header";
import { ItemTable } from "@/components/import/ItemTable";
import { JobStatusBadge } from "@/components/import/JobStatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";
import type { ImportJob, ImportJobItem } from "@/types/pipeline";
import type { ApiResponse, PaginatedResponse } from "@/types/index";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "aprovado_automaticamente", label: "Aprovados" },
  { value: "bloqueado_por_duvida", label: "Bloqueados" },
  { value: "erro_tecnico", label: "Erros" },
  { value: "sincronizado_tray", label: "Sync Tray" },
];

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<ImportJob | null>(null);
  const [items, setItems] = useState<ImportJobItem[]>([]);
  const [statusTab, setStatusTab] = useState("");
  const [loadingJob, setLoadingJob] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 50;

  const fetchJob = useCallback(async () => {
    const res = await fetch(`/api/import/jobs/${jobId}`);
    const json = (await res.json()) as ApiResponse<ImportJob>;
    if (json.data) setJob(json.data);
    setLoadingJob(false);
  }, [jobId]);

  const fetchItems = useCallback(async () => {
    setLoadingItems(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (statusTab) params.set("status", statusTab);
    const res = await fetch(`/api/import/jobs/${jobId}/items?${params}`);
    const json = (await res.json()) as PaginatedResponse<ImportJobItem>;
    setItems(json.data ?? []);
    setTotalItems(json.count ?? 0);
    setLoadingItems(false);
  }, [jobId, page, statusTab]);

  useEffect(() => { fetchJob(); }, [fetchJob]);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Auto-refresh while processing
  useEffect(() => {
    if (!job || (job.status !== "processando" && job.status !== "pendente")) return;
    const interval = setInterval(() => { fetchJob(); fetchItems(); }, 3000);
    return () => clearInterval(interval);
  }, [job, fetchJob, fetchItems]);

  async function handleReprocessJob() {
    await fetch(`/api/import/jobs/${jobId}/reprocess`, { method: "POST" });
    await fetchJob();
    await fetchItems();
  }

  async function handleReprocessItem(itemId: string) {
    await fetch(`/api/import/items/${itemId}/reprocess`, { method: "POST" });
    await fetchItems();
  }

  async function handleSyncTray(itemId: string) {
    await fetch(`/api/tray/sync/${itemId}`, { method: "POST" });
    await fetchItems();
  }

  if (loadingJob) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Job não encontrado</p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title={job.nome_arquivo}
        subtitle={`Importação · ${formatDate(job.created_at)}`}
        actions={
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded border border-gray-700 hover:border-gray-500"
          >
            ← Voltar
          </button>
        }
      />

      <div className="p-6 space-y-5">
        {/* Job summary card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex flex-wrap items-start gap-6">
            <div>
              <p className="text-gray-500 text-xs mb-1">Status</p>
              <JobStatusBadge status={job.status} />
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Total</p>
              <p className="text-white font-medium">{job.total_itens}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Aprovados</p>
              <p className="text-green-400 font-medium">{job.itens_aprovados}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Bloqueados</p>
              <p className="text-yellow-400 font-medium">{job.itens_bloqueados}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Erros</p>
              <p className="text-red-400 font-medium">{job.itens_erro}</p>
            </div>
            {job.erro_mensagem && (
              <div className="flex-1">
                <p className="text-gray-500 text-xs mb-1">Mensagem de Erro</p>
                <p className="text-red-400 text-sm">{job.erro_mensagem}</p>
              </div>
            )}
            <div className="ml-auto">
              {(job.status === "concluido" || job.status === "erro") && (
                <button
                  onClick={handleReprocessJob}
                  className="text-sm text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded border border-blue-800 hover:border-blue-600"
                >
                  ↻ Reprocessar tudo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* Status tabs */}
          <div className="flex border-b border-gray-800 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatusTab(tab.value); setPage(1); }}
                className={`px-4 py-3 text-sm whitespace-nowrap transition-colors ${
                  statusTab === tab.value
                    ? "text-white border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <ItemTable
            items={items}
            loading={loadingItems}
            onReprocess={handleReprocessItem}
            onSyncTray={handleSyncTray}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 text-sm text-gray-400">
              <span>
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} de {totalItems}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded border border-gray-700 disabled:opacity-40"
                >←</button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-gray-700 disabled:opacity-40"
                >→</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
