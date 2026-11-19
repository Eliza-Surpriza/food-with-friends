# Food with Friends

## Product overview

Food with Friends is a mobile-forward web app that helps a group choose restaurants where everyone can find something suitable for their dietary needs. The first version will focus on restaurants throughout Utah Valley and use real restaurant and menu information where feasible.

## Group and dietary needs

- One organizer enters the dietary needs for the whole group.
- The organizer must enter a name or nickname for each person. Results use it to identify who each suggested meal is for.
- Names or nicknames must be unique within the group.
- Keep names/nicknames in temporary frontend state only. For search, send an opaque per-search person ID and that person's restrictions; do not send the name to the backend or AI provider. Use response person IDs to map results to names held locally.
- Each person can have multiple dietary needs. The app should offer common options and let the organizer add a custom restriction when needed.
- Show specific restriction choices directly in the main list; do not require selecting a broad category and then expanding it.
- Suggested common options include vegetarian, vegan, gluten-free, dairy-free, peanuts, tree nuts, shellfish, finfish, eggs, soy, sesame, and wheat. The list can be refined as needed.

### Group setup flow

- After the welcome screen, go directly to entering the first person's nickname and dietary needs; do not show a separate “Who are you eating with today?” step.
- Require a unique nickname before saving a person, including when they have no dietary needs.
- Each person's details screen lets the organizer add dietary needs. Choosing **Custom** opens text entry for a custom need.
- Add one need at a time: selecting a specific option adds that need at the default severity and returns to the person's details screen. The organizer can use **+** again to add another.
- A person may have no dietary needs. The organizer can enter a nickname and save immediately without adding a need; an empty needs list is valid.
- New needs use the default severity, **“I won't eat this.”** The organizer can change severity from the person's details screen by tapping that need's severity indicator. The picker explains all four severity levels.
- A checkmark saves the person's details and returns to the group screen.
- The group screen shows each person's name plus a summary of their dietary needs and severity indicators. It lets the organizer add another friend using the same nickname-and-needs flow. Tapping a person's name opens their details so the organizer can review or edit them.
- Show a color marker for each need in the group summary: green for “I'd rather not have it,” yellow for “I won't eat this” (default), orange for “I can't eat anything that touches this,” and red for “I can't be in a room with this.” Provide an accessible severity label as well, so meaning does not rely on color alone.
- On a person's details screen, each dietary need has its own **X**; tapping it asks for confirmation and names the specific need, for example, “Remove peanuts?”
- Tapping a person's **X** asks for confirmation and names the person, for example: “Are you sure you want to remove [nickname]?”
- The search icon on the group screen opens restaurant results.

Use this severity scale for each restriction:

1. **I'd rather not have it** — The person might be open to suggestions that include it as an ingredient.
2. **I won't eat this** — Default severity.
3. **I can't eat anything that touches this** — Cross-contamination is a concern.
4. **I can't be in a room with this** — Most severe; potentially life-threatening.

## Restaurant search and recommendations

