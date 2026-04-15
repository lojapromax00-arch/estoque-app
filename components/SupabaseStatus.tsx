interface SupabaseStatusProps {
  isConnected: boolean;
  host: string;
  error?: string;
}

export function SupabaseStatus({ isConnected, host, error }: SupabaseStatusProps) {
  return (
    <div
      className={`rounded-xl border p-5 space-y-2 ${
        isConnected
          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
          : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-3 w-3 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <h2 className="font-semibold text-sm">
          Supabase:{" "}
          <span className={isConnected ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
            {isConnected ? "Conectado" : "Desconectado"}
          </span>
        </h2>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 pl-6">
        Host: <span className="font-mono">{host}</span>
      </p>

      {!isConnected && error && (
        <p className="text-xs text-red-600 dark:text-red-400 pl-6 font-mono">
          Erro: {error}
        </p>
      )}

      {isConnected && (
        <p className="text-xs text-green-700 dark:text-green-300 pl-6">
          Conexão com o banco de dados estabelecida com sucesso.
        </p>
      )}
    </div>
  );
}
