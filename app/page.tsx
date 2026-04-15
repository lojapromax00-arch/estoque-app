import { createClient } from "@/lib/supabase/server";
import { SupabaseStatus } from "@/components/SupabaseStatus";

export default async function HomePage() {
  const supabase = await createClient();

  // Health-check: simple query that works even with empty database
  const { error } = await supabase.from("_health_check").select("*").limit(1);

  // A "relation does not exist" error still means the connection is alive
  const isConnected = !error || error.code === "42P01";

  const env = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
    : "não configurado";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 gap-8">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Estoque App</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Plataforma de gerenciamento de estoque
          </p>
        </div>

        {/* Supabase connection status */}
        <SupabaseStatus isConnected={isConnected} host={env} error={error?.message} />

        {/* Stack info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
          {[
            { label: "Framework", value: "Next.js 15" },
            { label: "UI", value: "Tailwind CSS" },
            { label: "Banco", value: "Supabase Postgres" },
            { label: "Auth", value: "Supabase Auth" },
            { label: "Deploy", value: "Vercel" },
            { label: "Linguagem", value: "TypeScript" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 text-sm"
            >
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                {label}
              </p>
              <p className="font-medium mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Environment badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            {process.env.VERCEL_ENV ?? "development"}
          </span>
        </div>
      </div>
    </main>
  );
}
