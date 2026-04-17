"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { JobStatusBadge } from "./JobStatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import type { ImportJob } from "@/types/pipeline";

interface JobTableProps {
  jobs: ImportJob[];
  loading?: boolean;
  onReprocess?: (jobId: string) => void;
}

const typeLabels: Record<string, string> = {
  csv: "CSV",
  excel: "Excel",
  pdf: "PDF",
};

export function JobTable({ jobs, loading, onReprocess }: JobTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>Nenhuma importação encontrada</p>
        <p className="text-sm mt-1">Envie seu primeiro arquivo usando o botão acima</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left px-4 py-3 text-gray-400 font-medium">Arquivo</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">Tipo</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
            <th className="text-right px-4 py-3 text-gray-400 font-medium">Total</th>
            <th className="text-right px-4 py-3 text-gray-400 font-medium">Aprovados</th>
            <th className="text-right px-4 py-3 text-gray-400 font-medium">Bloqueados</th>
            <th className="text-right px-4 py-3 text-gray-400 font-medium">Erros</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">Data</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/admin/importacoes/${job.id}`}
                  className="text-blue-400 hover:text-blue-300 font-medium truncate max-w-[200px] block"
                >
                  {job.nome_arquivo}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-400">
                {typeLabels[job.tipo_arquivo] ?? job.tipo_arquivo}
              </td>
              <td className="px-4 py-3">
                <JobStatusBadge status={job.status} />
              </td>
              <td className="px-4 py-3 text-right text-gray-300">{job.total_itens}</td>
              <td className="px-4 py-3 text-right text-green-400">{job.itens_aprovados}</td>
              <td className="px-4 py-3 text-right text-yellow-400">{job.itens_bloqueados}</td>
              <td className="px-4 py-3 text-right text-red-400">{job.itens_erro}</td>
              <td className="px-4 py-3 text-gray-400">{formatDate(job.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/importacoes/${job.id}`}
                    className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-gray-700 hover:border-gray-500"
                  >
                    Ver
                  </Link>
                  {(job.status === "concluido" || job.status === "erro") && onReprocess && (
                    <button
                      onClick={() => onReprocess(job.id)}
                      className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded border border-blue-800 hover:border-blue-600"
                    >
                      Reprocessar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
