-- Add external_id to transactions for Open Finance deduplication
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_external
  ON public.transactions(user_id, external_id)
  WHERE external_id IS NOT NULL;

-- ============================================
-- PLUGGY CONNECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.pluggy_connections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  pluggy_item_id text NOT NULL,
  institution_name text NOT NULL,
  institution_primary_color text,
  status text NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected', 'updating', 'error', 'outdated')),
  last_synced_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, pluggy_item_id)
);

CREATE INDEX IF NOT EXISTS idx_pluggy_connections_user_id
  ON public.pluggy_connections(user_id);

ALTER TABLE public.pluggy_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pluggy connections"
  ON public.pluggy_connections FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- PLUGGY ACCOUNTS (linked bank accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.pluggy_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id uuid REFERENCES public.pluggy_connections ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  pluggy_account_id text NOT NULL UNIQUE,
  kaivo_account_id uuid REFERENCES public.accounts,
  name text NOT NULL,
  type text NOT NULL,
  balance numeric(15,2),
  currency_code text NOT NULL DEFAULT 'BRL',
  number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pluggy_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pluggy accounts"
  ON public.pluggy_accounts FOR ALL USING (auth.uid() = user_id);
