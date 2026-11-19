# GitHub Pages and Supabase AI Search Deployment Plan

## Summary

Publish the public Food with Friends website as a static Next.js export on GitHub Pages. Visitors can open the published URL in a phone or desktop browser without installing an app or signing in. Store the reviewed Utah Valley restaurant and menu catalog in Supabase Postgres. A Supabase Edge Function receives group searches, reads relevant catalog evidence, calls the AI provider from the server side, validates the response, and returns recommendations with catalog-backed citations.

This document plans the deployment and service boundaries. It does not implement the site, configure accounts, or select unresolved operational settings.

## Problem and goals

GitHub Pages can serve the public static site but cannot run a protected server endpoint. Runtime AI must therefore run in a separate backend so provider credentials are not exposed in browser files. The service must use the reviewed catalog, preserve allergy uncertainty and evidence, and distinguish service failures from a successful search with no matches.

Goals:

- Make the site available to visitors through a browser on mobile and desktop.
- Retain server-side AI search while using GitHub Pages for static hosting.
- Keep the reviewed catalog and search-time backend in Supabase.
- Keep group restrictions temporary and AI credentials server-side.
- Bound public use and monthly AI spending, and provide clear failure behavior.
- Keep recommendations, modification suggestions, full-meal priority, side fallback labels, and source citations consistent with `project_specs.md` and [`search-api-contract.md`](../shared/search-api-contract.md).

## Users and permissions

- **Organizer:** Uses the public site without an account, enters a group's restrictions for a search, and receives restaurant recommendations. The group is not persisted as a profile.
- **Public visitor:** Can load the static site and invoke the public search service. Requests are untrusted and must be validated and rate-limited.
- **Maintainer:** Curates and reviews restaurant/menu records in Supabase through an internal process. The specific access mechanism and roles are not yet decided.
- **AI provider:** Receives only the group restriction information and catalog evidence needed for the current search. Provider, retention settings, and exact payload minimization need confirmation.

The browser must not receive database service credentials or AI provider keys. Any public Supabase key is not a secret and must only have the minimum privileges required; search should access catalog data through the Edge Function rather than granting browser clients broad catalog write access.

## Scope

**In scope:**

- Static Next.js publishing on GitHub Pages through GitHub Actions.
- Supabase Postgres as the reviewed restaurant/menu catalog store.
- A Supabase Edge Function replacing the relative `POST /api/search` route.
- Server-side AI selection/ranking from catalog evidence, response validation, and citation validation.
- CORS/origin configuration, request validation, abuse controls, AI spending guard, and user-visible service errors.
- Planning for the free-tier pause and invocation/time limits described in the deployment decision.

**Out of scope for this plan:**

- Implementing the website, function, schema, CI workflow, or infrastructure.
- Choosing exact database tables, AI model, request quotas, or maintainer authentication.
- Persistent dietary profiles, user menu submissions, user reports, or runtime menu scraping.
- Changing the product's allergy severity, group coverage, full-meal-first, or side-fallback behavior.

## Requirements and behavior

### Hosting and request path

1. GitHub Actions builds the Next.js app in static-export mode and publishes the generated static files to GitHub Pages.
2. The deployed browser sends the search request to the Supabase Edge Function URL, replacing the relative `POST /api/search` URL. The JSON request includes only each person's opaque per-search ID and restrictions; names remain in temporary frontend state. The response refers to people by ID so the frontend can map results to local names. The request and response semantics are documented in [`search-api-contract.md`](../shared/search-api-contract.md).
3. The function validates the request, loads only relevant reviewed catalog evidence, calls the AI provider using a server-side secret, validates the result, and returns recommendations.
4. The response may cite only sources/evidence present in the reviewed catalog. Invalid or invented citations must be rejected or omitted with an appropriate uncertainty/error result.
5. The function does not persist group restrictions or create user accounts. Logs and provider requests must avoid retaining unnecessary identifying or dietary information.

### Public endpoint controls

