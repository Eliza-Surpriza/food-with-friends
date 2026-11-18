# Food with Friends - Work Board

Use this file to record each person's current focus and track tasks. Check a task off when it is complete; add or reprioritize items as the project decisions become clearer.

Status: `[ ]` not started / `[~]` in progress / `[x]` done

## Current focus

- **Mary - Backend/data:** [ ] Agree with Eliza on the static catalog format and data fields needed for matching.
- **Eliza - Frontend:** Add current focus here.

## Mary - Backend/data

### 1. Define the static catalog contract

- [ ] Agree with Eliza on the catalog format, file location, restaurant/item fields, and how the browser imports the data.
- [ ] Define stable IDs for restaurants, sources, and menu items so updates do not create accidental duplicates.
- [ ] Define provenance fields: source type and URL, supporting evidence, last-checked date, confidence, and whether a fact is restaurant-stated or maintainer-interpreted.
- [ ] Represent `unknown` separately from an explicit statement that an ingredient/allergen is absent.
- [ ] Document which values are source data and which are computed by matching logic.

### 2. Build a repeatable Utah County source and curation process

- [ ] Create an inventory of Utah County restaurants and public menu/allergen sources, preferring official restaurant sources.
- [ ] Record source URLs and check dates; identify third-party sources clearly when official details are unavailable.
- [ ] Use AI to help structure candidate menu facts from source material, then verify each fact and evidence by hand before committing it.
- [ ] Keep uncertain, conflicting, stale, or unsupported facts explicitly unknown or qualified; never infer that a dish is allergen-free from missing details.
- [ ] Define a manual/as-needed source refresh process and update the catalog through reviewed repository changes.

### 3. Implement deterministic recommendation matching

- [ ] Build a browser-compatible matching module that consumes the static catalog and a group's dietary restrictions.
- [ ] Apply all four restriction severity levels from `project_specs.md`.
- [ ] Distinguish suitable-as-listed items, items that may work with an explicit modification, and uncertain items.
- [ ] Rank restaurants by whether every group member has at least one suitable item; allow different members to match different dishes.
- [ ] Keep uncertain options visible with warnings and lower ranking; show a strong warning for room-level restrictions without automatically hiding the restaurant.
- [ ] Never describe a restaurant or dish as guaranteed allergen-free; include restaurant-confirmation guidance for uncertain ingredients and preparation.

### 4. Validate, test, and coordinate

- [ ] Add catalog validation for required provenance, valid references, stable/unique IDs, and malformed data.
- [ ] Build representative Utah County menu fixtures with known, unknown, modified, conflicting, and stale facts.
- [ ] Test group coverage, each severity level, modifications, uncertain ranking, room-level warnings, and catalog load/validation errors.
- [ ] Coordinate with Eliza on the exact matching input/output and fields needed to show source links, check dates, confidence, and warnings.
- [ ] Ensure menu content is rendered safely as data, not trusted executable markup.

### 5. Publish and maintain the static data

- [ ] Confirm the GitHub Pages build includes the catalog and publishes it with the frontend.
- [ ] Add build checks so invalid catalog data blocks publication.
- [ ] Keep AI assistance outside the public browser; do not add API keys or secrets to the site.
- [ ] Document how to research, review, update, and publish catalog changes.
- [ ] Track catalog coverage, evidence completeness, freshness, and validation failures as manual release checks.

## Eliza - Frontend

### Current focus

- [ ] Agree with Mary on the frontend foundation, first screen flow, and static catalog/matching contract for group searches and restaurant results.

### Task list

#### 1. Define the frontend foundation and contract

- [ ] Review the repository setup with Mary and choose the frontend framework, build tooling, styling approach, and local development workflow.
- [x] Create a low-fidelity clickable prototype of the mobile-first group setup flow in [`wireframe.html`](wireframe.html): welcome, person details, need selection, group review, and results entry point.
- [ ] Start the flow at the first person's nickname-and-needs screen after Welcome; use a checkmark to return to the group screen and a search icon there to open restaurant results.
- [ ] Agree with Mary on the static data and matching output needed for participants, restrictions and severity, per-person menu matches, modifications, source evidence, warnings, restaurant city, and prices.
- [ ] Define catalog loading, invalid-data, and incomplete-information states; there is no runtime menu-processing progress in v1.
- [ ] Confirm temporary-search behavior in the browser, including whether group state is kept only in memory or in browser storage and when it is cleared.

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

- [ ] Apply group needs to the published static catalog with deterministic browser-side matching; do not request the user's location and search the Utah County restaurant set.
- [ ] Show a ranked restaurant list, prioritizing restaurants where every person has at least one suitable item. Do not require everyone to choose the same dish.
- [ ] Show each restaurant's city and the most specific price information available.
- [ ] For each restaurant, show the suitable menu items by person and distinguish items suitable as listed from items that may work with a stated modification.
- [ ] Show the source link, last-checked date, confidence label, and relevant ingredient or cross-contamination warnings for each menu item.
- [ ] Keep uncertain results visible with clear warnings and place them below results with stronger supporting information.
- [ ] Show a strong warning for room-level restrictions while allowing the user to decide whether to consider that restaurant.
- [ ] Tell users to confirm uncertain ingredients and preparation practices with the restaurant; never label a dish as guaranteed allergen-free.

#### 5. Handle search and result states

- [ ] Design a catalog-loading state and clear errors if the static catalog is unavailable or invalid; matching runs in the browser and does not wait on menu processing.
- [ ] Design useful empty states for no restaurants, no suitable items for a person, and incomplete menu information.
- [ ] Handle backend/network errors and stale or missing source details without presenting unknown information as safe.
- [ ] Let the organizer edit group needs and search again without rebuilding the group from scratch.

#### 6. Integrate and polish

- [ ] Connect the screens to the static catalog and matching contract agreed with Mary; use clearly labeled sample data only while those are being built.
- [ ] Check keyboard navigation, screen-reader labels, focus handling, readable warning hierarchy, and layouts at mobile and desktop widths.
- [ ] Walk through the complete group-entry-to-results flow with representative group needs and menu results; record and fix issues before release.

#### Later frontend features

- [ ] Add cuisine and price filters after the core matching flow is working.
- [ ] Consider a map view alongside the ranked list.
- [ ] Consider saving dietary profiles for reuse; persistent profiles are not part of the first version.

## Shared decisions and blockers

- [ ] Record the static catalog format/location and agreed frontend matching contract.
- [ ] Record how AI-assisted facts are reviewed and how catalog updates are published to GitHub Pages.
- [ ] Record the selected frontend stack, app structure, and local development workflow.
- [ ] Decide how often maintainers review menu sources and when a fact is considered stale.
- [ ] Confirm that user menu submissions and reports are out of scope for v1.

## Project references

- Product requirements: [`project_specs.md`](project_specs.md)
- Backend menu data plan: [`documents/back-end/menu-data-and-evidence-pipeline.md`](documents/back-end/menu-data-and-evidence-pipeline.md)
