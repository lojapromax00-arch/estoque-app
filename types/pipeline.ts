/**
 * Types for the import pipeline.
 */

export type RawRow = Record<string, string | number | null>;

export interface ParsedItem {
  rowIndex: number;
  raw: RawRow;
  nome?: string;
  sku?: string;
  codigoOrigem?: string;
  marca?: string;
  volume?: string;
  variacao?: string;
  linha?: string;
  estoque?: number;
  custo?: number;
  precoVenda?: number;
}

export interface NormalizedItem extends ParsedItem {
  nomePadronizado: string;
}

export interface DedupResult {
  isDuplicate: boolean;
  score: number;
  motivo: string;
  candidateProductId?: string;
  detalhes: Record<string, unknown>;
}

export interface ReviewResult {
  status: "aprovado_automaticamente" | "bloqueado_por_duvida" | "erro_tecnico";
  motivoBloqueio?: string;
}

export interface PipelineItemResult {
  item: NormalizedItem;
  dedup: DedupResult;
  review: ReviewResult;
}

export type ImportJobType = "csv" | "excel" | "pdf";
export type ImportJobStatus = "pendente" | "processando" | "concluido" | "erro";
export type ItemStatus =
  | "pendente"
  | "processando"
  | "aprovado_automaticamente"
  | "bloqueado_por_duvida"
  | "erro_tecnico"
  | "sincronizado_tray";

// DB row shapes (for use in UI / API)
export interface ImportJob {
  id: string;
  nome_arquivo: string;
  tipo_arquivo: ImportJobType;
  storage_path?: string;
  status: ImportJobStatus;
  total_itens: number;
  itens_aprovados: number;
  itens_bloqueados: number;
  itens_erro: number;
  erro_mensagem?: string;
  iniciado_em?: string;
  concluido_em?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportJobItem {
  id: string;
  import_job_id: string;
  linha_original: RawRow;
  numero_linha?: number;
  sku_interno?: string;
  codigo_origem?: string;
  nome_original?: string;
  nome_padronizado?: string;
  marca?: string;
  linha?: string;
  variacao?: string;
  volume?: string;
  estoque?: number;
  custo?: number;
  preco_venda?: number;
  status_processamento: ItemStatus;
  score_duplicidade: number;
  motivo_bloqueio?: string;
  produto_id?: string;
  tray_product_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  nome: string;
  sku?: string;
  sku_interno?: string;
  codigo_origem?: string;
  nome_original?: string;
  nome_padronizado?: string;
  marca?: string;
  linha?: string;
  variacao?: string;
  volume?: string;
  estoque: number;
  custo?: number;
  preco_venda?: number;
  tray_product_id?: string;
  imagem_url?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DuplicateCheck {
  id: string;
  import_job_item_id: string;
  produto_candidato_id?: string;
  score: number;
  motivo: string;
  detalhes: Record<string, unknown>;
  created_at: string;
}

export interface TraySyncLog {
  id: string;
  import_job_item_id?: string;
  product_id?: string;
  acao: "criar" | "atualizar" | "erro";
  tray_product_id?: string;
  request_payload?: Record<string, unknown>;
  response_payload?: Record<string, unknown>;
  status_code?: number;
  erro_mensagem?: string;
  created_at: string;
}