- Configure CORS for the published GitHub Pages origin and any explicitly approved development origin. A future custom domain requires an explicit origin update.
- Treat CORS as a browser access control, not authentication; non-browser clients can call the public endpoint.
- Validate body size, participant count, restriction shape/severity, custom restriction length, and request content before using the database or AI provider. Exact limits remain a decision to settle before implementation.
- Add request throttling/abuse controls and a monthly application-level AI usage guard. Because the endpoint is anonymous, define how requests are counted without retaining group data longer than needed.
- Keep Supabase service-role credentials and AI-provider credentials in backend secrets only. Never put them in GitHub Pages build variables or committed files.
- Return a safe structured error for invalid requests, throttling, exhausted AI budget, unavailable backend, provider failure, timeout, or malformed AI output. A failure must never be returned as `outcome: "none"`.
- For a returned service error, network failure, timeout, or response-parsing failure, the frontend displays: **“There was an error. Please try again later.”** A successful `outcome: "none"` remains the separate no-matches state.

### Security and privacy safeguards

Treat the GitHub Pages site, every browser request, the reviewed catalog content, and every AI response as untrusted or publicly observable unless a specific control says otherwise. Use multiple safeguards so one missed check does not expose credentials, allow catalog edits, or create unsupported allergy claims.

#### Public site and build pipeline

- Assume all repository content and published static files can be read by anyone. Only commit restaurant/menu data intended for public release; never store group searches, maintainer credentials, provider keys, database passwords, or private review notes in the repository.
- Do not put secrets in `NEXT_PUBLIC_*` variables, static-site configuration, HTML, JavaScript, source maps, or GitHub Pages artifacts. Values exposed to the browser are public even if originally supplied through a build secret. The static build should need only public configuration such as the function URL and, if used, a Supabase publishable key.
- Keep AI-provider and database secret credentials in Supabase Function secrets. Do not pass them through a GitHub Actions build job. If a secret is ever committed or included in an artifact, treat it as compromised: revoke/rotate it, remove the exposure, and review provider and database activity.
- Configure GitHub Actions with only the permissions required to build and publish the static artifact. Do not expose deployment secrets to untrusted pull-request code; protect the publishing branch and require review before a change reaches production. Pin or otherwise review third-party workflow actions and dependencies.
- Review dependency updates and security advisories for the frontend, Supabase client, function dependencies, and GitHub Actions. Keep lockfiles current and remove packages that are not needed.

#### Function, database, and public access

- The search function is intentionally callable without visitor sign-in. Treat it as a public API even if the browser includes the project's public/publishable key. That key identifies the project; it is not proof that the caller is the deployed website.
- Use CORS to allow only the published site origin and approved development origins. Reject disallowed browser origins and handle preflight requests deliberately, but do not treat CORS as authorization: scripts and non-browser clients can call the endpoint directly.
- Validate every request on the server against the agreed schema before querying the database or invoking AI. Reject malformed JSON, unknown or invalid restriction types, severity values outside the product's defined range, duplicate or missing participant identifiers, excessive participant counts/body sizes, and overlong custom text. Set explicit limits before implementation; do not forward arbitrary browser fields to the model.
- Do not accept user-supplied URLs or arbitrary database identifiers as instructions for what to fetch. Search reads only reviewed catalog records. Use parameterized database access or Supabase query builders; avoid constructing SQL from request text.
- Keep catalog access read-only for public search. Enable RLS and least-privilege grants on exposed tables, schemas, views, and functions. Prefer an Edge Function database identity limited to the reads it needs. If a privileged Supabase secret is required, use it only inside the function, restrict its use to this service, and account for the fact that service-role/secret credentials bypass RLS. Do not grant browser clients insert, update, or delete access to the reviewed catalog.
- Keep maintainer writes separate from public search. Require maintainer authentication and authorization for catalog changes, record who approved a change and its sources, and review changes before they become searchable. The authentication mechanism and audit retention remain to be decided.
- Apply server-side rate limits and request-size/compute limits. Because there are no user accounts, choose a privacy-conscious abuse-control key and short retention period. A publishable key or Origin header alone must not be used as a reliable caller identity.
- Enforce the $5/month application AI budget before dispatching model requests. Reserve estimated cost atomically so simultaneous calls cannot all pass against the same remaining balance; reconcile with actual usage afterward. Fail closed when usage accounting is unavailable or the budget is reached. Keep a safety margin because provider-side spend controls can lag, and never automatically recharge.
- Set bounded function/model timeouts, input and output token ceilings, and a response size ceiling. Cancel or stop work after the request deadline where supported. Return throttling or temporary-unavailable errors without disclosing internal prompts, credentials, database details, or provider diagnostics.

#### Allergy data, model behavior, and browser rendering

