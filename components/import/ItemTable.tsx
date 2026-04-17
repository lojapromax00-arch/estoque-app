"use client";

import { ItemStatusBadge } from "./ItemStatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import type { ImportJobItem } from "@/types/pipeline";

interface ItemTableProps {
  items: ImportJobItem[];
  loading?: boolean;
  onReprocess?: (itemId: string) => void;
  onSyncTray?: (itemId: string) => void;
}

export function ItemTable({ items, loading, onReprocess, onSyncTray }: ItemTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Nenhum item encontrado</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left px-3 py-2.5 text-gray-400 font-medium w-10">#</th>
            <th className="text-left px-3 py-2.5 text-gray-400 font-medium">Nome Original</th>
            <th className="text-left px-3 py-2.5 text-gray-400 font-medium">Nome Padronizado</th>
            <th className="text-left px-3 py-2.5 text-gray-400 font-medium">Marca</th>
            <th className="text-right px-3 py-2.5 text-gray-400 font-medium">Preço</th>
            <th className="text-left px-3 py-2.5 text-gray-400 font-medium">Status</th>
            <th className="text-right px-3 py-2.5 text-gray-400 font-medium">Score</th>
            <th className="text-left px-3 py-2.5 text-gray-400 font-medium">Motivo Bloqueio</th>
            <th className="px-3 py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors"
            >
              <td className="px-3 py-2.5 text-gray-500 text-xs">{item.numero_linha}</td>
              <td className="px-3 py-2.5 text-gray-300 max-w-[180px]">
                <span className="truncate block" title={item.nome_original ?? ""}>
                  {item.nome_original ?? "—"}
                </span>
              </td>
              <td className="px-3 py-2.5 text-white max-w-[180px]">
                <span className="truncate block" title={item.nome_padronizado ?? ""}>
                  {item.nome_padronizado ?? "—"}
                </span>
              </td>
              <td className="px-3 py-2.5 text-gray-400">{item.marca ?? "—"}</td>
              <td className="px-3 py-2.5 text-right text-gray-300">
                {item.preco_venda != null ? formatCurrency(item.preco_venda) : "—"}
              </td>
              <td className="px-3 py-2.5">
                <ItemStatusBadge status={item.status_processamento} />
              </td>
              <td className="px-3 py-2.5 text-right">
                {item.score_duplicidade > 0 ? (
                  <span
                    className={
                      item.score_duplicidade >= 70
                        ? "text-red-400"
                        : item.score_duplicidade >= 50
                        ? "text-yellow-400"
                        : "text-gray-400"
                    }
                  >
                    {item.score_duplicidade}%
                  </span>
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-gray-500 max-w-[160px]">
                <span className="truncate block text-xs" title={item.motivo_bloqueio ?? ""}>
                  {item.motivo_bloqueio ?? "—"}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1">
                  {item.status_processamento === "bloqueado_por_duvida" && onReprocess && (
                    <button
                      onClick={() => onReprocess(item.id)}
                      className="text-xs text-yellow-400 hover:text-yellow-300 px-2 py-1 rounded border border-yellow-800 hover:border-yellow-600 whitespace-nowrap"
                    >
                      Reprocessar
                    </button>
                  )}
                  {item.status_processamento === "aprovado_automaticamente" && !item.tray_product_id && onSyncTray && (
                    <button
                      onClick={() => onSyncTray(item.id)}
                      className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded border border-blue-800 hover:border-blue-600 whitespace-nowrap"
                    >
                      Sync Tray
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
