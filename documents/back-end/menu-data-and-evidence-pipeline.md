# Static Menu Catalog and Evidence Pipeline

## Summary

Food with Friends is a static site published on GitHub Pages. The first version uses a reviewed, version-controlled catalog of Utah County restaurants, menus, and allergen-related facts. Project maintainers gather information from internet sources, may use AI to prepare candidate structured data, verify the evidence, and commit the reviewed catalog. The browser applies deterministic matching rules. The public site does not call an AI service or require a runtime backend.

## Problem and goals

Restaurant menus and allergen details vary in source, completeness, and freshness. Users need recommendations that show where each fact came from, when it was checked, and how uncertain it is.

Goals:

- Publish a useful catalog for restaurants throughout Utah County using real menu information where feasible.
- Keep each menu fact traceable to its public source, supporting evidence, check date, and confidence.
- Use AI only as an assistive catalog-preparation tool; a maintainer reviews facts before publishing.
- Keep the website deployable as static files on GitHub Pages, with no secret credentials in client-side code.
- Match a group's restrictions consistently in the browser without presenting uncertain information as a safety guarantee.

## Users and permissions

- **Organizer:** Enters a group's names and dietary needs in the browser and views matches from the published catalog. Search state may remain temporary in the browser; no account is needed in v1.
- **Project maintainers:** Research internet sources, prepare or correct catalog records, verify evidence, and commit reviewed static data to the repository.
- Users cannot submit menus, upload images, or send reports in v1. Catalog changes are made by project maintainers through repository updates.

## Scope

**In scope:** Static restaurant/menu/allergen catalog; human-reviewed, AI-assisted data preparation; source and evidence metadata; deterministic browser-side matching and ranking; catalog validation; GitHub Pages build and publication.

**Out of scope:** Runtime backend service, database, job queue, user menu submissions/uploads, user reports, runtime AI recommendations, user accounts, persistent dietary profiles, automatic scheduled collection, and automatic web crawling.

## Requirements and behavior

### Catalog preparation and publication

1. Maintain a list of Utah County restaurants and public source URLs. Prefer official menus, restaurant websites, and statements; use third-party listings only as clearly identified secondary sources.
2. A maintainer retrieves menu information from the internet and may use AI to structure candidate restaurant, dish, ingredient/allergen, and possible-modification facts.
3. Verify each fact against its cited source and supporting evidence before committing it. AI output is a draft, not verified truth.
4. Store the reviewed catalog as static data in the repository. The exact file format and location are to be agreed with the frontend implementation.
5. A GitHub Pages build publishes the site and its catalog together. Updating the catalog requires a reviewed repository change and a new site publication; there is no live data-ingestion process.

### Catalog facts and uncertainty

Each restaurant should include its name, Utah County city, and available price information. Each menu item should retain its name and description, known ingredients/allergen statements, possible modifications when supported, source type and URL, supporting evidence, last-checked date, and a confidence label. Keep restaurant statements distinct from maintainer interpretation.

Represent `unknown` separately from an explicit source statement that an ingredient is absent. Missing information, stale sources, or conflicting evidence must not be interpreted as safety. A menu description alone does not establish preparation or cross-contact practices. Never describe a dish or restaurant as guaranteed allergen-free; advise users to confirm uncertain ingredients and preparation practices directly with the restaurant.

### Browser-side matching

The browser reads the published catalog and applies deterministic rules to the group's restrictions and severity levels from `project_specs.md`. Show dishes as-listed separately from options that may work with a stated modification. Prioritize restaurants where every group member has at least one suitable item. Keep uncertain restaurants visible with a warning and rank them below options with stronger evidence. A room-level restriction receives a strong warning and does not automatically hide a restaurant.

Matching code must not infer safety from missing facts. Keep the data contract separate from presentation so catalog updates do not require copying menu facts into UI components.

### GitHub Pages constraints

