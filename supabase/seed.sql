-- Local development sample only. Every row stays draft until a maintainer
-- verifies the source details and location availability for publication.

insert into public.restaurant_chains (id, name, record_status)
values ('costa-vida-sample', 'Costa Vida', 'draft')
on conflict (id) do nothing;

insert into public.catalog_sources (
  id, chain_id, url, source_type, publisher, title, last_checked_on,
  source_status, record_status, notes
)
values
  (
    'costa-vida-menu', 'costa-vida-sample',
    'https://www.costavida.com/menu/', 'official_menu', 'Costa Vida',
    'Menu', '2026-11-18', 'available', 'draft',
    'Corporate source only; local Utah Valley availability has not been verified.'
  ),
  (
    'costa-vida-nutrition-allergens', 'costa-vida-sample',
    'https://www.costavida.com/nutrition-allergen-information/',
    'official_nutrition_allergen_information', 'Costa Vida',
    'Nutrition & Allergen Information', '2026-11-18', 'available', 'draft',
    'Item/component interpretation requires maintainer review.'
  )
on conflict (id) do nothing;

insert into public.menu_items (
  id, chain_id, name, description, category, serving_role,
  serving_role_basis, ingredient_disclosure, availability_note,
  review_status, record_status
)
values
  (
    'costa-vida-burrito-example', 'costa-vida-sample', 'Burrito',
    'The menu lists Burritos under Entrees and describes the offering as customizable; exact choices and local availability need review.',
    'Entrees', 'full_meal',
    'The corporate menu places Burritos under Entrees.',
    'description_only',
    'Corporate menu example; availability at individual Utah Valley locations is unverified.',
    'draft', 'draft'
  ),
  (
    'costa-vida-tortilla-chips-example', 'costa-vida-sample', 'Chips',
    'The menu lists Chips under Chips, Dips, & Sides and describes house-fried corn tortilla chips finished with salt and lime.',
    'Chips, Dips, & Sides', 'side',
    'The corporate menu places Chips under Chips, Dips, & Sides.',
    'description_only',
    'Corporate menu example; availability at individual Utah Valley locations is unverified.',
    'draft', 'draft'
  )
on conflict (id) do nothing;

insert into public.catalog_evidence (
  id, source_id, excerpt, source_location, excerpt_unavailable, record_status
)
values
  (
    'costa-vida-evidence-burrito-menu', 'costa-vida-menu', null,
    'Menu page > Entrees > Burritos', true, 'draft'
  ),
  (
    'costa-vida-evidence-chips-menu', 'costa-vida-menu', null,
    'Menu page > Chips, Dips, & Sides > Chips', true, 'draft'
  ),
  (
    'costa-vida-evidence-burrito-allergen-guide', 'costa-vida-nutrition-allergens', null,
    'Nutrition & Allergen Information > relevant components and preparation notes', true, 'draft'
  ),
  (
    'costa-vida-evidence-chips-allergen-guide', 'costa-vida-nutrition-allergens', null,
    'Nutrition & Allergen Information > Tortilla Chips row', true, 'draft'
  )
on conflict (id) do nothing;

insert into public.menu_facts (
  id, chain_id, menu_item_id, fact_type, subject, statement,
  claim_status, ingredient_evidence_type, attribution,
  review_status, record_status, uncertainty_notes
)
values
  (
    'costa-vida-fact-burrito-customizable', 'costa-vida-sample',
    'costa-vida-burrito-example', 'customization', 'customization',
    'The corporate menu describes Burritos as customizable; the exact available choices need review.',
    'stated', null, 'restaurant', 'draft', 'draft',
    'Development sample. Verify the current wording and options before publication.'
  ),
  (
    'costa-vida-fact-burrito-allergen-unknown', 'costa-vida-sample',
    'costa-vida-burrito-example', 'allergen', 'assembled Burrito allergen status',
    'Allergen information for an assembled Burrito is unknown until its selected components and preparation are reviewed.',
    'unknown', null, 'maintainer_interpretation', 'draft', 'draft',
    'Do not infer allergen absence from missing or unmarked information.'
  ),
  (
    'costa-vida-fact-chips-soy-marker', 'costa-vida-sample',
    'costa-vida-tortilla-chips-example', 'allergen', 'soybeans',
    'The development fixture records a soybeans marker for Tortilla Chips; maintainer interpretation is pending.',
    'unclear', null, 'maintainer_interpretation', 'draft', 'draft',
    'This is an unreviewed source observation, not a confirmed item-level allergen conclusion.'
  ),
  (
    'costa-vida-fact-chips-ingredients', 'costa-vida-sample',
    'costa-vida-tortilla-chips-example', 'ingredient', 'menu-description ingredients',
    'The development fixture mentions corn tortilla, salt, and lime; this is not a definitive ingredient list.',
    'stated', 'menu_description', 'restaurant', 'draft', 'draft',
    'Description mentions may be incomplete.'
  )
on conflict (id) do nothing;

insert into public.menu_fact_evidence (fact_id, evidence_id)
values
  ('costa-vida-fact-burrito-customizable', 'costa-vida-evidence-burrito-menu'),
  ('costa-vida-fact-burrito-allergen-unknown', 'costa-vida-evidence-burrito-menu'),
  ('costa-vida-fact-burrito-allergen-unknown', 'costa-vida-evidence-burrito-allergen-guide'),
  ('costa-vida-fact-chips-soy-marker', 'costa-vida-evidence-chips-allergen-guide'),
  ('costa-vida-fact-chips-ingredients', 'costa-vida-evidence-chips-menu')
on conflict (fact_id, evidence_id) do nothing;
