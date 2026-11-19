# Static Menu Catalog and AI-Assisted Preparation

## Summary

Build a reviewed catalog of Utah Valley restaurant menus and allergen-related facts from public internet sources. AI helps maintainers find and structure candidate menu items and evidence before publication. A maintainer verifies the candidates and publishes the approved catalog. At search time, an AI recommendation service selects and ranks catalog items for the group's restrictions, proposes evidence-backed modifications, and explains its citations. It may only use the published catalog; it must not invent menu facts or claim that food is safe.

The selected architecture is a static Next.js site on GitHub Pages, with the reviewed catalog in Supabase Postgres and runtime search in a Supabase Edge Function. The function calls OpenAI server-side.

## Problem and goals

Restaurant menus and allergen details vary in source, completeness, and freshness. The application needs useful menu coverage while preserving the evidence and uncertainty behind each fact.

Goals:

- Create a useful Utah Valley restaurant catalog from public sources, preferring official restaurant information.
- Use AI to speed up menu discovery and structuring without treating AI output as verified fact.
- Keep each published fact traceable to its source, supporting evidence, review status, and last-checked date. Give users the underlying source, excerpt/location, and uncertainty details instead of a confidence score or level.
- Let AI select and rank menu items for the full group's needs, showing suitable-as-listed, possible-with-modification, and uncertain options.
- State whether each suggestion appears to be a full meal, a side, or unclear, with the basis and its source when available.
- Never imply that a restaurant or dish is guaranteed allergen-free.

## Users and permissions

- **Organizer:** Sends the group's people and restrictions through the search flow and views matches from the published catalog. Persistent accounts and dietary profiles are not required for the first version.
- **Maintainer:** Researches restaurant sources, uses AI to prepare candidate records, verifies evidence, and publishes catalog updates.
- **Public visitor:** Can read published restaurant and menu facts through the website.

User-submitted menus, uploads, and reports are out of scope for the first version, based on the earlier product decision. Only maintainers can change shared catalog data.

## Scope

**In scope:** A curated restaurant/source list; manual or maintainer-triggered collection from public internet sources; AI-assisted menu extraction; human review; a versioned/published catalog; source and evidence metadata; runtime AI selection/ranking and modification suggestions grounded in the catalog; citation validation; validation and publication checks.

**Out of scope for v1:** User menu uploads or reports, search-time web crawling or open-ended web research, automatic broad source discovery, persistent dietary profiles, and unreviewed catalog publication. A weekly automated refresh is also deferred; maintainers update the catalog as needed.

## Requirements and behavior

### Catalog collection and AI assistance

1. A maintainer identifies a restaurant and its public source URLs. Prefer official restaurant menus, allergen statements, and restaurant websites. Clearly label third-party sources and use them as supporting sources when official details are unavailable.
2. The maintainer supplies an official or otherwise approved public menu URL to the preparation workflow. The workflow retrieves supported public page, PDF, or menu-image content, or lets the maintainer provide readable source text when automatic retrieval fails. AI may identify candidate menu items, ingredients, explicit allergen statements, stated modifications, and supporting excerpts. For ingredients, record whether the source supplies a definitive ingredient list for the exact item/configuration, merely mentions ingredients in a menu description, or does not state ingredients. Keep insufficient or conflicting evidence as unknown. Process the menu generally, not just for one current group, so the shared catalog can serve later searches.
3. AI output is a draft. A maintainer checks each candidate against the cited source before publication. Reject or mark unknown any fact without clear supporting evidence. AI must not infer safety from omitted ingredients or menu silence.
4. The maintainer publishes reviewed facts into the catalog through the chosen repository or database workflow. Record review and source-check dates so catalog changes can be traced.
5. A failed source fetch or extraction is an operational failure; leave affected information unknown and preserve the last approved catalog facts while flagging their freshness for review.

The search-time AI receives the full group's restrictions and the relevant reviewed catalog facts. It assesses candidate suitability, chooses and ranks per-person options to maximize group coverage, explains which facts support each suggestion, and proposes modifications only when they are grounded in menu or restaurant evidence. The AI selects catalog item IDs; the backend resolves each returned name from the selected catalog record so it exactly matches the restaurant's menu wording. Do not append labels such as “Full Meal,” “Side,” or “configurable menu item” to the name. The backend builds the response description with an explicit serving-role sentence from the reviewed role and its evidence basis: full meal, side (and not a full meal), or unclear. Keep other serving-role and customization fields separate as well. A deterministic post-validator checks the returned schema, source IDs, known ingredient conflicts, and required warnings; it does not choose the menu items or rank them. The AI cannot browse for new dishes or replace missing catalog facts with model knowledge. Its suggestions remain uncertain where the catalog lacks relevant evidence, and must never be presented as guarantees of safety.