GitHub Pages serves static HTML, CSS, and JavaScript and does not run a persistent server-side backend. Use GitHub Actions or the configured Pages publishing process to build and publish static files. AI-assisted preparation must happen before publication; do not call AI from the browser or expose API credentials in the site. See [What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) and [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## User flows

1. **Catalog update:** A maintainer finds or refreshes an internet source, prepares candidate menu facts, verifies each fact against its evidence, updates the static catalog, and commits the reviewed change. The site is rebuilt and published from the updated repository.
2. **Restaurant search:** An organizer enters group members and their restrictions. The browser loads the published catalog, applies deterministic matching, and displays ranked restaurant and per-person dish suggestions with evidence, freshness, confidence, modifications, and warnings.
3. **Catalog unavailable or invalid:** The browser presents a clear data-loading or data-validation error and does not silently show incomplete results as reliable.

## States and edge cases

Handle absent menu details, conflicting sources, stale check dates, a source page that changes or disappears, duplicate restaurant/dish records, unsupported allergen claims, malformed catalog data, and failure to load the static catalog. Distinguish unknown facts from explicit source statements and from catalog/build errors. A source retrieval failure during manual research must not be recorded as evidence that a dish or allergen is absent.

## Risks and mitigation

- **False confidence about allergy safety:** Preserve evidence and uncertainty; never claim a dish is guaranteed safe; show restaurant-confirmation guidance.
- **AI extraction errors:** Require human verification against source evidence before committing facts.
- **Stale or conflicting menus:** Record source and last-checked date; show uncertainty and plan periodic maintainer review.
- **Public-data or source-link changes:** Keep source URLs attached to facts and recheck them when the catalog is updated. Follow applicable source terms when collecting and republishing information.
- **Static catalog omissions:** Validate required fields and references during the build; show a visible load/error state if the catalog cannot be used.
- **Secret exposure:** Keep AI assistance outside the browser and never commit keys or credentials to the public site repository.

## Acceptance criteria

- Published catalog entries cover Utah County restaurants and include source URL, source type, last-checked date, evidence, and confidence for relevant menu facts.
- AI-assisted candidate facts are reviewed by a maintainer before they are committed and published.
- The production site loads its catalog as static data and performs matching in the browser; it does not require an API server, runtime AI call, or client-side secret.
- Matching distinguishes known, unknown, and potentially modifiable information; applies the dietary severity and group-coverage priorities from `project_specs.md`; and displays uncertainty and room-level warnings correctly.
- Build validation catches malformed catalog data, missing required provenance, invalid references, and duplicate identifiers.
- Tests cover group matching, all four severity levels, modifications, incomplete/conflicting facts, room-level warnings, and catalog load/validation failures.

## Dependencies and decisions

- Confirmed: GitHub Pages static publication; Utah County catalog; no user menu uploads or reports in v1; AI-assisted preparation before release; maintainer review; deterministic browser-side matching.
- The catalog's exact schema, file format, and location must be agreed with the frontend data contract.
- Source collection and publication are manual/as-needed in v1. The refresh cadence and stale-data threshold remain to be decided.
- Static catalog content is public once deployed. Do not store private or user-specific data in it.
- GitHub Pages is a static host. If future requirements need runtime AI, dynamic ingestion, user reports, or a server-side database, plan and host a separate backend service rather than embedding credentials in the site.
- Automated crawling, scheduled AI extraction, user feedback, persistent profiles, and allergy-care ratings remain future-feature decisions.

## Measurements and operations

Track catalog coverage across Utah County, the share of menu facts with evidence and current check dates, the number of stale/conflicting/unknown facts, and catalog validation/build failures. Maintainers review source changes as part of catalog updates. No runtime processing queue or backend service is operated in v1.

## Future implementations

- Automated, human-reviewed catalog update proposals through a separate ingestion workflow.
- User reports or restaurant-submitted corrections with moderation.
- Persistent dietary profiles and saved searches.
- Runtime backend services if dynamic data, live AI, or user-submitted content becomes necessary.

## Future work

- Agree with the frontend owner on the static catalog schema, location, and browser matching interface.
- Choose the data validation and test approach that fits the frontend build tooling.
- Define how often maintainers review sources and when data is considered stale.
- Build a representative Utah County catalog and a test/evaluation set for extracted facts and matching outcomes.
- Document source collection and review steps so catalog updates are repeatable.

## Edit history

| Date and time | Change |
| --- | --- |
| 2026-11-16 23:28 America/Denver | Created the initial menu data and evidence pipeline plan. |
| 2026-11-18 14:15 America/Denver | Reframed the plan for GitHub Pages, a reviewed static Utah County catalog, and no user submissions. |
