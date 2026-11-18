# Food with Friends - Work Board

Use this file to record each person's current focus and track tasks. Check a task off when it is complete; add or reprioritize items as the project decisions become clearer.

Status: `[ ]` not started / `[~]` in progress / `[x]` done

## Current focus

- **Mary - Backend:** [ ] Agree on the first API/data contract with Eliza for the selected Next.js + Supabase stack.
- **Eliza - Frontend:** [ ] Agree on the first API/data contract and local workflow with Mary for the selected Next.js + Supabase stack.

## Mary - Backend

### 1. Decide the backend foundation

- [x] Choose Next.js + Supabase as the initial app/backend stack, with Supabase Postgres as the database.
- [ ] Choose the Next.js deployment target and shared development environment.
- [ ] Choose a background-job/queue approach for weekly source checks and menu processing.
- [ ] Choose an AI provider/model for menu text and image extraction; confirm structured-output and image support.
- [ ] Decide maintainer authentication and how temporary, private search sessions are identified.
- [ ] Agree with Eliza on initial API contracts, error/loading states, and what data the frontend needs for a menu preview.

### 2. Get a runnable backend skeleton

- [ ] Scaffold the backend app with environment-based configuration and secret handling.
- [ ] Add a health/readiness endpoint, structured logging, and centralized error handling.
- [ ] Set up local development, database migrations, and a repeatable seed-data workflow.
- [ ] Add CI checks and a first deployable development environment.
- [ ] Write a short setup guide so both partners can run the backend locally.

### 3. Define and persist the menu data

- [ ] Design the first data model for restaurants, sources, source checks, menu items, extracted facts, evidence, submissions, review decisions, and user reports.
- [ ] Represent source type, evidence, confidence, extraction version, and last-checked time for each relevant fact.
- [ ] Represent `unknown` separately from an explicit claim that an ingredient/allergen is absent.
- [ ] Add data access rules so private submissions cannot appear in the shared catalog before approval.
- [ ] Define temporary preview and image-retention behavior; delete uploaded images after processing.

### 4. Build menu-source ingestion and extraction

- [ ] Implement maintainer operations to add/update curated restaurant source URLs.
- [ ] Build a safe URL fetcher for public sources with redirect, timeout, response-size, and network-access limits.
- [ ] Extract readable menu content from supported web pages and keep the source URL and retrieval time.
- [ ] Add image upload validation and menu text extraction for supported image types.
- [ ] Define the AI extraction contract for menu items, ingredient/allergen statements, possible modifications, supporting evidence, confidence, and extraction version.
- [ ] Validate AI output and reject or flag facts without supporting evidence; never convert missing information into an allergen-free claim.
- [ ] Add deduplication and handling for changed menus, stale facts, and conflicting sources.
- [ ] Add a weekly job for curated sources and a maintainer-triggered refresh.
- [ ] Track processing states: queued, processing, completed, needs review, and failed.

### 5. Add private submissions, review, and reports

- [ ] Accept an organizer's URL or menu image for a temporary private preview.
- [ ] Return submission status and preview results without exposing them to other users or the shared catalog.
- [ ] Delete the original uploaded image after processing while retaining extracted evidence for the preview/review flow.
- [ ] Build maintainer review actions to approve or reject user-submitted facts before shared publication.
- [ ] Add user reports for incorrect or concerning menu information and route them to an internal follow-up queue.
- [ ] Ensure reports do not automatically edit, hide, or reclassify menu facts.

### 6. Expose menu facts and prepare for recommendations

- [ ] Create a read interface for the recommendation service with menu facts, evidence, source, freshness, confidence, and uncertainty.
- [ ] Preserve whether an item is listed as-is, may work with a stated modification, or is uncertain.
- [ ] Coordinate with Eliza on the response data needed to show source links, last-checked dates, confidence, warnings, and per-person item results.
- [ ] Keep deterministic restriction matching and restaurant ranking as a separate backend feature; use `project_specs.md` for its group-coverage, severity, and room-level-warning requirements.

### 7. Verify, operate, and release

