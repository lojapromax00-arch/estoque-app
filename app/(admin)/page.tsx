import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/admin/Header";
import Link from "next/link";

interface StatCard {
  label: string;
  value: number | string;
  color: string;
  href?: string;
}

async function getStats() {
  const supabase = await createClient();

  const [{ count: totalProducts }, { count: totalJobs }, { data: statusCounts }, { data: recentJobs }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("import_jobs").select("*", { count: "exact", head: true }),
      supabase.from("import_jobs").select("status"),
      supabase
        .from("import_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const jobsByStatus = (statusCounts ?? []).reduce(
    (acc: Record<string, number>, row: { status: string }) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return {
    totalProducts: totalProducts ?? 0,
    totalJobs: totalJobs ?? 0,
    jobsByStatus,
    recentJobs: recentJobs ?? [],
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards: StatCard[] = [
    {
      label: "Produtos no Catálogo",
      value: stats.totalProducts,
      color: "text-blue-400",
      href: "/admin/produtos",
    },
    {
      label: "Importações Totais",
      value: stats.totalJobs,
      color: "text-purple-400",
      href: "/admin/importacoes",
    },
    {
      label: "Importações Concluídas",
      value: stats.jobsByStatus["concluido"] ?? 0,
      color: "text-green-400",
    },
    {
      label: "Com Erro",
      value: stats.jobsByStatus["erro"] ?? 0,
      color: "text-red-400",
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Dashboard" subtitle="Visão geral do sistema" />

      <div className="p-6 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5"
            >
              {card.href ? (
                <Link href={card.href} className="block hover:opacity-80">
                  <p className="text-gray-500 text-sm">{card.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${card.color}`}>
                    {card.value}
                  </p>
                </Link>
              ) : (
                <>
                  <p className="text-gray-500 text-sm">{card.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${card.color}`}>
                    {card.value}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Recent imports */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="text-white font-medium">Importações Recentes</h2>
            <Link href="/admin/importacoes" className="text-blue-400 text-sm hover:text-blue-300">
              Ver todas →
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {stats.recentJobs.length === 0 ? (
              <p className="text-gray-500 text-sm px-5 py-6 text-center">
                Nenhuma importação ainda
              </p>
            ) : (
              stats.recentJobs.map((job: Record<string, unknown>) => (
                <Link
                  key={String(job.id)}
                  href={`/admin/importacoes/${job.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/40 transition-colors"
                >
                  <div>
                    <p className="text-gray-200 text-sm font-medium">
                      {String(job.nome_arquivo)}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {String(job.tipo_arquivo).toUpperCase()} · {String(job.total_itens ?? 0)} itens
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      job.status === "concluido"
                        ? "bg-green-900/40 text-green-400"
                        : job.status === "processando"
                        ? "bg-blue-900/40 text-blue-400"
                        : job.status === "erro"
                        ? "bg-red-900/40 text-red-400"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {String(job.status)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
