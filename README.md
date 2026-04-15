# Estoque App

Plataforma de gerenciamento de estoque construída com Next.js 15, Supabase e Vercel.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS |
| Banco de dados | Supabase Postgres |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Deploy | Vercel |
| CI/CD | GitHub Actions |

---

## Setup Local

### 1. Pré-requisitos

- Node.js 20+
- npm 10+
- Conta no [Supabase](https://supabase.com)
- Conta no [Vercel](https://vercel.com) (opcional para dev local)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (opcional para migrations locais)

### 2. Clonar e instalar

```bash
git clone https://github.com/SEU_USUARIO/estoque-app.git
cd estoque-app
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com suas credenciais:

| Variável | Onde encontrar |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Project Settings > API (service_role) |
| `SUPABASE_PROJECT_ID` | Supabase Dashboard > Project Settings > General |
| `VERCEL_PROJECT_ID` | Vercel Dashboard > Settings > General |
| `VERCEL_ORG_ID` | Vercel Dashboard > Settings > General |
| `VERCEL_TOKEN` | Vercel Dashboard > Account Settings > Tokens |
| `SUPABASE_ACCESS_TOKEN` | supabase.com/dashboard/account/tokens |

### 4. Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Comandos disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Verificar ESLint
npm run lint:fix     # Corrigir ESLint automaticamente
npm run typecheck    # Verificar TypeScript
npm run format       # Formatar código com Prettier
npm run format:check # Verificar formatação
npm run test         # Rodar testes
npm run test:watch   # Rodar testes em modo watch
npm run test:coverage # Rodar testes com cobertura
npm run supabase:types # Regenerar tipos TypeScript do Supabase
```

---

## Migrations de banco de dados

### Criar nova migration

```bash
npx ts-node scripts/new-migration.ts nome_da_migration
```

Isso cria um arquivo em `supabase/migrations/YYYYMMDDHHMMSS_nome_da_migration.sql`.

### Aplicar migrations manualmente

```bash
supabase link --project-ref $SUPABASE_PROJECT_ID
supabase db push
```

### Regenerar tipos TypeScript

Após alterar o schema no banco:

```bash
npm run supabase:types
```

---

## Estrutura do projeto

```
estoque-app/
├── .github/
│   └── workflows/
│       ├── ci.yml           # Lint, build e testes em PRs
│       ├── supabase.yml     # Apply migrations em push para main
│       └── preview.yml      # Status de preview para PRs
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage (status de conexão)
│   └── globals.css          # Estilos globais
├── components/
│   └── SupabaseStatus.tsx   # Componente de status de conexão
├── hooks/
│   ├── useSupabase.ts       # Hook para cliente browser
│   └── useUser.ts           # Hook para usuário autenticado
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Cliente browser (componentes client)
│   │   ├── server.ts        # Cliente server (Server Components)
│   │   ├── admin.ts         # Cliente admin (service role — server only)
│   │   └── middleware.ts    # Atualização de sessão no middleware
│   ├── env.ts               # Acesso centralizado a env vars
│   ├── logger.ts            # Logger estruturado
│   └── utils.ts             # Utilitários gerais
├── services/
│   └── auth.ts              # Helpers de autenticação server-side
├── types/
│   ├── database.generated.ts # Tipos gerados pelo Supabase CLI
│   └── index.ts             # Tipos da aplicação
├── supabase/
│   ├── config.toml          # Configuração do CLI local
│   └── migrations/          # Migrations versionadas
├── scripts/
│   ├── check-env.ts         # Valida env vars
│   └── new-migration.ts     # Cria nova migration
├── middleware.ts             # Middleware do Next.js (refresh de sessão)
├── .env.local.example        # Template de env vars
└── README.md
```

---

## Deploy

### Staging / Production (Vercel + GitHub)

1. Conecte o repositório GitHub ao Vercel.
2. Configure as environment variables no Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Cada push para `main` dispara um deploy automático.
4. Cada Pull Request gera uma URL de preview automática.

### Migrations em produção

As migrations são aplicadas automaticamente pelo workflow `supabase.yml` em pushes para `main` que alteram arquivos em `supabase/migrations/`.

**Secrets necessários no GitHub** (Settings > Secrets and variables > Actions):

| Secret | Descrição |
|--------|-----------|
| `SUPABASE_ACCESS_TOKEN` | Token da CLI do Supabase |
| `SUPABASE_PROJECT_ID` | ID do projeto no Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon pública |

---

## Ambientes

| Ambiente | Branch | Deploy |
|----------|--------|--------|
| Local | qualquer | `npm run dev` |
| Preview/Staging | pull requests | Vercel (automático) |
| Production | `main` | Vercel (automático) |

---

## Segurança

- Nunca commite `.env.local` ou qualquer arquivo com secrets.
- `SUPABASE_SERVICE_ROLE_KEY` é server-only — nunca use em componentes client.
- Use RLS (Row Level Security) no Supabase para todas as tabelas.
- Valide todos os inputs no servidor.

---

## Adicionar novas funcionalidades

Ao implementar algo novo, siga esta checklist:

- [ ] Criar migration se houver alteração no banco
- [ ] Atualizar tipos com `npm run supabase:types`
- [ ] Adicionar tratamento de erro, loading e logs
- [ ] Garantir que secrets não estão no cliente
- [ ] Rodar `npm run lint && npm run typecheck && npm run build` antes de commitar
- [ ] Atualizar este README se necessário
