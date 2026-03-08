alter table push_subscriptions
add column if not exists last_push_sent_at timestamptz;
