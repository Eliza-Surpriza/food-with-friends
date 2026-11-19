-- Initial reviewed menu catalog schema.
-- Public users can read published records; catalog writes remain maintainer-only.

create table public.restaurant_chains (
  id text primary key,
  name text not null,
  record_status text not null default 'draft'
    check (record_status in ('draft', 'reviewed', 'published', 'needs_review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurant_locations (
  id text primary key,
  chain_id text not null references public.restaurant_chains(id) on delete cascade,
  city text not null check (length(trim(city)) > 0),
  location_name text,
  address text,
  record_status text not null default 'draft'
    check (record_status in ('draft', 'reviewed', 'published', 'needs_review')),
  unique (id, chain_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catalog_sources (
  id text primary key,
  chain_id text not null references public.restaurant_chains(id) on delete cascade,
  location_id text,
  url text not null check (url ~ '^https://'),
  source_type text not null check (source_type in (
    'official_menu',
    'official_nutrition_allergen_information',
    'official_restaurant_page',
    'third_party',
    'other'
  )),
  publisher text,
  title text,
  last_checked_on date,
  source_status text not null default 'available'
    check (source_status in ('available', 'changed', 'unavailable', 'failed')),
  record_status text not null default 'draft'
    check (record_status in ('draft', 'reviewed', 'published', 'needs_review')),
  notes text,
  foreign key (location_id, chain_id)
    references public.restaurant_locations(id, chain_id) on delete cascade,
  unique (id, chain_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_items (
  id text primary key,
  chain_id text not null references public.restaurant_chains(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  category text,
  serving_role text not null default 'unknown'
    check (serving_role in ('full_meal', 'side', 'snack', 'drink', 'unknown')),
  serving_role_basis text,
  price text,
  image_url text check (image_url is null or image_url ~ '^https://'),
  ingredient_disclosure text not null default 'unknown'
    check (ingredient_disclosure in (
      'complete_ingredient_list',
      'description_only',
      'not_stated',
      'unknown'
    )),
  availability_note text,
  review_status text not null default 'draft'
    check (review_status in ('draft', 'reviewed', 'needs_review')),
  record_status text not null default 'draft'
    check (record_status in ('draft', 'reviewed', 'published', 'needs_review')),
  check (record_status <> 'published' or review_status = 'reviewed'),
  unique (id, chain_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_item_locations (
  menu_item_id text not null references public.menu_items(id) on delete cascade,
  location_id text not null references public.restaurant_locations(id) on delete cascade,
  availability_status text not null default 'unknown'
    check (availability_status in ('available', 'unknown')),
  record_status text not null default 'draft'
    check (record_status in ('draft', 'reviewed', 'published', 'needs_review')),
  primary key (menu_item_id, location_id)
);

create table public.catalog_evidence (
  id text primary key,
  source_id text not null references public.catalog_sources(id) on delete cascade,
  excerpt text,
  source_location text,
  excerpt_unavailable boolean not null default false,
  record_status text not null default 'draft'
    check (record_status in ('draft', 'reviewed', 'published', 'needs_review')),
  check (excerpt is not null or excerpt_unavailable),
  created_at timestamptz not null default now()
);

create table public.menu_facts (
  id text primary key,
  chain_id text not null references public.restaurant_chains(id) on delete cascade,
  menu_item_id text,
  location_id text,
  fact_type text not null check (fact_type in (
    'ingredient', 'allergen', 'preparation', 'customization', 'serving_role', 'other'
  )),
  subject text not null,
  statement text not null,
  claim_status text not null check (claim_status in (
    'contains', 'stated', 'unknown', 'unclear', 'conflicting'
  )),
  ingredient_evidence_type text check (ingredient_evidence_type is null or ingredient_evidence_type in (
    'ingredient_list', 'menu_description', 'other_source', 'unknown'
  )),
  attribution text not null check (attribution in ('restaurant', 'third_party', 'maintainer_interpretation')),
  review_status text not null default 'draft'
    check (review_status in ('draft', 'reviewed', 'needs_review')),
  record_status text not null default 'draft'
    check (record_status in ('draft', 'reviewed', 'published', 'needs_review')),
  uncertainty_notes text,
  check (fact_type <> 'allergen' or claim_status <> 'stated'),
  check (record_status <> 'published' or review_status = 'reviewed'),
  foreign key (menu_item_id, chain_id)
    references public.menu_items(id, chain_id) on delete cascade,
  foreign key (location_id, chain_id)
    references public.restaurant_locations(id, chain_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_fact_evidence (
  fact_id text not null references public.menu_facts(id) on delete cascade,
  evidence_id text not null references public.catalog_evidence(id) on delete cascade,
  primary key (fact_id, evidence_id)
);

create index restaurant_locations_chain_city_idx
  on public.restaurant_locations(chain_id, city);
create index catalog_sources_chain_idx on public.catalog_sources(chain_id);
create index menu_items_chain_idx on public.menu_items(chain_id);
create index menu_facts_chain_item_idx on public.menu_facts(chain_id, menu_item_id);
create index catalog_evidence_source_idx on public.catalog_evidence(source_id);

alter table public.restaurant_chains enable row level security;
alter table public.restaurant_locations enable row level security;
alter table public.catalog_sources enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_item_locations enable row level security;
alter table public.catalog_evidence enable row level security;
alter table public.menu_facts enable row level security;
alter table public.menu_fact_evidence enable row level security;

grant select on
  public.restaurant_chains,
  public.restaurant_locations,
  public.catalog_sources,
  public.menu_items,
  public.menu_item_locations,
  public.catalog_evidence,
  public.menu_facts,
  public.menu_fact_evidence
to anon, authenticated;

create policy "public read published chains"
  on public.restaurant_chains for select to anon, authenticated
  using (record_status = 'published');

create policy "public read published locations"
  on public.restaurant_locations for select to anon, authenticated
  using (record_status = 'published' and exists (
    select 1 from public.restaurant_chains c
    where c.id = chain_id and c.record_status = 'published'
  ));

create policy "public read published sources"
  on public.catalog_sources for select to anon, authenticated
  using (record_status = 'published' and exists (
    select 1 from public.restaurant_chains c
    where c.id = chain_id and c.record_status = 'published'
  ));

create policy "public read published menu items"
  on public.menu_items for select to anon, authenticated
  using (record_status = 'published' and exists (
    select 1 from public.restaurant_chains c
    where c.id = chain_id and c.record_status = 'published'
  ));

create policy "public read published item locations"
  on public.menu_item_locations for select to anon, authenticated
  using (record_status = 'published' and exists (
    select 1 from public.menu_items m
    join public.restaurant_chains c on c.id = m.chain_id
    join public.restaurant_locations l on l.chain_id = c.id
    where m.id = menu_item_id and l.id = location_id
      and m.record_status = 'published' and c.record_status = 'published'
      and l.record_status = 'published'
  ));

create policy "public read published evidence"
  on public.catalog_evidence for select to anon, authenticated
  using (record_status = 'published' and exists (
    select 1 from public.catalog_sources s
    join public.restaurant_chains c on c.id = s.chain_id
    where s.id = source_id and s.record_status = 'published'
      and c.record_status = 'published'
  ));

create policy "public read published facts"
  on public.menu_facts for select to anon, authenticated
  using (record_status = 'published' and exists (
    select 1 from public.restaurant_chains c
    where c.id = chain_id and c.record_status = 'published'
  ));

create policy "public read published fact evidence links"
  on public.menu_fact_evidence for select to anon, authenticated
  using (exists (
    select 1 from public.menu_facts f
    join public.catalog_evidence e on e.id = evidence_id
    where f.id = fact_id and f.record_status = 'published'
      and e.record_status = 'published'
  ));