- Treat restaurant web text and stored source excerpts as data, not instructions. Curators review sources before publication; the runtime search does not browse arbitrary URLs or follow instructions found inside menu content. Do not give the recommendation model tools or privileges that can modify the catalog or access unrelated systems.
- Keep names/nicknames in temporary frontend state and do not include them in the request to the function. Use opaque per-search IDs to associate restrictions with people and map response IDs back to local names. Minimize model input to those IDs, restriction labels/severity, and catalog facts needed to compare candidates. Do not send names, contact details, precise location, or other identifying information unless a future approved feature requires it. Do not persist group restrictions as profiles.
- Do not log raw request bodies, participant names, full prompts, or full model responses by default. Prefer aggregate counts, response codes, latency, token/cost totals, and validation outcomes. Define any short-lived abuse metadata, provider retention, operational log retention, and deletion behavior before launch.
- Require structured model output and validate it against the response schema and the catalog. Verify every cited source/evidence ID exists and belongs to the returned restaurant/menu item; validate that direct URLs are exactly the reviewed catalog URLs; reject unsupported ingredient, allergen, modification, preparation, price, and serving-role claims. Do not rely on prompt instructions alone for these constraints.
- Require AI selections to reference reviewed catalog item IDs. After validating an ID, resolve the returned food `name` from that catalog record; never trust a model-generated name. Preserve the exact restaurant-sourced wording without suffixes or rewrites such as “Full Meal,” “Side,” or “configurable menu item”; keep serving role and customization in their separate fields and the description.
- Build the API `description` with an explicit plain-language serving-role sentence from the reviewed `servingRole` and `servingRoleBasis`: identify a full meal, state that a side is not a full meal, or say the role is unclear. The frontend can display that description without deriving the role itself.
- Validate ingredient disclosure against catalog evidence. The response must distinguish a definitive ingredient list for the exact item/configuration, ingredients mentioned only in a menu description, a reviewed source that does not state ingredients, and insufficient/conflicting evidence. Generate the corresponding user-facing label from this validated status; do not let the model claim a complete list from description text or label missing catalog evidence as source silence.
- Apply deterministic post-validation for hard product rules: known ingredient conflicts cannot be called suitable as listed; unknown and conflicting facts remain uncertain; cross-contact severity cannot be satisfied by removing an ingredient alone; room-level warnings remain visible; and side fallback is used only when no suitable full meal is available for that person at that restaurant and is labeled as a side. AI selection does not make food safe or guarantee an outcome.
- Render model and catalog text as ordinary escaped text, not executable HTML. Avoid unsafe HTML injection APIs. Validate citation links as HTTPS links to the catalog's stored source URLs; use safe external-link behavior. Never execute model output, use it as code, or let it choose an unvalidated redirect target.
- Keep search failures distinct from successful no-match results. Do not expose raw stack traces or model prompts to users. Tell users to confirm ingredients and preparation practices with the restaurant; retain source freshness and uncertainty warnings.

#### Incident response and recovery

- Define who can revoke/rotate provider and Supabase credentials, disable the search function or AI calls, and restore service after a suspected leak or abuse event.
- Alert maintainers on unusual request volume, rapid spending, repeated invalid requests, unexpected catalog writes, a sudden rise in citation-validation failures, or provider/database errors. Establish thresholds and notification ownership before launch.
- Keep a safe degraded state: if budget protection, catalog validation, or required evidence cannot be checked, do not call AI or present a recommendation as a successful no-match; return the appropriate unavailable/error state.
- Maintain a way to identify and revert a bad catalog publication while preserving the previous reviewed version and its provenance.

### Catalog and recommendations

- Supabase stores reviewed restaurant, menu, source, allergen/ingredient, evidence, freshness, and confidence information. The exact schema remains to be agreed with the menu catalog plan and search contract.
- The AI selects and ranks menu items for the full group from relevant catalog facts. It may suggest evidence-supported modifications and labels each suggestion as a full meal, side, or unknown.
- Prefer suitable full meals. A side may be used only as a fallback for a person with no suitable full meal at that restaurant and must be labeled as a side.
- When a visitor opens a meal, its detail description must clearly state its serving role: full meal, side dish (including that it is not a full meal), or unclear based on the menu. Use the evidence basis for that description.
- Preserve the restaurant's exact menu item name in the catalog, response, result card, and detail title. Do not append the serving role or configuration qualifier to the title; state those details in the description and their separate fields.
- Preserve room-level warnings, cross-contact uncertainty, known conflicts, and the severity behavior defined in `project_specs.md`.
- Missing or conflicting information remains unknown. Do not describe a restaurant or dish as guaranteed allergen-free.
- Ingredient details identify their evidence basis: a definitive source ingredient list, ingredient mentions from a menu description (which may be incomplete), ingredients not stated by reviewed sources, or unknown where evidence is insufficient/conflicting. The search function validates the status and supporting evidence; the frontend displays matching plain-language copy.
- Provide direct menu and allergen-guide links when those sources are present. Make the absence of a guide explicit when applicable.

