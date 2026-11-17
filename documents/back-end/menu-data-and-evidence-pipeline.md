# Menu Data and Evidence Pipeline

## Summary

Define a backend pipeline that turns internally curated restaurant sources and user-submitted URLs or menu images into traceable menu facts. AI extracts candidate information; deterministic rules and a separate recommendation service consume those facts. Keep the backend technology stack open.

## Problem and goals

Restaurant menus and allergen details vary in source, completeness, and freshness. The backend must preserve the evidence, source, check time, and uncertainty behind each extracted fact so the product can present useful recommendations without implying that a dish is guaranteed safe.

Goals:

- Build a maintainable Utah Valley restaurant and menu catalog using real sources where feasible.
- Keep source provenance, supporting evidence, freshness, and confidence visible to downstream features.
- Provide temporary, private previews from organizer-submitted URLs and menu images.
- Require internal review before user-submitted information becomes shared catalog data.
- Treat AI output as candidate data; do not have AI make unsupported safety guarantees.

## Users and permissions

- **Organizer:** Submits a URL or image for a temporary private search preview. The submission cannot change shared data directly.
- **Internal maintainer:** Manages the curated source list, reviews submissions for shared use, and follows up on reports. Access is restricted to internal maintainers; the authentication mechanism is TBD with the backend stack.
- **Report submitter:** Reports a concern about menu information. A report enters an internal follow-up queue and does not directly edit or suppress a fact.
- Persistent user accounts and dietary profiles are out of scope for v1. Associate private submissions with a temporary search/session; its exact token and expiration policy remain TBD.

## Scope

**In scope:** Internal restaurant/source registry; weekly checks of curated sources; URL and image intake for private previews; AI extraction and evidence capture; temporary image processing; review gating before shared publication; user reports; a read interface for recommendation logic.

**Out of scope:** Selecting a framework, database, hosting provider, queue, AI provider, or maintainer identity provider; persistent dietary profiles; automatic source discovery; the detailed restaurant matching and ranking algorithm; direct user edits to menu facts.

## Requirements and behavior

### Pipeline responsibilities

1. Maintainers add and maintain restaurant sources, preferring official menus, restaurant websites, and restaurant statements.
2. A scheduled job checks curated sources weekly. A maintainer can also trigger a check on demand. Record each attempt and its outcome.
3. Organizers may submit a URL or image. Process it for their temporary private preview. It does not enter shared restaurant data until an internal maintainer reviews and approves the extracted information.
4. AI extracts candidate restaurant, menu item, ingredient/allergen statements, and possible modifications. Capture source evidence for each relevant fact, not only a general citation for the whole menu.
5. Persist approved, sourced facts in the shared catalog. Expose the catalog through a technology-neutral read interface for downstream matching.
6. Accept user reports on menu or allergen information and route them to internal follow-up. Reports do not automatically modify, hide, or reclassify facts.

### Evidence and uncertainty

Each stored fact must be traceable to a restaurant and menu item, source URL or submission origin, source type, supporting text or image-derived text, retrieval/last-checked time, confidence, and extraction version. Distinguish restaurant-provided statements from AI-derived interpretations and user-reported information.

Represent unknown separately from an explicit statement that an ingredient or allergen is absent. Missing menu details, unsupported extraction, stale sources, or conflicting evidence must not be interpreted as safety. A menu description alone does not establish preparation or cross-contact practices.

For downstream matching, preserve enough information to distinguish an item as listed, an item that may work with a clearly stated modification, and an uncertain item. Deterministic rules apply the group's restriction severity. They must preserve the `project_specs.md` requirements that group coverage is the highest ranking priority, uncertain items remain visible with warnings and lower rank, and room-level restrictions receive a strong warning rather than automatic exclusion.

Never present a dish or restaurant as guaranteed allergen-free. When information is uncertain or incomplete, advise the organizer to confirm ingredients, preparation practices, and cross-contact directly with the restaurant.

### Submission privacy and validation

- Keep user-submitted source content private to the submitting temporary search until reviewed.
- Delete uploaded menu images after processing. Retain extracted evidence and source metadata with the temporary preview, subject to its TBD session expiration. For review, retain extracted evidence in the pending record, not the original image.
- Validate URLs and uploads, cap processing resources, and restrict URL fetching to public sources. Do not allow submitted URLs to reach private network or local services.
- Define supported image formats, upload limits, URL rules, and session expiration when the chosen stack and deployment limits are known.

### Service interfaces

Keep contracts technology-neutral. The backend must provide:

- Maintainer operations to add/update curated sources, inspect check status, and start an on-demand check.
- Submission intake for a URL or image, returning a private processing identifier and status.
- A private preview result/status read associated with the temporary search.
- Maintainer review operations to approve or reject user-submitted candidate facts before shared publication.
- User report intake and a maintainer follow-up queue.
- A read-only menu-facts interface for recommendation logic, including provenance, evidence, freshness, confidence, and uncertainty.

Exact routes, request schemas, authentication, and storage formats depend on the technology stack and are open decisions.

