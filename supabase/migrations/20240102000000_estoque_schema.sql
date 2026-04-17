-- Extend existing products table with estoque-app columns
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku_interno TEXT,
  ADD COLUMN IF NOT EXISTS codigo_origem TEXT,
  ADD COLUMN IF NOT EXISTS nome_original TEXT,
  ADD COLUMN IF NOT EXISTS nome_padronizado TEXT,
  ADD COLUMN IF NOT EXISTS marca TEXT,
  ADD COLUMN IF NOT EXISTS linha TEXT,
  ADD COLUMN IF NOT EXISTS variacao TEXT,
  ADD COLUMN IF NOT EXISTS volume TEXT,
  ADD COLUMN IF NOT EXISTS custo NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS preco_venda NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS tray_product_id TEXT,
  ADD COLUMN IF NOT EXISTS imagem_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_interno ON public.products(sku_interno)
  WHERE sku_interno IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_codigo_origem ON public.products(codigo_origem)
  WHERE codigo_origem IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_nome_padronizado ON public.products(nome_padronizado)
  WHERE nome_padronizado IS NOT NULL;

-- Import Jobs
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT NOT NULL CHECK (tipo_arquivo IN ('csv', 'excel', 'pdf')),
  storage_path TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'erro')),
  total_itens INTEGER DEFAULT 0,
  itens_aprovados INTEGER DEFAULT 0,
  itens_bloqueados INTEGER DEFAULT 0,
  itens_erro INTEGER DEFAULT 0,
  erro_mensagem TEXT,
  iniciado_em TIMESTAMPTZ,
  concluido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import Job Items
CREATE TABLE IF NOT EXISTS public.import_job_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_job_id UUID REFERENCES public.import_jobs(id) ON DELETE CASCADE NOT NULL,
  linha_original JSONB NOT NULL DEFAULT '{}',
  numero_linha INTEGER,
  sku_interno TEXT,
  codigo_origem TEXT,
  nome_original TEXT,
  nome_padronizado TEXT,
  marca TEXT,
  linha TEXT,
  variacao TEXT,
  volume TEXT,
  estoque INTEGER,
  custo NUMERIC(12,2),
  preco_venda NUMERIC(12,2),
  status_processamento TEXT DEFAULT 'pendente' CHECK (
    status_processamento IN (
      'pendente','processando','aprovado_automaticamente',
      'bloqueado_por_duvida','erro_tecnico','sincronizado_tray'
    )
  ),
  score_duplicidade NUMERIC(5,2) DEFAULT 0,
  motivo_bloqueio TEXT,
  produto_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  tray_product_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Items
CREATE TABLE IF NOT EXISTS public.supplier_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_job_item_id UUID REFERENCES public.import_job_items(id) ON DELETE SET NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  sku_interno TEXT,
  codigo_origem TEXT,
  nome_original TEXT NOT NULL,
  nome_padronizado TEXT NOT NULL,
  marca TEXT,
  variacao TEXT,
  volume TEXT,
  estoque INTEGER DEFAULT 0,
  custo NUMERIC(12,2),
  preco_venda NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Duplicate Checks
CREATE TABLE IF NOT EXISTS public.duplicate_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_job_item_id UUID REFERENCES public.import_job_items(id) ON DELETE CASCADE NOT NULL,
  produto_candidato_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL,
  motivo TEXT NOT NULL,
  detalhes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tray Sync Logs
CREATE TABLE IF NOT EXISTS public.tray_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_job_item_id UUID REFERENCES public.import_job_items(id) ON DELETE SET NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  acao TEXT NOT NULL CHECK (acao IN ('criar', 'atualizar', 'erro')),
  tray_product_id TEXT,
  request_payload JSONB,
  response_payload JSONB,
  status_code INTEGER,
  erro_mensagem TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created ON public.import_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_job_items_job ON public.import_job_items(import_job_id);
CREATE INDEX IF NOT EXISTS idx_import_job_items_status ON public.import_job_items(status_processamento);
CREATE INDEX IF NOT EXISTS idx_duplicate_checks_item ON public.duplicate_checks(import_job_item_id);
CREATE INDEX IF NOT EXISTS idx_tray_sync_logs_item ON public.tray_sync_logs(import_job_item_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER import_jobs_updated_at BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER import_job_items_updated_at BEFORE UPDATE ON public.import_job_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