### Catalog data and evidence

At minimum, represent:

- **Restaurant chain:** one stable catalog ID and chain name, with a collection of known local locations/cities. Keep location records under the chain rather than creating a separate top-level restaurant entry for each city. Record available price context only when its location scope is clear.
- **Source:** stable ID, restaurant ID, URL, source type (official or third-party), source title when available, last-checked date, and source status.
- **Menu item:** stable ID, chain ID, exact offering name as written on the menu, description, and available price/image information. If the restaurant says the offering is customizable, state that in the description with the source evidence. Keep category, serving role, and other descriptive qualifiers separate; do not add them to the item's name. A chain's city-specific availability may be unknown and must not be generalized to every location.
- **Ingredient disclosure:** whether a reviewed source provides a definitive ingredient list for the exact item/configuration, only mentions ingredients in a description, does not state ingredients, or leaves the basis unknown because evidence is insufficient or conflicting. Each ingredient fact records its evidence type and supporting evidence reference.
- **Fact:** the source-attributed ingredient, allergen, or preparation information, including the item/component/configuration it applies to, exact source wording or a faithful structured value, review status, uncertainty/conflict notes, and evidence references. Allergen information may say a source reports an allergen as present/contains or that it is unknown/unclear. Do not state that an allergen is absent or imply allergen-free status from an unmarked field, an incomplete list, or silence.
- **Evidence:** stable ID, source ID, a short verbatim source excerpt supporting the fact, and a source location when available. Keep evidence close to the fact it supports rather than only at the restaurant level; citations must preserve this excerpt and location.
- **Modification:** a source-supported possible change, such as omitting an ingredient, with evidence and uncertainty retained.

Do not create or return an allergen-absence status. Preserve source-backed information and its context; when no reliable positive allergen statement is available, represent allergen presence as unknown/unclear and provide the evidence details that let users judge it. Ingredient disclosure remains a separate concept: distinguish a definitive ingredient list, description mentions, reviewed sources that do not state ingredients, and insufficient/conflicting evidence. Do not treat a menu description's ingredient mentions as complete. Ingredient information alone does not establish preparation practices or rule out cross-contact. OpenAI interprets group restrictions against catalog facts at search time and selects dishes; when that relationship is ambiguous or facts are missing, preserve uncertainty.

### AI recommendation behavior

1. Accept the group request defined by [`../shared/search-api-contract.md`](../shared/search-api-contract.md).
2. Read the published chain/menu catalog and known city/location records. Do not fetch websites or use uncataloged model knowledge during group search.
3. Send all group restrictions and relevant facts to a server-side OpenAI recommendation service. OpenAI interprets restrictions against the evidence and selects candidate dishes per person, prioritizing restaurants where everyone has an option even when members choose different dishes. It may suggest a modification, such as asking for a salad without croutons; for a person who does not consider cross-contact a restriction, it may also present removing croutons as a user-chosen modification, clearly marked as not suitable as-listed and not a safety guarantee. Do not imply that removing an ingredient resolves cross-contact concerns. If a restriction cannot be confidently related to the catalog evidence, return uncertainty rather than relying on a fixed alias lookup or guessing.
4. Apply the severity meanings in `project_specs.md`: a known conflicting ingredient does not fit as-listed for severity 2 or higher; a modification may be proposed only as a separate option. For cross-contact severity, do not treat ingredient omission as sufficient unless the catalog contains restaurant-specific preparation evidence. For room-level restrictions, preserve the strong restaurant warning rather than automatically hiding the restaurant.
5. Return `as_listed`, `modification`, or `uncertain` for each suggested item. State whether it is likely a full meal, a side, or unclear. Explain the basis in plain language and cite the menu and allergen guide or other relevant approved source records.
6. Prefer a suitable full meal for each person. If a restaurant has no suitable full-meal option for a person, allow a suitable side as a fallback and label it clearly as a side; do not present the side as a full meal.
7. Every citation must resolve to a catalog source with its exact URL and source type. Link each key ingredient, allergen, preparation, or modification claim to the evidence that supports it. If no source supports a claim, omit the claim or mark it unknown; never fabricate a citation.
8. Rank for group coverage first, so each person can have an option even when they choose different dishes. Among comparable coverage options, prioritize full meals; keep uncertain suggestions visible but below better-supported options, and preserve warnings and restaurant-confirmation guidance.
9. Keep the AI call server-side so provider credentials never enter the browser. Validate the response against a structured schema and the catalog's source IDs before returning it. Do not treat a valid schema as proof that the recommendation is factually correct.