### Availability and cost assumptions

- Plan for a **$5/month OpenAI API usage budget**. A ChatGPT Plus/Go/Free subscription does not itself provide API credits under the assumptions in the deployment decision.
- Configure the AI provider project spend limit at $5/month and disable automatic recharge. Provider-side enforcement may lag, so the application-level usage guard is also required and should stop new AI calls before the cap is reached.
- Supabase Free is the initial target, with acceptance that its current limits include 500,000 Edge Function invocations, a 150-second function limit, and possible project pause after seven days of low activity. Recheck current limits and terms before launch.
- If Supabase is paused, the static site can remain available, but search must display a temporary-unavailable message and explain that search is temporarily unavailable. Do not display a no-matches state.

## User flows

1. **Visitor opens the site:** The browser downloads the static website from GitHub Pages. No install or sign-in is required.
2. **Organizer searches:** The frontend sends opaque per-search person IDs and restrictions, without names, to the configured Supabase function. The function validates input, retrieves catalog evidence, invokes AI, validates catalog-backed citations and product constraints, and returns results keyed by person ID. The frontend maps those IDs to locally held names and presents loading, success, no-match, or error states distinctly.
3. **Search cannot run:** A paused project, exhausted budget, request limit, network issue, provider error, timeout, or invalid model response returns an error. The organizer sees **“There was an error. Please try again later.”**; the response is not represented as zero matches.
4. **Maintainer updates catalog:** An authorized maintainer reviews source-backed records and publishes reviewed changes to Supabase. The public function reads the reviewed catalog; it does not scrape arbitrary restaurant pages during user search.
5. **Team publishes a site update:** A reviewed code change triggers the static build and GitHub Pages deployment. The frontend's function URL and allowed origins must match the selected environments.

## States and edge cases

- **Static site:** build pending, build failed, published, or unavailable.
- **Search:** idle, submitting, validating, retrieving catalog evidence, awaiting AI, validating response, completed with full results, completed with partial results, completed with no matches, or failed/unavailable.
- **Budget and throttling:** within limits, request throttled, monthly AI guard reached, or provider account limit reached. These are service errors, not no-match outcomes.
- **Catalog:** no relevant records, stale evidence, conflicting sources, missing allergen guide, missing supporting evidence, or invalid catalog reference. Preserve uncertainty and citation constraints.
- **Origins/configuration:** allowed origin, disallowed origin, missing function configuration, and development origin not allowlisted.
- **Static export constraints:** Next.js features requiring a server must be identified and redesigned or removed before static publishing.
- **Supabase availability:** active, paused, over quota, function timeout, or database unavailable.
- **AI response:** timeout, provider rejection, malformed structured output, unsupported claims, or citation IDs outside the catalog. Do not silently convert these into `outcome: "none"`.

## Risks and mitigation

