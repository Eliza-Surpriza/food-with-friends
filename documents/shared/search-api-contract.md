# Group Search API Contract

**Status:** Proposed for Mary and Eliza to confirm against the catalog and deployment design before implementation.

## Purpose

Accept a group's dietary restrictions and return Utah Valley restaurant suggestions chosen by a server-side AI service from the reviewed menu catalog. The search operation does not ask for location or fetch restaurant websites. AI-assisted extraction happens before publication; search-time AI selects and explains catalog-backed suggestions for the current group.

## Request

`POST /api/search`

```json
{
  "people": [
    {
      "id": "p1",
      "name": "Anna",
      "restrictions": [
        { "type": "peanuts", "severity": 4 },
        { "type": "custom", "label": "coconut", "severity": 2 }
      ]
    }
  ]
}
```

### Request rules

- `people` contains the participants whose restrictions should be considered for this search.
- `id` is stable within this search and lets the response point back to the right person.
- `name` is a required, group-unique nickname.
- `restrictions` may be empty.
- `type` is a supported restriction key, or `custom` when the organizer supplied a free-text `label`.
- `severity` is an integer from 1 to 4:
  - `1`: I'd rather not have it
  - `2`: I won't eat this (default)
  - `3`: I can't eat anything that touches this
  - `4`: I can't be in a room with this

## Response

The response has an `outcome` of `full`, `partial`, or `none`.

```json
{
  "outcome": "partial",
  "matches": [],
  "partialGroups": [
    {
      "personIds": ["p1", "p2"],
      "restaurants": [
        {
          "id": "r1",
          "name": "Restaurant name",
          "city": "Provo",
          "price": "$12–$20",
          "sources": [],
          "warnings": [],
          "people": [
            {
              "personId": "p1",
              "meals": [
                {
                  "id": "m1",
                  "name": "Meal name",
                  "price": "$14",
                  "matchStatus": "as_listed",
                  "servingRole": "side",
                  "servingRoleBasis": "The menu lists this under sides.",
                  "recommendationReason": "...",
                  "modification": null,
                  "description": "...",
                  "ingredients": [],
                  "imageUrl": null,
                  "sources": [],
                  "citations": [],
                  "warnings": []
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Response rules

- `outcome: "full"`: `matches` contains restaurants with at least one meal for every participant; `partialGroups` is empty.
- `outcome: "partial"`: no restaurant covers everyone; `partialGroups` contains groups of people who have suitable meal options at the listed restaurants; `matches` is empty.
- `outcome: "none"`: neither full nor partial matches exist; both arrays are empty.
- Return restaurants in ranking order. Order partial groups by participant count, largest first. A restaurant may appear in more than one partial group.
- Each restaurant includes its `city`, best available `price` string (or `null` if unknown), restaurant-level `sources` and `warnings`, plus meal options grouped by `personId`.
- The AI recommendation service selects and ranks meals from the published catalog for each person. The AI may suggest a menu-backed modification, but cannot invent dishes, ingredients, restaurant policies, or sources.
- The service sends the full group to the AI so it can prioritize shared restaurant coverage. Deterministic post-validation checks schema, catalog source IDs, known conflicts, and required warnings; it does not choose or rank the meals.
- Each meal's `matchStatus` is `as_listed`, `modification`, or `uncertain`. Include the suggested `modification` when relevant, phrased as a request to the restaurant where appropriate (for example, ask for a salad without croutons).
- Each meal includes `servingRole`: `full_meal`, `side`, `snack`, `drink`, or `unknown`, plus `servingRoleBasis`. State when it appears to be only a side or when the menu does not make the role clear; do not overstate portion size or completeness.
- Prefer a suitable `full_meal` for each person. For a person at a restaurant with no suitable full-meal option, a suitable `side` may be returned as a fallback and must be clearly labeled. Do not describe a side as a full meal.
- `recommendationReason` briefly explains why the AI selected the item and what evidence or uncertainty matters. Do not call an item safe or allergen-free.
- Each meal includes `description`, `ingredients`, optional `imageUrl`, and meal-level `sources` and `warnings`.
- A source record should include its URL, source type (including menu or allergen guide), last-checked date, and confidence. Keep restaurant-level and meal-level provenance distinct. Where a recommendation depends on an ingredient, allergen, preparation, modification, or serving-role fact, include the supporting evidence in `citations` or a catalog evidence ID the frontend can resolve.
- Each citation should resolve to a catalog source ID and include the direct URL, source label/type, last-checked date, and supporting excerpt or source location when available. If no allergen guide exists, make that absence explicit instead of implying that a guide was checked.
- Citations must come from the reviewed catalog and link directly to the relevant menu and allergen guide when available. The service must reject or omit an AI citation whose source ID is not in the catalog; it must not fabricate URLs or evidence.
- Missing ingredient or cross-contamination information remains unknown; it must not be presented as evidence that a meal is safe.
- AI suggestions must follow the severity meanings in `project_specs.md`. For cross-contact concerns, merely removing an ingredient is insufficient without supporting restaurant preparation evidence. A room-level restriction retains a strong restaurant warning and is not automatically hidden.
- The frontend uses `outcome` to show best matches, partial matches, or the no-matches screen with an **Edit group** action.

## Errors

- A successful search returns a complete result from the published catalog and AI recommendation service. The frontend shows a loading state while the request is in progress; menu extraction does not run during this request.
- Invalid input returns an appropriate 4xx response. Unexpected service failures return a 5xx response.
- Error bodies use `{ "error": { "code": "...", "message": "..." } }`; the message is safe to show to the organizer.
- Model timeout, provider failure, malformed output, or invalid citations must not be converted to `outcome: "none"`; return a clear error or the explicitly agreed degraded response.
- If search later needs to trigger menu ingestion or other long-running work, define an asynchronous job/status contract separately rather than keeping this request open.

## Decisions to confirm together

- Confirm whether `id` values are generated by the frontend and whether any additional session identifier is needed.
- Confirm the exact supported `type` keys for common restrictions and custom entries.
- Confirm the deployment target and whether this is a Next.js Route Handler or another server-side function. Runtime AI must not run in a public browser; a GitHub Pages-only deployment needs a separate protected API host for `POST /api/search`.
- Confirm the precise source, ingredient/allergen fact, and evidence shapes before implementation.
- Choose the AI provider/model and agree on timeout, cost limits, private handling of temporary group restrictions, and whether model failures return an error or an approved fallback.
- Future contract extension: add an optional meal preference (full meals only vs. allow sides as fallbacks) after deciding whether the preference applies per person or to the whole group. Until then, use the default full-meal-first behavior.

## Change history

| Date and time | Change |
| --- | --- |
| 2026-11-18 14:48 America/Denver | Clarified the contract searches reviewed catalog data; AI extraction is a pre-publication process. |
| 2026-11-18 15:02 America/Denver | Changed search-time selection to AI recommendations with meal-role labels and catalog-validated citations. |
| 2026-11-18 15:03 America/Denver | Clarified that AI performs selection/ranking and validation enforces citations and hard constraints. |
| 2026-11-18 15:10 America/Denver | Added full-meal priority with a labeled side fallback and deferred meal-preference input. |
