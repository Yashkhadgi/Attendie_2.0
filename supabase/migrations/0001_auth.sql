create table if not exists people (
  login_id    text primary key,
  eklink_sub  uuid unique,
  name        text not null,
  email       text not null,
  eklink_role text not null,
  department  text, batch text, section text,
  updated_at  timestamptz not null default now()
);

create table if not exists app_roles (
  login_id   text not null references people(login_id),
  app_role   text not null check (app_role in ('organiser','admin','viewer')),
  granted_by text,
  created_at timestamptz not null default now(),
  primary key (login_id, app_role)
);

alter table people     enable row level security;
alter table app_roles  enable row level security;
-- No policies on purpose. Only the server key (SUPABASE_SECRET_KEY) reads or writes.
-- Do the same (enable RLS, no policies) for every table you add later.
