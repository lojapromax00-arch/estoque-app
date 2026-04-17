"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/admin/Header";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Product } from "@/types/pipeline";
import { createClient } from "@/lib/supabase/client";

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 30;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (debouncedSearch) {
      query = query.or(
        `nome.ilike.%${debouncedSearch}%,nome_padronizado.ilike.%${debouncedSearch}%,sku.ilike.%${debouncedSearch}%,sku_interno.ilike.%${debouncedSearch}%`
      );
    }

    const { data, count } = await query;
    setProducts((data ?? []) as Product[]);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title="Produtos"
        subtitle={`${totalCount} produto${totalCount !== 1 ? "s" : ""} no catálogo`}
      />

      <div className="p-6 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p>
                {debouncedSearch ? `Nenhum produto encontrado para "${debouncedSearch}"` : "Nenhum produto no catálogo"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Nome</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Nome Padronizado</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">SKU</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Marca</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Estoque</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Preço Venda</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Tray ID</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                      <td className="px-4 py-3 text-gray-200 max-w-[180px]">
                        <span className="truncate block" title={p.nome}>{p.nome}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 max-w-[180px]">
                        <span className="truncate block" title={p.nome_padronizado ?? ""}>
                          {p.nome_padronizado ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                        {p.sku_interno ?? p.sku ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{p.marca ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{p.estoque}</td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {p.preco_venda != null ? formatCurrency(p.preco_venda) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {p.tray_product_id ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDate(p.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
              >←</button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded border border-gray-700 disabled:opacity-40 hover:border-gray-500"
              >→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
