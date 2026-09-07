-- Tenis trenér - databázové schéma
-- Spusťte celý tento soubor v Supabase: SQL Editor -> New query -> vložit -> Run

create extension if not exists "pgcrypto";

-- ============================================================
-- SVĚŘENCI
-- ============================================================
create table if not exists trainees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table trainees is 'Svěřenci (hráči), kteří se účastní tréninků.';

-- ============================================================
-- TRÉNINKOVÉ JEDNOTKY (skupiny/kroužky)
-- ============================================================
create table if not exists training_units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_hall numeric(10,2) not null default 0,
  price_outdoor numeric(10,2) not null default 0,
  payment_via_club boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table training_units is 'Tréninkové jednotky (skupiny) s výchozími cenami za trénink v hale/venku.';
comment on column training_units.price_hall is 'Celková částka za odtrénovanou jednotku v hale (rozpočítá se mezi účastníky).';
comment on column training_units.price_outdoor is 'Celková částka za odtrénovanou jednotku venku (rozpočítá se mezi účastníky).';
comment on column training_units.payment_via_club is 'Zda platba za tuto jednotku jde přes oddíl (true) nebo mimo oddíl (false).';

-- ============================================================
-- VÝCHOZÍ OBSAZENÍ JEDNOTKY (M:N) - kdo je standardně zařazen do jednotky
-- ============================================================
create table if not exists training_unit_trainees (
  training_unit_id uuid not null references training_units(id) on delete cascade,
  trainee_id uuid not null references trainees(id) on delete cascade,
  primary key (training_unit_id, trainee_id)
);

comment on table training_unit_trainees is 'Výchozí seznam svěřenců zařazených do tréninkové jednotky (svěřenec může být ve více jednotkách).';

-- ============================================================
-- ODTRÉNOVANÉ LEKCE (konkrétní termíny)
-- ============================================================
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  training_unit_id uuid not null references training_units(id) on delete restrict,
  session_date date not null,
  session_time time,
  location text not null check (location in ('hala', 'venku')),
  amount_total numeric(10,2) not null default 0,
  payment_via_club boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table sessions is 'Konkrétní odtrénovaná lekce (datum, čas, místo, celková částka).';
comment on column sessions.amount_total is 'Celková částka za tuto konkrétní lekci (převzato z jednotky, ale editovatelné).';
comment on column sessions.payment_via_club is 'Snapshot nastavení "platba přes oddíl" z jednotky v době uložení lekce.';

create index if not exists sessions_date_idx on sessions (session_date);
create index if not exists sessions_unit_idx on sessions (training_unit_id);

-- ============================================================
-- ÚČASTNÍCI KONKRÉTNÍ LEKCE + VYPOČTENÁ ČÁSTKA
-- ============================================================
create table if not exists session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  trainee_id uuid not null references trainees(id) on delete restrict,
  amount numeric(10,2) not null default 0,
  unique (session_id, trainee_id)
);

comment on table session_participants is 'Svěřenci účastnící se konkrétní lekce a jejich vypočtený podíl na platbě.';

create index if not exists session_participants_trainee_idx on session_participants (trainee_id);
create index if not exists session_participants_session_idx on session_participants (session_id);

-- trigger na updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sessions_set_updated_at on sessions;
create trigger sessions_set_updated_at
  before update on sessions
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Aplikace má jednoho přihlášeného uživatele (trenéra). Přístup do
-- administrace a editace mají pouze přihlášení uživatelé (Supabase Auth).
-- Export API používá "service_role" klíč, který RLS obchází.
-- ============================================================
alter table trainees enable row level security;
alter table training_units enable row level security;
alter table training_unit_trainees enable row level security;
alter table sessions enable row level security;
alter table session_participants enable row level security;

drop policy if exists "authenticated full access" on trainees;
create policy "authenticated full access" on trainees
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on training_units;
create policy "authenticated full access" on training_units
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on training_unit_trainees;
create policy "authenticated full access" on training_unit_trainees
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on sessions;
create policy "authenticated full access" on sessions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on session_participants;
create policy "authenticated full access" on session_participants
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- POHLED PRO EXPORT DO EXCELU (plochá tabulka pro kontingenční tabulku)
-- ============================================================
create or replace view export_attendance as
select
  sp.id as participant_row_id,
  t.id as trainee_id,
  t.full_name as trainee_name,
  s.id as session_id,
  s.session_date,
  extract(year from s.session_date)::int as year,
  extract(month from s.session_date)::int as month,
  to_char(s.session_date, 'YYYY-MM') as year_month,
  to_char(s.session_date, 'FMDD') as day,
  extract(day from s.session_date)::int as day_number,
  s.location,
  tu.id as training_unit_id,
  tu.name as training_unit_name,
  s.payment_via_club,
  sp.amount
from session_participants sp
join sessions s on s.id = sp.session_id
join trainees t on t.id = sp.trainee_id
join training_units tu on tu.id = s.training_unit_id
order by s.session_date, t.full_name;

comment on view export_attendance is 'Plochá tabulka pro export do Excelu / Power Query (podklad pro kontingenční tabulku).';
