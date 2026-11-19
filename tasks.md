# Food with Friends - Work Board

Use this file to record each person's current focus and track tasks. Check a task off when it is complete; add or reprioritize items as the project decisions become clearer.

Status: `[ ]` not started / `[~]` in progress / `[x]` done

## Current focus

- **Mary - Backend:** [ ] Agree with Eliza on catalog storage/deployment, the menu evidence schema, and how group search consumes the published catalog.
- **Eliza - Frontend:** [~] Port the clickable flow into the TypeScript app; confirm local workflow and connect the deployed search function.

## Mary - Backend

### 1. Confirm the backend and catalog boundary

- [x] Choose Next.js + Supabase as the initial app/backend stack, with Supabase Postgres as the database.
- [ ] Confirm a server-side deployment for runtime AI and whether the reviewed catalog is stored as files or Supabase records; GitHub Pages alone cannot host the protected AI endpoint.
- [ ] Agree with Eliza on restaurant, source, menu item, allergen/ingredient fact, evidence, and modification fields.
- [ ] Confirm common restriction keys and how custom restrictions map to known catalog concepts; unmatched needs remain uncertain.
- [ ] Agree on the group-search request/response using opaque per-search person IDs plus restrictions (nicknames stay in frontend state), and frontend loading/error states.
- [ ] Choose a server-side AI provider/model for search-time recommendations and catalog preparation; define secret handling, cost/latency limits, and failure behavior.

### 2. Define the AI-assisted catalog workflow

- [ ] Create a Utah Valley restaurant/source inventory, preferring official public menus and allergen statements.
- [ ] Define a repeatable maintainer process to retrieve menu content and ask AI to propose menu items, ingredient/allergen facts, possible modifications, and fact-level evidence.
- [ ] Require a maintainer to verify AI candidates against their sources before publishing; preserve unsupported or missing facts as unknown.
- [ ] Decide how source excerpts, source/check dates, confidence, reviewer, and catalog revisions are represented.
- [ ] Create a small representative catalog sample and use it to refine the data contract with Eliza.

### 3. Build the published catalog and validation

- [ ] Implement the agreed catalog storage/import workflow for restaurants, sources, menu items, facts, evidence, and modifications.
- [ ] Represent unknown separately from explicit restaurant statements about ingredients/allergens; do not treat missing facts as safe.
- [ ] Add validation for stable unique IDs, required evidence, source links/dates, supported fact states, references, and duplicates.
- [ ] Track changes and source freshness; retain last approved facts if a refresh attempt fails.
- [ ] Ensure private group restrictions and AI credentials are never published in catalog data or browser code.

### 4. Implement AI group recommendations

- [ ] Implement the agreed server-side AI search interface over reviewed catalog facts; do not use uncataloged menu claims or expose provider credentials.
- [ ] Have AI select and rank candidates by person, apply the four severity meanings, and distinguish as-listed, possible-with-modification, and uncertain suggestions.
- [ ] Let AI suggest specific modifications and label each suggestion as a full meal, side, or unclear based on menu evidence.
- [ ] Require menu/allergen-guide citations from catalog source IDs for key claims; reject unsupported citations and preserve unknowns.
- [ ] Rank full group coverage first, then partial groups by people covered; preserve strong room-level warnings and cross-contact uncertainty.
- [ ] Return source links, evidence, confidence, last-checked dates, prices, city, serving role, ingredient disclosure status, ingredient evidence IDs, and warnings for frontend display.
- [ ] Handle invalid requests/catalog data, unknown restrictions, no matches, AI timeout/provider errors, malformed output, and invalid citations.

### 5. Verify and maintain the catalog/search feature

- [ ] Build representative catalog examples covering known, unknown, conflicting, stale, and modifiable facts, plus custom restrictions.
- [ ] Evaluate extraction and recommendation outputs against catalog evidence, citation correctness, severity behavior, meal/side labeling, and modification advice.
- [ ] Track catalog coverage, evidence completeness, stale/conflicting facts, AI correction rates, citation completeness, model failures/latency, validation failures, and search errors.
- [ ] Write a maintainer guide for collecting, reviewing, and publishing menu updates.
- [ ] Confirm warnings consistently advise users to verify ingredients and preparation practices with restaurants; do not guarantee allergen-free food.
- [ ] Integrate and deploy the search interface using the deployment approach agreed with Eliza.

## Eliza - Frontend

### Current focus

- [ ] Agree with Mary on the frontend foundation, first screen flow, and API/data contract for group searches and restaurant results.

### Task list

#### 1. Define the frontend foundation and contract

