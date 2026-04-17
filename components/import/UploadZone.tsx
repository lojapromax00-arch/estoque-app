"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

interface UploadZoneProps {
  onUploadComplete: (jobId: string) => void;
}

const ACCEPTED = ".csv,.xls,.xlsx,.pdf";
const MAX_MB = 10;

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFile(file: File): string | null {
    if (file.size > MAX_MB * 1024 * 1024) return `Arquivo muito grande (máx ${MAX_MB} MB)`;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xls", "xlsx", "pdf"].includes(ext ?? ""))
      return "Tipo não suportado. Use CSV, Excel ou PDF.";
    return null;
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setSelectedFile(file);
    setError(null);
    setSuccess(null);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setSelectedFile(file);
    setError(null);
    setSuccess(null);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/import/upload", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as { data: { jobId: string } | null; error: string | null };

      if (!res.ok || json.error) {
        setError(json.error ?? "Falha no upload");
        return;
      }

      const jobId = json.data!.jobId;
      setSuccess(`Importação iniciada! Job ID: ${jobId.slice(0, 8)}...`);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onUploadComplete(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          isDragging
            ? "border-blue-500 bg-blue-950/30"
            : "border-gray-700 hover:border-gray-500 bg-gray-900/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={handleChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {selectedFile ? (
            <div>
              <p className="text-white font-medium">{selectedFile.name}</p>
              <p className="text-gray-400 text-sm">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-300 font-medium">
                Arraste um arquivo ou clique para selecionar
              </p>
              <p className="text-gray-500 text-sm mt-1">
                CSV, Excel (.xls/.xlsx) ou PDF · Máx {MAX_MB} MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error/success messages */}
      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-400 text-sm bg-green-900/20 border border-green-800 rounded-lg px-4 py-2">
          {success}
        </p>
      )}

      {/* Upload button */}
      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {uploading ? (
            <>
              <Spinner size="sm" />
              Enviando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Iniciar Importação
            </>
          )}
        </button>
      )}
    </div>
  );
}