## User flows

1. **Curated source refresh:** A maintainer registers an official menu source. The weekly job fetches it, records the check, extracts candidate facts, and updates the shared catalog only through the appropriate maintainer review process. Failed fetches remain processing failures; they do not mean that a menu item or allergen is absent.
2. **Private URL/image preview:** An organizer submits a URL or image. The backend validates it, creates a processing job, extracts candidate facts and evidence, deletes the image after processing, then returns a private preview with source, freshness, confidence, and warnings. The organizer may submit the information for internal review for possible shared use.
3. **Report a concern:** An organizer reports incorrect or concerning information. The system records the affected fact and report context, then makes it available for internal follow-up without changing recommendation data automatically.
4. **Downstream matching:** Recommendation logic reads sourced menu facts and applies deterministic restriction rules. Its detailed behavior is defined in a separate plan.

## States and edge cases

Processing state should distinguish `queued`, `processing`, `completed`, `needs_review`, and `failed`. Review state should distinguish `pending`, `approved`, and `rejected`.

Handle unreachable or changed pages, redirects, duplicate sources and dishes, incomplete menus, unsupported or unreadable images, missing evidence, low confidence, stale facts, contradictory sources, AI/provider errors, report submission errors, and expired private previews. Keep processing failure distinct from a successful extraction whose facts are unknown or incomplete. Preserve previous shared facts with their previous source/check timestamps when a refresh fails; mark their freshness for downstream warning rather than silently replacing them.

## Risks and mitigation

- **False confidence about allergy safety:** Require evidence and confidence per fact, keep unknown explicit, and show warnings and restaurant-confirmation guidance.
- **Stale or conflicting menus:** Track last-checked times and source precedence; expose disagreement and stale status to downstream matching.
- **AI extraction errors:** Use AI only to propose facts, retain evidence, track extraction version, and evaluate extraction on representative menus before relying on it.
- **Unsafe or abusive URL/image submissions:** Validate and limit inputs, isolate files, restrict fetching to public sources, and cap processing resources.
- **Privacy or unintended sharing:** Bind previews to a temporary search, gate catalog publication on maintainer approval, and delete original images after processing.
- **Operational backlog:** Measure source failures and review queue age; give maintainers a way to inspect failures and pending items.

## Acceptance criteria

- Curated sources are checked weekly, and each stored fact can be traced to its source, evidence, confidence, extraction version, and check date.
- Organizers can submit a URL or image and receive a private preview; user-submitted facts cannot enter shared data before internal approval.
- Uploaded images are deleted after processing, while the extracted evidence remains available for the preview or pending review until its applicable retention period expires.
- Unknown, incomplete, stale, and conflicting information remains distinct from an explicit allergen-free claim.
- Reports are routed for internal follow-up and do not automatically edit, hide, or reclassify facts.
- Downstream matching can distinguish known, unknown, and potentially modifiable information and can apply the severity, group coverage, uncertainty ranking, and room-level warning requirements from `project_specs.md`.
- Test coverage includes extraction failure, stale and conflicting sources, unsupported images, private-preview isolation, publication review gating, image deletion, and report handling.

## Dependencies and decisions

- The backend stack and corresponding database, queue, hosting, AI provider, and maintainer authentication are intentionally open.
- Internal maintainers own the curated URL list and review submissions before they enter shared data.
- Curated source refresh cadence is weekly; maintainers may trigger a check on demand.
- User submissions may be used for private previews before review. Shared publication requires internal approval.
- Uploaded images are deleted after processing; extracted evidence and metadata are retained with the temporary preview or pending review record until an expiration policy is defined.
- The exact temporary-session lifetime, image format/size limits, URL rules, evidence schema, and stale-data thresholds need to be set alongside the selected stack and deployment constraints.
- The next backend feature plan should cover deterministic recommendation matching and ranking. The project spec also lists restaurant allergy-care ratings as a later feature; keep those separate from evidence extraction and user reports.

## Measurements and operations

Track source-check success/failure and freshness, extraction success/failure and confidence distribution, unsupported/low-evidence results, review queue volume and age, user report volume, and processing latency. Maintainers must be able to identify failed checks and pending reviews. A failed fetch or extraction must never be surfaced as evidence that an item lacks allergens.

## Future implementations

- Restaurant staff source management.
- Persistent dietary profiles and saved searches.
- Broader automated source discovery and enhanced menu parsing.
- Restaurant allergy-care ratings as specified in `project_specs.md`.

## Future work

- Select the backend stack and define its data, job, and service contracts.
- Set temporary-session retention, image limits/formats, URL validation rules, and stale-data thresholds.
- Build an extraction evaluation set with representative official menus, third-party sources, and menu images.
- Create the separate recommendation-service plan for group coverage, restriction severity, modifications, uncertainty, and ranking.

## Edit history

| Date and time | Change |
| --- | --- |
| 2026-11-16 23:28 America/Denver | Created the initial menu data and evidence pipeline plan. |