- Search all restaurants in Utah Valley; do not ask for the user's location.
- The main result view is a ranked list. A map could be a useful addition.
- The highest ranking priority is whether every group member has at least one suitable menu item. People do not need to share the same dish.
- If no restaurant works for everyone, show partial matches grouped by the people each restaurant works for. A restaurant may appear in more than one group, and groups covering more people appear first.
- If no restaurant works for anyone in the group, show a **No matches** state with an option to edit the group and search again.
- Selecting a restaurant opens its detail page. Show each person's meal ideas in a horizontally scrollable row; the page itself can scroll vertically for more information.
- Keep an **Edit group** control available on the results, restaurant, and meal pages so the organizer can revise the group at any point during browsing.
- Selecting a meal idea opens a separate meal detail page with its restaurant-sourced menu name, description, ingredients, price, sources, and warnings. Keep the name exactly as the restaurant names the item; do not append serving role, category, or descriptive qualifiers to the name or title. Show an image when one is available; omit the image area when none is available. Identify the person it is for and whether it works as listed or needs a modification. In the description, clearly state whether the item is a full meal, a side dish (and that it is not a full meal), or unclear based on the menu.
- Show specific menu items for specific people, including the person's name or nickname.
- Show items that appear suitable as listed separately from items that may work with a modification. Clearly state the suggested modification, such as omitting cheese.
- Show each restaurant's city and the most specific price information available, such as an entrée price range when listed.
- When useful menu information is uncertain or incomplete, include the restaurant with a clear warning and rank it below restaurants with stronger evidence of suitable dishes.
- For a room-level restriction, show the restaurant with a strong warning so the user can decide whether to consider it; do not automatically hide it.
- When information is uncertain, tell the user to check with the restaurant before relying on the recommendation.
- Use an AI recommendation service to select and rank menu items from the reviewed catalog for the current group's restrictions. Preserve the restaurant-sourced menu name exactly in the API response and frontend title; do not append labels such as “Full Meal,” “Side,” or “configurable menu item.” Put serving role and configuration details in the description or their separate fields. AI may suggest a clearly stated modification, such as asking for a salad without croutons, and should say whether the item appears to be a full meal, a side, or unclear.
- Prioritize a suitable full meal for each person. If a restaurant has no suitable full-meal option for a person, offer a suitable side as a fallback and label it clearly as a side. Group coverage remains the highest restaurant-ranking priority.
- AI recommendations must use catalog facts, not invented menu knowledge. For each key ingredient, allergen, modification, or meal-role statement, show a direct link to the supporting menu or allergen guide when available. Do not fabricate citations.
- Identify how ingredient information was obtained. If the source provides a definitive ingredient list for the exact item/configuration, say the ingredients are from that list. If ingredients are only mentioned in a menu description, say that the list is based on the description and may be incomplete. If a reviewed source does not state the ingredients, tell the user that; if the evidence has not been adequately checked or is conflicting, label it unknown instead of claiming the source is silent.
- If no allergen guide or supporting source is available, say so and show the source that is available; do not imply that the missing guide confirmed anything.
- For a known ingredient conflict, do not label the dish suitable as listed for a person who will not eat that ingredient. AI may offer an order-time modification as a separate suggestion, but must not describe removing an ingredient after serving as proof that the conflict is gone.
- AI suggestions are not safety guarantees. If cross-contact matters, ingredient removal alone is not enough; preparation information must be available and users should still confirm details with the restaurant. Preserve uncertainty when evidence is missing or conflicting.
- AI must run behind a server-side endpoint so provider credentials are not exposed in browser code. A static-only host requires a separate secure backend for this feature.
- If the search service returns an error, times out, or cannot be reached, show: **“There was an error. Please try again later.”** Keep this error state separate from the successful **No matches** state.

## Menu information, sources, and trust

- Use real restaurant and menu data where feasible.
- Prefer official restaurant menus, websites, and statements. Third-party sources, such as delivery apps and restaurant listings, can help find candidate dishes but may be incomplete or out of date.
- Make the source of each menu detail visible, with a source link, a last-checked date, and a confidence label.
- Show sources and warnings at both the restaurant level and the individual meal level.
- Explain the evidence and uncertainty around ingredients and cross-contamination. A menu description alone may not establish whether a dish is safe, particularly for severe restrictions.
- For displayed ingredients, distinguish a definitive ingredient list from ingredients mentioned in a menu description. State the basis next to the ingredient information, and say when a reviewed source does not state ingredients. Keep unverified or conflicting evidence labeled unknown; do not treat a list of description mentions as complete.
- Clearly advise users to confirm uncertain ingredients, preparation practices, and cross-contamination concerns directly with the restaurant.

## Later features

- Cuisine and price filters are not an immediate need and may be added later.
- Let users choose a meal preference, such as full meals only or allowing side dishes as fallbacks. Until then, prioritize full meals and show sides only when no suitable full-meal option is available for that person at that restaurant. Whether this choice applies per person or to the whole group remains open.
- Saving dietary profiles for reuse may be added later; searches can be temporary in the first version.
- People can rate a restaurant based on how it took care of their allergy needs.

## Change history

| Date and time | Change |
| --- | --- |
| 2026-11-18 15:02 America/Denver | Added evidence-linked AI menu recommendations, modification suggestions, meal-versus-side labels, and server-side hosting requirements. |
| 2026-11-18 15:10 America/Denver | Set full-meal priority with clearly labeled side fallbacks and deferred user meal-preference controls. |
| 2026-11-18 18:28 America/Denver | Kept names local while sending opaque participant IDs and restrictions; added search-error copy and meal-role detail descriptions. |
| 2026-11-18 19:20 America/Denver | Required ingredient displays to identify whether they come from a definitive list, a menu description, or no stated/unknown information. |
| 2026-11-18 19:35 America/Denver | Required menu item titles to preserve the restaurant's name and keep serving-role labels in the description. |