- [x] Choose Next.js + Supabase as the initial frontend and data foundation.
- [ ] Agree with Mary on the project structure, styling approach, and local development workflow.
- [x] Create a low-fidelity clickable prototype of the mobile-first group setup and restaurant browsing flow in [`wireframe.html`](wireframe.html): group review, best and partial matches, no-match state, restaurant details, and meal details.
- [x] Start the flow at the first person's nickname-and-needs screen after Welcome; use a checkmark to return to the group screen and a search icon there to open restaurant results.
- [ ] Agree with Mary on the AI search request/response data for opaque person IDs, restrictions and severity, per-person suggestions, modifications, full-meal/side labels, evidence citations, warnings, restaurant city, and prices; map response IDs to nicknames held locally.
- [x] Define catalog loading, invalid-data, incomplete-information, and search-error states; menu extraction is maintainer-side and does not create user-facing processing progress in v1.
- [ ] Confirm temporary-search behavior, including what group data remains in browser state and when it is cleared.

#### 2. Build the app shell

- [x] Create the frontend project structure, app entry point, shared layout, and navigation for the search flow.
- [x] Make the layout work well on mobile first, then adapt it for wider screens.
- [x] Add shared form controls, buttons, alerts, loading indicators, and accessible typography/color styles.

#### 3. Build group and dietary-needs entry