| Risk | Mitigation |
| --- | --- |
| Secret is accidentally included in a public build, repository, action log, or browser bundle | Keep secrets only in Supabase Function secrets; avoid passing them to static build jobs; review artifacts and workflows; rotate any exposed secret immediately. |
| Anonymous search endpoint is scripted or abused, causing cost spikes or denial of service | Treat it as public; validate and bound inputs; use server-side throttling, atomic budget reservations, token/time ceilings, provider spend controls, and anomaly alerts. Exact thresholds and abuse-control retention remain open. |
| CORS, a hidden endpoint URL, or a publishable key is mistaken for authentication | Do not treat origin, endpoint secrecy, or a public key as caller identity. Apply server-side request validation, throttling, and cost controls to every call. |
| A public table, view, or privileged function exposes or permits modification of catalog records | Keep search reads behind the function; set least-privilege grants and RLS; check views and RPCs; separate maintainer writes; do not place secret/service-role keys in the browser. |
| Malicious or misleading source text attempts prompt injection or induces fabricated menu advice | Review sources before publication, delimit excerpts as data, do not let source text authorize actions, grant no write/tools to the model, and validate output against evidence. |
| AI invents menu facts, citations, modifications, or unsupported safety claims | Require structured output and catalog ID/URL validation; enforce hard allergy/product rules after AI selection; preserve unknowns and display evidence/warnings. |
| Unsafe rendering of model/source text creates cross-site scripting or deceptive links | Render as escaped text; avoid raw HTML injection; permit only validated HTTPS catalog links and safe external-link behavior. |
| Group names or restrictions are persisted beyond the active search or retained in logs/provider records | Keep names in temporary frontend state, send only opaque IDs and restrictions, do not create group profiles, avoid raw payload logging, and define browser clearing, provider retention, and log retention before launch. |
| Model/provider or catalog errors are mistaken for no matches or safe choices | Fail closed when required evidence/validation is unavailable; use separate error states; never convert a processing failure to `outcome: "none"`. |
| Menu changes, conflicting facts, or a bad catalog edit lead to outdated recommendations | Store source links/check dates/review history, surface stale/conflicting facts, alert on suspicious changes, and preserve rollback to a prior reviewed version. |
| GitHub Actions supply-chain compromise or unreviewed change publishes malicious code | Limit workflow permissions, protect the publish branch, review changes, avoid secrets in untrusted PR runs, and pin/review third-party actions and dependencies. |
| Supabase Free pauses, reaches limits, or is unavailable | Monitor status and quota; show backend-unavailable separately from no matches; document restore/disable procedures. |
| Static export constraints or repository base paths break routes/assets | Identify server-only features early; use a configured static export and test the published path, direct links, and refresh behavior before release. |

## Acceptance criteria

- A published GitHub Pages URL can be opened in phone and desktop browsers without an app install or sign-in.
- Search requests go to the Supabase Edge Function, not a nonexistent static Next.js route.
- No AI key or database service-role key appears in browser assets, repository files, or public build configuration.
- Public search cannot insert, update, or delete reviewed catalog data; database grants, RLS, views, and function permissions are reviewed for least privilege.
- Search request size and structure, participant count, custom text, time, model tokens, and monthly spend are bounded server-side; concurrent usage cannot bypass the application budget guard.
- Group names and raw restriction payloads are not written to routine logs or persisted as user profiles; provider and log retention settings are documented.
- AI/source content is rendered as text, citations resolve to reviewed HTTPS source URLs, and no unvalidated model field can execute code or redirect users.
- A failed validation, missing evidence, or unavailable budget/accounting check cannot produce a confident recommendation or a false no-match result.
- Function responses cite only reviewed catalog source/evidence records and preserve the required allergy warnings, modification rules, group coverage, full-meal preference, and labeled side fallback.
- Meal ingredient displays distinguish a definitive ingredient list from ingredients mentioned in a menu description, tell users when reviewed sources do not state ingredients, and preserve unknown when evidence is incomplete or conflicting.
- Returned food names match the reviewed source names exactly; serving-role and configuration labels appear in their separate fields and description, not in the food title.
- Invalid requests, disallowed browser origins, throttling, provider failures, exhausted budget, and backend pause produce clear errors and never a false no-match result.
- Group restrictions are not persisted as profiles; logging and provider retention follow the agreed minimization policy.
- Search requests and AI prompts do not contain participant names; the frontend can still identify result owners by mapping response IDs to local names.
- An opened meal's description clearly identifies a full meal, a side (and says it is not a full meal), or an unclear serving role.
- Search API, network, timeout, and response-parsing errors show **“There was an error. Please try again later.”** and remain distinct from a successful no-matches result.
- Maintainers can identify backend health, budget state, failed searches, and catalog freshness without treating processing failure as missing allergen information.

## Dependencies and decisions

**Decisions in this plan:**

- GitHub Pages hosts static Next.js output.
- Supabase Postgres stores the reviewed catalog; a Supabase Edge Function provides search-time server execution.
- Runtime AI uses a server-side provider key, with a $5/month planned usage budget and automatic recharge disabled.
- Search is public and does not require visitor sign-in; restrictions are temporary.
- AI recommendations are catalog-backed, with deterministic validation for schema, citations, and product constraints.
- Supabase Free is the initial deployment assumption, including possible inactivity pauses.

**Dependencies and open decisions:**

