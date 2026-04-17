"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/admin/Header";
import { JobTable } from "@/components/import/JobTable";
import { UploadZone } from "@/components/import/UploadZone";
import type { ImportJob } from "@/types/pipeline";
import type { PaginatedResponse } from "@/types/index";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "pendente", label: "Pendente" },
  { value: "processando", label: "Processando" },
  { value: "concluido", label: "Concluído" },
  { value: "erro", label: "Erro" },
];

export default function ImportacoesPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const fetchJobs = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/import/jobs?${params}`);
    const json = (await res.json()) as PaginatedResponse<ImportJob>;
    setJobs(json.data ?? []);
    setTotalCount(json.count ?? 0);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchJobs();
  }, [fetchJobs]);

  // Auto-refresh while any job is processing
  useEffect(() => {
    const hasProcessing = jobs.some((j) => j.status === "processando" || j.status === "pendente");
    if (!hasProcessing) return;
    const interval = setInterval(fetchJobs, 4000);
    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  async function handleReprocess(jobId: string) {
    await fetch(`/api/import/jobs/${jobId}/reprocess`, { method: "POST" });
    await fetchJobs();
  }

  function handleUploadComplete(jobId: string) {
    setShowUpload(false);
    router.push(`/admin/importacoes/${jobId}`);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title="Importações"
        subtitle={`${totalCount} importação${totalCount !== 1 ? "ões" : ""} no total`}
        actions={
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v16m8-8H4" />
            </svg>
            Nova Importação
          </button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Upload zone */}
        {showUpload && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-medium mb-4">Enviar Arquivo</h2>
            <UploadZone onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={fetchJobs}
            className="text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
          >
            ↻ Atualizar
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <JobTable
            jobs={jobs}
            loading={loading}
            onReprocess={handleReprocess}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} de {totalCount}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded border border-gray-700 disabled:opacity-40 hover:border-gray-500"
              >
                ←
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded border border-gray-700 disabled:opacity-40 hover:border-gray-500"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
