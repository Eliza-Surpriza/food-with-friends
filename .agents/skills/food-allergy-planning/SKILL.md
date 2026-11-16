---
name: food-allergy-planning
description: Create and maintain structured frontend and backend feature plans for a restaurant discovery website and web app for people with food allergies.
---

# Food Allergy Feature Planning

Use this skill when planning, refining, or documenting a feature for the food allergy restaurant discovery website or web app.

## Planning workflow

1. Read the root `project_specs.md` before creating a planning document. Use it as the shared product context for applicable requirements, including the target users and geography, dietary restriction severity, restaurant search and ranking behavior, menu data sources and trust, and stated later features. Reflect relevant requirements in the plan without copying unrelated specification text.
2. Identify the feature and whether it needs a front-end plan, a back-end plan, or both. Keep one feature per document; when both are needed, create a related document in each folder and link them.
3. Review relevant project files and existing plans, as well as `project_specs.md`, before asking questions. Ask the user targeted questions about the parts of the plan that are unknown, ambiguous, or conflict with the specification. Group related questions into a short batch, and ask follow-ups only for decisions that materially affect the plan. Do not make up product, policy, medical, data, or implementation decisions. Record unresolved items as open questions or TBD. If `project_specs.md` is missing or unreadable, tell the user and ask for it or permission to proceed with that context marked unknown.
4. Use the user's answers, `project_specs.md`, and repository evidence to write a decision-ready plan. Treat newer explicit user decisions as updates to prior specification assumptions, and record material changes or unresolved conflicts under Dependencies and decisions. Separate confirmed requirements from assumptions, open decisions, and future ideas.
5. Save plans under `documents/front-end/` and `documents/back-end/`, creating the needed folders. Use a concise, stable feature slug for filenames, such as `restaurant-search.md`. Keep the user-facing document content in these folders; do not put planning documents elsewhere.
6. When changing an existing plan, preserve its useful content and history. Add a new history row for every changed planning document, with the local date and time, timezone or UTC offset, and a short description of the change. Do not rewrite old history entries. A newly created document gets a creation entry.

## Required plan sections

Every feature plan must include these sections, in this order:

1. Summary
2. Problem and goals
3. Users and permissions
4. Scope
5. Requirements and behavior
6. User flows
7. States and edge cases
8. Risks and mitigation
9. Acceptance criteria
10. Dependencies and decisions
11. Measurements and operations
12. Future implementations
13. Future work
14. Edit history

Use concise, feature-specific content in every section. If a section is not yet known or does not apply, say so and explain what needs clarification; do not silently omit it. Keep "Future implementations" for plausible later capabilities and "Future work" for deferred or follow-up tasks.

## Product context and safety

This product helps people with food allergies find restaurant food options. Plans should make allergy-related information and its limits explicit: distinguish restaurant-provided, verified, and user-reported information; consider ingredient changes and cross-contact; describe how freshness and corrections are handled; and never promise that a dish or restaurant is allergen-free unless the product has a clearly defined, supportable basis for that claim. Include relevant safety, privacy, abuse, accessibility, and operational risks for the feature rather than assuming they are handled elsewhere.

For front-end plans, describe screens, interactions, responsive/accessibility behavior, loading, empty, error, and success states, and the user's path through the feature. For back-end plans, describe data, validation, permissions, APIs or integrations, persistence, failure handling, privacy/security, monitoring, and operational responsibilities as relevant. Avoid choosing a technical design before its constraints and dependencies are understood.

## Edit history format

Put a compact table in the final section:

| Date and time | Change |
| --- | --- |
| YYYY-MM-DD HH:MM America/Denver | Created the initial feature plan. |

Use the actual edit time and the environment's local timezone when available; otherwise use an explicit UTC timestamp. Keep the description brief and specific. Add an entry whenever any part of that document changes, including clarifications, scope changes, and acceptance-criteria edits.
