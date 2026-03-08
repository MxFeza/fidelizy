create table push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  card_id uuid references loyalty_cards(id) on delete cascade not null,
  business_id uuid references businesses(id) on delete cascade not null,
  subscription jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(card_id, subscription->>'endpoint')
);

-- RLS : service role uniquement (pas d'acces client direct)
alter table push_subscriptions enable row level security;