### Safety, privacy, and publication

- Catalog content is public once published. Do not place secrets, private user information, or AI credentials in browser code or public catalog files. Send only the temporary group restrictions and relevant catalog context required for the AI recommendation.
- Do not store an organizer's group restrictions in the shared menu catalog. Keep search inputs temporary unless a later product decision adds accounts or saved profiles.
- Follow source terms and applicable limits when retrieving and republishing public menu information.
- Do not make “allergen-free” or equivalent guarantees. A claim can be included only as a clearly attributed restaurant statement with date and evidence, and still must not be presented as a safety guarantee.

## User flows

1. **Prepare a catalog update:** Maintainer selects a restaurant source, retrieves its public menu, uses AI to structure candidate items and evidence, verifies each candidate, resolves unknowns/conflicts, then publishes the reviewed catalog update.
2. **Search for a group:** Organizer enters participants and restrictions. The backend reads the published catalog, sends relevant facts and restrictions to the server-side AI recommendation service, validates its structured suggestions and citations, and returns ranked restaurants and per-person meal options with evidence and warnings.
3. **Refresh outdated information:** Maintainer rechecks a source, compares it with the current catalog, reviews changed facts, and publishes an update. If retrieval or extraction fails, the existing approved facts remain and are marked for follow-up.

## States and edge cases

Represent catalog facts as draft, reviewed, or published; distinguish source checks as successful, changed, unavailable, or failed. Handle duplicate chains/items/locations, changed or unreachable pages, incomplete menus, conflicting sources, missing evidence, ambiguous or unsupported extraction, ambiguous restriction interpretation, stale facts, and malformed catalog data. At search time also handle AI timeout or provider failure, invalid structured output, unknown source IDs, unsupported citations, contradictory evidence, and ambiguous meal-versus-side classification. Do not turn a processing failure, missing statement, or unmarked allergen field into an allergen absence. Preserve prior approved facts when a refresh fails; never return an uncited AI claim as a menu fact.

## Risks and mitigation

- **False confidence about allergy safety:** Preserve unknowns and conflicts, require evidence for every material recommendation claim, show source details and uncertainty instead of a confidence score, use severity-aware constraints, show warnings, and advise users to confirm with the restaurant. AI suggestions are not safety guarantees.
- **AI recommendation or extraction mistakes:** Require maintainer review of catalog facts, constrain recommendation input/output to catalog evidence, validate citations, and evaluate both extraction and recommendation quality before release.
- **Unsafe or confusing modification advice:** Distinguish ordering an item without an ingredient from removing it after serving. For cross-contact concerns, do not imply ingredient removal resolves preparation risk.
- **AI provider outage or bad output:** Define a clear search error/degraded state; never silently convert a model failure into a claim that no suitable dishes exist.
- **Stale or changed menus:** Record source and check dates; make refresh work repeatable and display stale or conflicting data as uncertain.
- **Source terms or access restrictions:** Prefer public official sources, check applicable terms, and keep collection bounded and maintainer-directed.
- **Unsafe or unreliable source retrieval:** Restrict retrieval to public web sources, validate redirects and response limits, and treat blocked or unreadable content as a failed check that needs maintainer follow-up.
- **Unsafe restriction interpretation:** Have OpenAI relate restrictions to evidence in the reviewed catalog, require citations and post-validation, and keep ambiguous or unsupported relationships uncertain rather than guessing.
- **Catalog/build failure:** Validate identifiers, references, required evidence, supported fact states, and publication format before release.

## Acceptance criteria

- Maintainers can create reviewed catalog entries for Utah Valley restaurants from public menu sources.
- AI-assisted candidates include evidence references, review state, and uncertainty notes, and cannot be published until a maintainer verifies them.
- Search uses the published catalog and a server-side AI recommendation call; it does not fetch menu websites or use uncataloged web results at runtime.
- Each recommendation includes a plain-language reason, an explicit as-listed/modification/uncertain status, a full-meal/side/unclear label, and links to the menu and allergen-guide sources that support its claims.
- Each result's food name matches the restaurant's menu wording and is not decorated with serving-role or configuration labels. Serving role is stated in the description and separate response field.
- The API returns the exact catalog name resolved from the selected item ID, plus a description that explicitly states full meal, side/not a full meal, or unclear from reviewed serving-role evidence.
- AI cannot cite source IDs absent from the catalog; unsupported statements are omitted or marked unknown.
- Each relevant menu fact exposes its source, last-checked date, supporting excerpt/location, review status, and uncertainty to the result layer; no confidence score or level is returned.
- Ingredient displays identify whether they came from a definitive ingredient list or from ingredients mentioned in a menu description; a description-based list is labeled potentially incomplete. When reviewed sources do not state ingredients, the interface says so; insufficient or conflicting evidence remains unknown.
- Unknown information remains distinct from processing failure; missing evidence never becomes an allergen-presence or safety claim.
- Recommendations respect severity, group coverage, uncertain ranking, and room-warning rules from `project_specs.md`; an ingredient omission alone does not resolve cross-contact concerns.
- Invalid catalog records and duplicate IDs/references are caught before publication.
- The interface returns the full/partial/none outcomes and source/warning fields described in the shared search contract.

