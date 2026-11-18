# Food with Friends - Work Board

Use this file to record each person's current focus and track tasks. Check a task off when it is complete; add or reprioritize items as the project decisions become clearer.

Status: `[ ]` not started / `[~]` in progress / `[x]` done

## Current focus

- **Mary - Backend:** [ ] Choose the backend stack and agree on the first API/data contract with Eliza.
- **Eliza - Frontend:** Add current focus here.

## Mary - Backend

### 1. Decide the backend foundation

- [ ] Choose backend language/framework and project structure.
- [ ] Choose database and initial hosting/deployment target.
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

- Add what you are working on here.

### Task list

- Add frontend tasks here and link backend dependencies or API questions that need coordination.

## Shared decisions and blockers

- [ ] Record the selected backend stack and deployment target.
- [ ] Record agreed API contracts and any frontend/backend dependencies.
- [ ] Decide temporary-session expiration, supported image types/size limits, and stale-data thresholds.
- [ ] Decide how internal maintainers access the source list and review/report queues.

## Project references

- Product requirements: [`project_specs.md`](project_specs.md)
- Backend menu data plan: [`documents/back-end/menu-data-and-evidence-pipeline.md`](documents/back-end/menu-data-and-evidence-pipeline.md)
