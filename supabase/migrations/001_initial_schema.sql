-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  currency varchar(3) not null default 'BRL',
  locale varchar(10) not null default 'pt-BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  -- Create default settings
  insert into public.settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- SETTINGS
-- ============================================
create table if not exists public.settings (
  user_id uuid references public.profiles on delete cascade not null primary key,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  start_day_of_month integer not null default 1 check (start_day_of_month between 1 and 28),
  default_account_id uuid,
  notifications_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "Users can manage own settings"
  on public.settings for all using (auth.uid() = user_id);

-- ============================================
-- ACCOUNTS
-- ============================================
create table if not exists public.accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade not null,
  name text not null,
  type text not null check (type in ('bank', 'cash', 'digital', 'savings', 'investment', 'credit')),
  balance numeric(15, 2) not null default 0,
  color varchar(7),
  icon varchar(50),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_accounts_user_id on public.accounts(user_id);

alter table public.accounts enable row level security;

create policy "Users can manage own accounts"
  on public.accounts for all using (auth.uid() = user_id);

-- ============================================
-- CATEGORIES
-- ============================================
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color varchar(7) not null default '#6b7280',
  icon varchar(50) not null default 'tag',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_categories_user_id on public.categories(user_id);

alter table public.categories enable row level security;

-- Users can see system categories (user_id IS NULL) and their own
create policy "Users can view categories"
  on public.categories for select
  using (user_id is null or auth.uid() = user_id);

create policy "Users can manage own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Default system categories
insert into public.categories (user_id, name, type, color, icon) values
  (null, 'Salário', 'income', '#22c55e', 'briefcase'),
  (null, 'Freelance', 'income', '#10b981', 'laptop'),
  (null, 'Investimentos', 'income', '#3b82f6', 'trending-up'),
  (null, 'Vendas', 'income', '#8b5cf6', 'shopping-bag'),
  (null, 'Outros (Receita)', 'income', '#6b7280', 'plus-circle'),
  (null, 'Alimentação', 'expense', '#f97316', 'utensils'),
  (null, 'Transporte', 'expense', '#eab308', 'car'),
  (null, 'Moradia', 'expense', '#ef4444', 'home'),
  (null, 'Saúde', 'expense', '#ec4899', 'heart'),
  (null, 'Educação', 'expense', '#6366f1', 'book-open'),
  (null, 'Lazer', 'expense', '#f59e0b', 'gamepad-2'),
  (null, 'Assinaturas', 'expense', '#8b5cf6', 'repeat'),
  (null, 'Roupas', 'expense', '#06b6d4', 'shirt'),
  (null, 'Tecnologia', 'expense', '#64748b', 'smartphone'),
  (null, 'Pets', 'expense', '#d97706', 'paw-print'),
  (null, 'Outros (Despesa)', 'expense', '#6b7280', 'minus-circle');

-- ============================================
-- CREDIT CARDS
-- ============================================
create table if not exists public.credit_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade not null,
  name text not null,
  "limit" numeric(15, 2) not null default 0,
  closing_day integer not null check (closing_day between 1 and 31),
  due_day integer not null check (due_day between 1 and 31),
  color varchar(7),
  brand varchar(50),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_credit_cards_user_id on public.credit_cards(user_id);

alter table public.credit_cards enable row level security;

create policy "Users can manage own credit cards"
  on public.credit_cards for all using (auth.uid() = user_id);

-- ============================================
-- CREDIT CARD INVOICES
-- ============================================
create table if not exists public.credit_card_invoices (
  id uuid primary key default uuid_generate_v4(),
  credit_card_id uuid references public.credit_cards on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  reference_month date not null,
  total_amount numeric(15, 2) not null default 0,
  status text not null default 'open' check (status in ('open', 'closed', 'paid')),
  due_date date not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(credit_card_id, reference_month)
);

create index idx_invoices_credit_card_id on public.credit_card_invoices(credit_card_id);
create index idx_invoices_user_id on public.credit_card_invoices(user_id);

alter table public.credit_card_invoices enable row level security;

create policy "Users can manage own invoices"
  on public.credit_card_invoices for all using (auth.uid() = user_id);

-- ============================================
-- INSTALLMENT GROUPS
-- ============================================
create table if not exists public.installment_groups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade not null,
  description text not null,
  total_amount numeric(15, 2) not null,
  installment_count integer not null check (installment_count >= 2),
  created_at timestamptz not null default now()
);

create index idx_installment_groups_user_id on public.installment_groups(user_id);

alter table public.installment_groups enable row level security;

create policy "Users can manage own installment groups"
  on public.installment_groups for all using (auth.uid() = user_id);

-- ============================================
-- RECURRING RULES
-- ============================================
create table if not exists public.recurring_rules (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade not null,
  description text not null,
  amount numeric(15, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category_id uuid references public.categories,
  account_id uuid references public.accounts not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
  interval integer not null default 1 check (interval >= 1),
  start_date date not null,
  end_date date,
  day_of_month integer check (day_of_month between 1 and 31),
  last_generated date,
  is_active boolean not null default true,
  auto_generate boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_recurring_rules_user_id on public.recurring_rules(user_id);

alter table public.recurring_rules enable row level security;

create policy "Users can manage own recurring rules"
  on public.recurring_rules for all using (auth.uid() = user_id);

-- ============================================
-- TRANSACTIONS
-- ============================================
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade not null,
  description text not null,
  amount numeric(15, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense', 'transfer')),
  category_id uuid references public.categories,
  account_id uuid references public.accounts not null,
  credit_card_id uuid references public.credit_cards,
  installment_group_id uuid references public.installment_groups,
  installment_number integer,
  installment_total integer,
  recurring_rule_id uuid references public.recurring_rules,
  date date not null,
  due_date date,
  status text not null default 'paid' check (status in ('paid', 'pending', 'overdue')),
  payment_method text check (payment_method in ('pix', 'credit_card', 'debit_card', 'cash', 'bank_transfer', 'other')),
  notes text,
  transfer_account_id uuid references public.accounts,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_date on public.transactions(date);
create index idx_transactions_type on public.transactions(type);
create index idx_transactions_status on public.transactions(status);
create index idx_transactions_category_id on public.transactions(category_id);
create index idx_transactions_account_id on public.transactions(account_id);
create index idx_transactions_is_deleted on public.transactions(is_deleted);

alter table public.transactions enable row level security;

create policy "Users can manage own transactions"
  on public.transactions for all using (auth.uid() = user_id);

-- ============================================
-- GOALS
-- ============================================
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade not null,
  name text not null,
  description text,
  target_amount numeric(15, 2) not null check (target_amount > 0),
  current_amount numeric(15, 2) not null default 0 check (current_amount >= 0),
  deadline date,
  color varchar(7),
  icon varchar(50),
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_goals_user_id on public.goals(user_id);

alter table public.goals enable row level security;

create policy "Users can manage own goals"
  on public.goals for all using (auth.uid() = user_id);

-- ============================================
-- AUTO-UPDATE updated_at
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at_profiles
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_accounts
  before update on public.accounts
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_categories
  before update on public.categories
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_credit_cards
  before update on public.credit_cards
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_invoices
  before update on public.credit_card_invoices
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_recurring_rules
  before update on public.recurring_rules
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_transactions
  before update on public.transactions
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_goals
  before update on public.goals
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_settings
  before update on public.settings
  for each row execute procedure public.handle_updated_at();