## Dependencies and decisions

- `project_specs.md` defines Utah Valley coverage, group severity, group-coverage priority, result warnings, and restaurant-confirmation guidance.
- The selected architecture is a static Next.js site on GitHub Pages, Supabase Postgres for the catalog, and a Supabase Edge Function for server-side OpenAI search. The function protects provider credentials.
- Confirm the canonical source, fact, evidence, and modification schema before implementation.
- The API's common restriction keys are settled in [`../shared/search-api-contract.md`](../shared/search-api-contract.md). OpenAI performs restriction interpretation against reviewed catalog facts at search time; no separate fixed alias table is a prerequisite. Unclear matches remain uncertain.
- Confirm who can publish catalog changes and how reviews are recorded.
- Source refresh is manual/as-needed for v1; automated cadence, crawling, and scheduled extraction are deferred.
- User submissions and reports remain out of scope for v1. Runtime AI recommendations are now in scope and require a server-side model integration.

## Measurements and operations

Track restaurant/menu coverage across Utah Valley; percentage of facts with evidence and current check dates; unknown, stale, and conflicting facts; AI extraction acceptance/correction rates; recommendation citation completeness and correction reports from internal evaluation; model latency/failures; catalog validation failures; and search errors. Maintainers review the catalog as part of each update. A failed fetch, extraction, or recommendation call must never appear to users as evidence that no suitable food exists or that an item lacks allergens.

## Future implementations

- Scheduled source checks and AI-assisted change proposals with human review.
- Expanded restaurant source discovery and richer menu parsing.
- User correction/report workflows with moderation, if added to scope.
- Persistent dietary profiles or saved searches, if added to scope.
- Broader runtime web research only if separately evaluated and designed with traceable source capture.
- A user control for full-meal-only recommendations versus allowing side fallbacks. Decide whether it applies per person or to the whole group before adding the preference to the search request.

## Future work

- Implement the selected Supabase catalog and Edge Function architecture.
- Implement the source/fact/evidence/modification schema described above, including chain/location representation; OpenAI interprets restrictions against those catalog records.
- Define the maintainer's repeatable AI-assisted collection, verification, and publication checklist.
- Create a small representative Utah Valley seed catalog and extraction evaluation set.
- Define stale-data thresholds and catalog validation rules before implementation.
- Select a model/provider and define server-side privacy, cost, latency, failure, and structured-output behavior for recommendations.
- Implement and evaluate the evidence-constrained AI recommendation behavior described in the shared API contract.

## Edit history

| Date and time | Change |
| --- | --- |
| 2026-11-16 23:28 America/Denver | Created the initial menu data and evidence pipeline plan. |
| 2026-11-18 14:48 America/Denver | Reframed v1 as a reviewed catalog with AI-assisted preparation and deterministic group matching. |
| 2026-11-18 15:02 America/Denver | Changed group item selection to evidence-constrained AI recommendations with modifications, meal-role labels, and source links. |
| 2026-11-18 15:03 America/Denver | Clarified that AI selects menu items while deterministic post-validation checks only hard constraints and citations. |
| 2026-11-18 15:10 America/Denver | Prioritized full meals and defined clearly labeled side fallbacks; deferred user meal-preference control. |
| 2026-11-18 19:20 America/Denver | Added ingredient disclosure provenance and distinct handling for complete lists, description mentions, unstated ingredients, and unknown evidence. |
| 2026-11-18 19:39 America/Denver | Required restaurant-sourced names to resolve from catalog IDs and serving-role wording to be included in the backend description. |
| 2026-11-18 19:52 America/Denver | Recorded the agreed restriction keys and kept catalog concept/alias mapping as a separate implementation decision. |
| 2026-11-18 19:56 America/Denver | Required short verbatim source excerpts and locations on claim-linked evidence records. |
| 2026-11-18 20:05 America/Denver | Replaced confidence scoring with source, review, evidence, and uncertainty details for users to assess. |
| 2026-11-18 20:38 America/Denver | Recorded chain-level catalog entries, menu-named customizable items, source-backed allergen details without absence claims, and OpenAI restriction interpretation. |