- [x] Require a unique name or nickname when adding each person; use it to identify that person's menu suggestions in results.
- [x] Let the organizer remove people from the group.
- [x] Let the organizer add multiple specific needs per person from the main options list and enter a custom restriction.
- [x] Add selected needs one at a time at the default severity, returning to the person's details after each selection.
- [x] Allow a person to be saved with no dietary needs after entering a nickname.
- [x] Default each new need, including custom needs, to Avoid (“I won't eat this”); show Preference, Avoid, No contact, or Room-level beside the triangle and explain each level in the picker.
- [x] On the group screen, summarize each person's dietary needs with green/yellow/orange/red triangles, visible short labels, and accessible text; let the organizer add another friend through the same flow and tap a person's name to review or edit their details.
- [x] On a person's details screen, let the organizer remove an individual need using an **X** next to it, with a confirmation prompt that names the need (for example, “Remove peanuts?”).
- [x] Confirm person removal with a prompt that includes the person's nickname before deleting them from the group.
- [x] Let the organizer review and edit the full group before searching.
- [x] Add clear validation for missing or duplicate person names, empty groups, and incomplete custom restriction entries.

#### 4. Build restaurant search and ranked results

- [ ] Submit the group needs to the agreed backend interface without requesting the user's location; search the Utah Valley restaurant set.
- [ ] Show a ranked restaurant list, prioritizing restaurants where every person has at least one suitable item. Do not require everyone to choose the same dish.
- [ ] If no restaurant works for the whole group, show partial matches grouped by the people they work for; allow a restaurant to appear in multiple groups and sort groups from most people covered to fewest.
- [ ] If there are no matches for anyone, show a no-matches state with an option to edit the group and search again.
- [ ] Show each restaurant's city and the most specific price information available.
- [ ] On a restaurant page, show each person's meal ideas in a horizontally scrollable row and allow vertical scrolling for more restaurant information.
- [ ] Open a separate meal detail page when a meal idea is selected; show the restaurant-sourced name, description, ingredients with disclosure status and evidence, price, whether it is a full meal or side (and state that a side is not a full meal), the AI's reason, direct menu/allergen-guide links, warnings, the person it is for, and whether it works as listed or needs a modification. Show the image area only when an image is available.
- [ ] For each restaurant, show suitable menu items by person and distinguish items suitable as listed from items that may work with a stated modification.
- [ ] Show source information and warnings at both restaurant level and meal level, including source links, last-checked dates, confidence labels, and relevant ingredient or cross-contamination details.
- [ ] Keep uncertain results visible with clear warnings and place them below results with stronger supporting information.
- [ ] Show a strong warning for room-level restrictions while allowing the user to decide whether to consider that restaurant.
- [ ] Tell users to confirm uncertain ingredients and preparation practices with the restaurant; never label a dish as guaranteed allergen-free.

#### 5. Handle search and result states

- [ ] Design catalog/search loading and error states; show “There was an error. Please try again later.” for returned search errors, timeouts, network failures, and invalid responses; menu extraction is maintainer-side and is not part of the user's live search.
- [ ] Design useful empty states for no restaurants, no suitable items for a person, and incomplete menu information.
- [ ] Handle backend/network errors and stale or missing source details without presenting unknown information as safe.
- [ ] Keep an **Edit group** control available on results, restaurant, and meal pages so the organizer can update needs and search again without rebuilding the group.

#### 6. Integrate and polish

- [ ] Connect the screens to the API contract agreed with Mary; use clearly labeled sample data only while the backend interface is unavailable.
- [ ] Check keyboard navigation, screen-reader labels, focus handling, readable warning hierarchy, and layouts at mobile and desktop widths.
- [ ] Walk through the complete group-entry-to-results flow with representative group needs and menu results; record and fix issues before release.

#### Later frontend features

- [ ] Add cuisine and price filters after the core matching flow is working.
- [ ] Add a user preference for full meals only or allowing sides as fallbacks; decide whether it applies per person or to the whole group. Default behavior prioritizes full meals and labels side fallbacks clearly.
- [ ] Consider a map view alongside the ranked list.
- [ ] Consider saving dietary profiles for reuse; persistent profiles are not part of the first version.

## Shared decisions and blockers

- [x] Record Next.js + Supabase as the selected stack.
- [x] Record the deployment target: static Next.js on GitHub Pages, with Supabase Postgres and a Supabase Edge Function.
- [ ] Agree on the shared local development workflow.
- [ ] Review and confirm the proposed group-search API contract with Mary: [`documents/shared/search-api-contract.md`](documents/shared/search-api-contract.md).
- [x] Review deployment and search architecture options with Mary; Option B is selected: [`documents/shared/deployment-options.md`](documents/shared/deployment-options.md).
- [ ] Record the app structure and local development workflow.
- [ ] Decide how maintainers review and publish menu catalog changes and when facts are considered stale.
- [ ] Confirm user menu submissions and reports remain out of scope for v1.

## First end-to-end integration

- [ ] **Mary + Eliza:** Choose the frontend and backend stacks and agree on how to run both locally.
- [ ] **Mary + Eliza:** Define the search request: opaque per-search person IDs, restriction types or custom needs, and severity levels; keep unique nicknames in the frontend and map response IDs back to them.
- [ ] **Mary + Eliza:** Define the AI search response: ranked restaurants, partial-match groups, city, prices, per-person meal ideas, modification status, full-meal/side labels, reasons, ingredient disclosure and evidence IDs, menu/allergen-guide citations, last-checked dates, confidence, and warnings.
- [ ] **Mary - Backend:** Provide the agreed search interface using reviewed catalog data, including full matches, partial matches, and no-match results.
- [ ] **Mary - Backend:** Apply the agreed severity and group-coverage rules; preserve unknowns and evidence rather than treating missing information as safe.
- [ ] **Eliza - Frontend:** Build the API connection and replace the wireframe's sample result data with backend responses.
- [ ] **Eliza - Frontend:** Connect catalog/search loading, error, full-match, partial-match, and no-match states to the agreed interface.
- [ ] **Mary + Eliza:** Run both apps together locally and resolve API URL, CORS, and configuration issues.
- [ ] **Mary + Eliza:** Walk through group entry → search → restaurant details → meal details using representative full, partial, and empty results; fix issues found.
- [ ] **Mary + Eliza:** Deploy a shared development version and confirm the frontend can reach the backend there.

## Project references

- Product requirements: [`project_specs.md`](project_specs.md)
- Backend menu data plan: [`documents/back-end/menu-data-and-evidence-pipeline.md`](documents/back-end/menu-data-and-evidence-pipeline.md)
- Proposed group search API contract: [`documents/shared/search-api-contract.md`](documents/shared/search-api-contract.md)
- Deployment and search architecture options: [`documents/shared/deployment-options.md`](documents/shared/deployment-options.md)

## Change history

| Date and time | Change |
| --- | --- |
| 2026-11-18 14:48 America/Denver | Replaced v1 upload/report ingestion tasks with AI-assisted catalog preparation and deterministic group search. |
| 2026-11-18 15:02 America/Denver | Added server-side AI selection, modification, meal-role, and source-citation tasks. |
| 2026-11-18 15:03 America/Denver | Clarified that AI owns menu selection and ranking; deterministic checks validate citations and hard constraints. |
| 2026-11-18 15:21 America/Denver | Added deployment and search architecture options for joint review. |
| 2026-11-18 15:10 America/Denver | Recorded full-meal-first recommendations, labeled side fallback, and future user preference control. |
| 2026-11-18 18:28 America/Denver | Updated shared tasks for local-only nicknames, generic search error copy, and explicit side descriptions on meal details. |
| 2026-11-18 19:15 America/Denver | Recorded the selected GitHub Pages + Supabase Edge Function deployment and started the TypeScript frontend implementation. |
| 2026-11-18 19:32 America/Denver | Added short restriction-level labels beside severity triangles in the app, wireframe, and product spec. |
| 2026-11-18 19:37 America/Denver | Added an ingredient-list uncertainty note to meal details and the proposed search response. |
| 2026-11-18 19:45 America/Denver | Aligned ingredient detail display and tasks with Mary's ingredient disclosure statuses and evidence-linked ingredient objects. |
