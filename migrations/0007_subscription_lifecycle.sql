-- Dormant billing ledger. Only trusted server-side reconciliation may write it.
-- Existing manually granted plans are not silently converted into paid subscriptions.
create table if not exists billing_subscriptions (
  user_id text primary key references profiles(user_id) on delete cascade,
  provider_subscription_id text not null unique,
  provider_customer_id text not null unique,
  status text not null check (status in ('active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused','trialing')),
  paid_through_ms bigint not null check (paid_through_ms >= 0),
  verified_at_ms bigint not null check (verified_at_ms >= 0),
  cancel_at_period_end boolean not null default false
);
alter table billing_subscriptions enable row level security;

create table if not exists billing_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);
alter table billing_webhook_events enable row level security;