- [ ] Add tests for URL/image validation, extraction failures, evidence requirements, stale/conflicting data, privacy isolation, review gating, image deletion, and report handling.
- [ ] Build an evaluation set of representative Utah Valley menus and images; review extraction quality before enabling shared recommendations.
- [ ] Add monitoring for source freshness/check failures, extraction success/failure, low-confidence output, review-queue age, report volume, and processing latency.
- [ ] Create a maintainer runbook for failed source checks, stuck jobs, pending reviews, and AI-provider errors.
- [ ] Confirm warnings consistently advise users to verify ingredients and preparation practices with restaurants; do not guarantee allergen-free food.
- [ ] Deploy the first backend version and verify the frontend can use the agreed API in a shared environment.

## Eliza - Frontend

### Current focus

- [ ] Agree with Mary on the frontend foundation, first screen flow, and API/data contract for group searches and restaurant results.

### Task list

#### 1. Define the frontend foundation and contract

- [x] Choose Next.js + Supabase as the initial frontend and data foundation.
- [ ] Agree with Mary on the project structure, styling approach, and local development workflow.
- [x] Create a low-fidelity clickable prototype of the mobile-first group setup and restaurant browsing flow in [`wireframe.html`](wireframe.html): group review, best and partial matches, no-match state, restaurant details, and meal details.
- [ ] Start the flow at the first person's nickname-and-needs screen after Welcome; use a checkmark to return to the group screen and a search icon there to open restaurant results.
- [ ] Agree with Mary on the request/response data needed for participants, restrictions and severity, per-person menu matches, modifications, source evidence, warnings, restaurant city, and prices.
- [ ] Agree on how the frontend receives processing progress, incomplete results, and API errors, including what to show while menu data is being processed.
- [ ] Confirm temporary-search behavior with the backend, including what data can remain in browser state and when it should be cleared.

#### 2. Build the app shell

- [ ] Create the frontend project structure, app entry point, shared layout, and navigation for the search flow.
- [ ] Make the layout work well on mobile first, then adapt it for wider screens.
- [ ] Add shared form controls, buttons, alerts, loading indicators, and accessible typography/color styles.

#### 3. Build group and dietary-needs entry

- [ ] Require a unique name or nickname when adding each person; use it to identify that person's menu suggestions in results.
- [ ] Let the organizer remove people from the group.
- [ ] Let the organizer add multiple specific needs per person from the main options list and enter a custom restriction.
- [ ] Add selected needs one at a time at the default severity, returning to the person's details after each selection.
- [ ] Allow a person to be saved with no dietary needs after entering a nickname.
- [ ] Default each new need, including custom needs, to “I won't eat this”; let the organizer tap its severity indicator to open a picker explaining all four severity choices.
- [ ] On the group screen, summarize each person's dietary needs with green/yellow/orange/red severity markers and accessible severity labels; let the organizer add another friend through the same flow and tap a person's name to review or edit their details.
- [ ] On a person's details screen, let the organizer remove an individual need using an **X** next to it, with a confirmation prompt that names the need (for example, “Remove peanuts?”).
- [ ] Confirm person removal with a prompt that includes the person's nickname before deleting them from the group.
- [ ] Let the organizer review and edit the full group before searching.
- [ ] Add clear validation for missing or duplicate person names, empty groups, and incomplete custom restriction entries.

#### 4. Build restaurant search and ranked results