- Create and configure the GitHub repository Pages deployment and Supabase project; confirm whether the repository is public and whether the current GitHub account/organization supports the intended Pages setup.
- Confirm the repository's GitHub Pages base path, final published origin, and any future custom domain.
- Decide development/staging origins and which origins may call the function.
- Agree with the frontend owner on the deployed function URL configuration and public client settings.
- Define the reviewed catalog schema and access policies with the menu catalog plan.
- Select the AI provider/model, structured output method, timeout, and maximum per-request input/output budget.
- Define request-size/participant limits, throttling policy, abuse controls, and the exact monthly usage accounting/reservation behavior under concurrent requests.
- Define maintainer authentication, catalog write permissions, secret rotation, and incident ownership.
- Agree on provider data retention, backend log redaction/retention, temporary group data handling, and search retry behavior.
- Decide the minimum database role/permissions used by search, whether any public catalog reads are needed outside the function, and how RLS/views/RPC grants will be reviewed.
- Set explicit rate, body-size, participant-count, text-length, timeout, token, response-size, and monthly guard limits; define concurrency-safe usage accounting and privacy-conscious throttling metadata.
- Define the GitHub Actions permission model, branch protection/review rules, dependency update process, artifact review, and credential rotation procedure.
- Confirm the exact HTTPS citation host validation policy, safe rendering/link behavior, and whether a static Content Security Policy is feasible for the selected host and frontend assets.
- Confirm Supabase project pause monitoring and the operational procedure to restore search.
- Verify current GitHub Pages, Next.js, Supabase, and provider pricing/limits before launch because these may change.

## Measurements and operations

Monitor and review:

- Static build/deployment success, published revision, and site availability.
- Search request count, validation failures, throttling, latency, and service-error rates.
- Function invocation and timeout usage; Supabase project status and quota/pause notifications.
- AI calls, estimated and provider-reported spend, budget-guard denials, token usage, and provider errors.
- Rejected requests by validation category, throttled requests, suspicious traffic patterns, and any short-lived abuse-control counters without recording raw allergy payloads.
- Catalog writes and reviewer approvals, policy/permission changes, secret rotations, and recovery events.
- Catalog lookup coverage, stale records, missing/conflicting evidence, and rejected citations.
- Search outcomes (full, partial, no matches) separately from failed/unavailable requests.
- Operational runbooks for secret rotation, changing allowed origins, resuming Supabase, and updating spend limits.

Exact alert thresholds and who receives alerts are TBD. Logs should not include unnecessary names, raw group restrictions, prompts, credentials, or full model output.

## Future implementations

- Add a custom domain while preserving strict origin allowlisting.
- Add a separate staging Supabase project and preview deployment workflow.
- Add more robust abuse prevention and usage analytics if anonymous traffic grows.
- Revisit hosting or Supabase tier if free-tier pauses, quotas, or function runtime become unsuitable.
- Add a controlled catalog refresh/review console after the static reviewed-catalog process is established.

## Future work

- Confirm open decisions above with Eliza and select account ownership/maintainer responsibilities.
- Align the search API contract with the Supabase function URL, CORS behavior, and stable error codes.
- Define schema, row-level access rules, function request limits, and monthly guard mechanics before coding.
- Review the threat model and decide privacy, rate-limit, least-privilege, CI/CD, model-validation, and incident-response details before public release.
- Implement and review the static export and Pages workflow, Supabase schema/function, secrets, and provider budget settings.
- Verify the acceptance scenarios, including disallowed origins, budget exhaustion, provider errors, and paused backend, before release.

## Edit history

| Date and time | Change |
| --- | --- |
| 2026-11-18 15:55 America/Denver | Created the initial GitHub Pages and Supabase AI search deployment plan from the approved deployment proposal. |
| 2026-11-18 16:19 America/Denver | Expanded security planning for the public endpoint, database permissions, secrets, AI inputs/outputs, privacy, CI/CD, abuse controls, and incident response. |
| 2026-11-18 18:28 America/Denver | Specified local-only participant names, ID-keyed search results, generic error copy, and serving-role descriptions on meal details. |
| 2026-11-18 19:20 America/Denver | Added validation and display requirements for ingredient-list versus description evidence and unstated/unknown ingredients. |
| 2026-11-18 19:39 America/Denver | Required names to resolve from validated catalog IDs and backend descriptions to carry explicit serving-role wording. |
