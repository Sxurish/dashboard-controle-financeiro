# Kaivo — by HSB Company

Dashboard financeiro completo construído com Next.js 14, Supabase e Tailwind CSS. Gerencie receitas, despesas, metas e muito mais com uma interface moderna e responsiva.

---

## Funcionalidades

- **Autenticação** — Email/senha + Google OAuth, recuperação de senha, proteção de rotas
- **Dashboard** — KPIs do mês, comparativo com mês anterior, gráficos de receitas × despesas, alertas financeiros
- **Lançamentos** — CRUD completo, parcelamentos, filtros avançados, exportação CSV
- **Contas** — Banco, dinheiro, conta digital, poupança, investimento
- **Cartões de Crédito** — Limite, fatura, faturas mensais, uso percentual
- **Categorias** — Personalizadas com cor e ícone, categorias padrão do sistema
- **Recorrências** — Geração automática ou manual de lançamentos periódicos
- **Metas** — Progresso visual, prazo, adicionar valores
- **Relatórios** — Gráficos anuais, por categoria, exportação CSV
- **Dark Mode** — Modo claro/escuro/sistema

---

## Stack

| Tecnologia | Uso |
|---|---|
| [Next.js 16](https://nextjs.org) | App Router, SSR, proxy middleware |
| [TypeScript](https://typescriptlang.org) | Tipagem estática |
| [Tailwind CSS v4](https://tailwindcss.com) | Estilização |
| [Supabase](https://supabase.com) | Auth, PostgreSQL, RLS |
| [Recharts](https://recharts.org) | Gráficos |
| [Shadcn/ui](https://ui.shadcn.com) | Componentes UI |
| [React Hook Form](https://react-hook-form.com) | Formulários |
| [Zod](https://zod.dev) | Validação |
| [Sonner](https://sonner.emilkowal.ski) | Notificações toast |

---

## Configuração

### 1. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha com os dados do seu projeto Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 2. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** no painel do Supabase
3. Execute o conteúdo completo de `supabase/migrations/001_initial_schema.sql`

Isso criará todas as tabelas, índices, triggers automáticos de `updated_at`, políticas RLS e as 16 categorias padrão do sistema.

**Habilitar Google OAuth (opcional):**
1. No Supabase → **Authentication → Providers → Google**
2. Configure as credenciais OAuth no [Google Cloud Console](https://console.cloud.google.com)
3. Adicione `https://seu-projeto.supabase.co/auth/v1/callback` como URI de redirecionamento autorizado

### 3. Rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Deploy na Vercel

1. Faça push para o GitHub
2. Importe o repositório na [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente no painel da Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy automático a cada push na branch principal

> **Importante:** No Supabase, adicione o domínio da Vercel em **Authentication → URL Configuration → Site URL** e **Redirect URLs**.

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/              # Login, Register, Forgot Password
│   │   └── auth/callback/   # OAuth callback handler
│   └── (dashboard)/         # Páginas protegidas
│       └── dashboard/
│           ├── page.tsx         # Dashboard principal
│           ├── transactions/    # Lançamentos
│           ├── accounts/        # Contas
│           ├── credit-cards/    # Cartões de crédito
│           ├── categories/      # Categorias
│           ├── recurring/       # Recorrências
│           ├── goals/           # Metas
│           ├── reports/         # Relatórios
│           └── settings/        # Configurações
├── components/
│   ├── ui/               # Primitivos (Button, Card, Dialog, Select…)
│   ├── dashboard/        # KPI cards, gráficos, alertas
│   ├── transactions/     # Formulário e filtros
│   ├── layout/           # Sidebar, Header
│   └── shared/           # PageHeader, EmptyState, LoadingSpinner, Auth forms
├── hooks/                # useTransactions, useAccounts, useCategories, useGoals
├── services/             # CRUD por entidade (chamadas Supabase)
├── schemas/              # Validações Zod
├── types/                # database.ts, app.ts
└── utils/                # currency.ts, date.ts
supabase/
└── migrations/
    └── 001_initial_schema.sql
```

---

## Banco de Dados

| Tabela | Descrição |
|---|---|
| `profiles` | Perfil do usuário (auto-criado no cadastro) |
| `accounts` | Contas financeiras |
| `categories` | Categorias (sistema + personalizadas) |
| `transactions` | Lançamentos financeiros |
| `installment_groups` | Grupos de parcelamento |
| `recurring_rules` | Regras de recorrência |
| `credit_cards` | Cartões de crédito |
| `credit_card_invoices` | Faturas mensais |
| `goals` | Metas financeiras |
| `settings` | Configurações por usuário |

Todas as tabelas possuem **Row Level Security (RLS)** — cada usuário acessa somente seus próprios dados.

---

## Segurança

- Row Level Security em todas as tabelas
- Validação Zod no frontend
- Proxy middleware de proteção de rotas
- Variáveis sensíveis nunca expostas no cliente
- Soft delete em lançamentos (histórico preservado)
- Sanitização via Supabase client (prevenção de SQL injection)

---

## Licença

MIT