- [ ] Submit the group needs to the agreed backend interface without requesting the user's location; search the Utah Valley restaurant set.
- [ ] Show a ranked restaurant list, prioritizing restaurants where every person has at least one suitable item. Do not require everyone to choose the same dish.
- [ ] If no restaurant works for the whole group, show partial matches grouped by the people they work for; allow a restaurant to appear in multiple groups and sort groups from most people covered to fewest.
- [ ] If there are no matches for anyone, show a no-matches state with an option to edit the group and search again.
- [ ] Show each restaurant's city and the most specific price information available.
- [ ] On a restaurant page, show each person's meal ideas in a horizontally scrollable row and allow vertical scrolling for more restaurant information.
- [ ] Open a separate meal detail page when a meal idea is selected; show the meal name, description, ingredients, price, sources, warnings, the person it is for, and whether it works as listed or needs a modification. Show the image area only when an image is available.
- [ ] For each restaurant, show suitable menu items by person and distinguish items suitable as listed from items that may work with a stated modification.
- [ ] Show source information and warnings at both restaurant level and meal level, including source links, last-checked dates, confidence labels, and relevant ingredient or cross-contamination details.
- [ ] Keep uncertain results visible with clear warnings and place them below results with stronger supporting information.
- [ ] Show a strong warning for room-level restrictions while allowing the user to decide whether to consider that restaurant.
- [ ] Tell users to confirm uncertain ingredients and preparation practices with the restaurant; never label a dish as guaranteed allergen-free.

#### 5. Handle search and result states

- [ ] Design loading and processing states, including a clear indication when results are not ready yet.
- [ ] Design useful empty states for no restaurants, no suitable items for a person, and incomplete menu information.
- [ ] Handle backend/network errors and stale or missing source details without presenting unknown information as safe.
- [ ] Keep an **Edit group** control available on results, restaurant, and meal pages so the organizer can update needs and search again without rebuilding the group.

#### 6. Integrate and polish

- [ ] Connect the screens to the API contract agreed with Mary; use clearly labeled sample data only while the backend interface is unavailable.
- [ ] Check keyboard navigation, screen-reader labels, focus handling, readable warning hierarchy, and layouts at mobile and desktop widths.
- [ ] Walk through the complete group-entry-to-results flow with representative group needs and menu results; record and fix issues before release.

#### Later frontend features

- [ ] Add cuisine and price filters after the core matching flow is working.
- [ ] Consider a map view alongside the ranked list.
- [ ] Consider saving dietary profiles for reuse; persistent profiles are not part of the first version.

## Shared decisions and blockers

- [x] Record Next.js + Supabase as the selected stack.
- [ ] Record the Next.js deployment target and shared development environment.
- [ ] Review and confirm the proposed group-search API contract with Mary: [`documents/shared/search-api-contract.md`](documents/shared/search-api-contract.md).
- [ ] Record the app structure and local development workflow.
- [ ] Decide temporary-session expiration, supported image types/size limits, and stale-data thresholds.
- [ ] Decide how internal maintainers access the source list and review/report queues.

## First end-to-end integration

- [ ] **Mary + Eliza:** Choose the frontend and backend stacks and agree on how to run both locally.
- [ ] **Mary + Eliza:** Define the search request: people, unique nicknames, restriction types or custom needs, and severity levels.
- [ ] **Mary + Eliza:** Define the search response: ranked restaurants, partial-match groups, city, prices, per-person meal ideas, modification status, sources, last-checked dates, confidence, and warnings.
- [ ] **Mary - Backend:** Provide an initial restaurant-search/recommendation endpoint using curated or seed menu data, including full matches, partial matches, and no-match results.
- [ ] **Mary - Backend:** Apply the agreed severity and group-coverage rules; preserve unknowns and evidence rather than treating missing information as safe.
- [ ] **Eliza - Frontend:** Build the API connection and replace the wireframe's sample result data with backend responses.
- [ ] **Eliza - Frontend:** Connect loading, processing, error, full-match, partial-match, and no-match states to the agreed API behavior.
- [ ] **Mary + Eliza:** Run both apps together locally and resolve API URL, CORS, and configuration issues.
- [ ] **Mary + Eliza:** Walk through group entry → search → restaurant details → meal details using representative full, partial, and empty results; fix issues found.
- [ ] **Mary + Eliza:** Deploy a shared development version and confirm the frontend can reach the backend there.

## Project references

- Product requirements: [`project_specs.md`](project_specs.md)
- Backend menu data plan: [`documents/back-end/menu-data-and-evidence-pipeline.md`](documents/back-end/menu-data-and-evidence-pipeline.md)
- Proposed group search API contract: [`documents/shared/search-api-contract.md`](documents/shared/search-api-contract.md)
