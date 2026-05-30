-- Subscriptions: tracks each user's Stripe subscription state.
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'free' check (
    status in ('free', 'active', 'trialing', 'past_due', 'canceled', 'incomplete')
  ),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

-- Users can read their own subscription. Writes happen only via the
-- webhook using the service role key (which bypasses RLS).
create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create index if not exists subscriptions_customer_idx
  on public.subscriptions (stripe_customer_id);
