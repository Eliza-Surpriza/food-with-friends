# Food with Friends

## Product overview

Food with Friends is a mobile-forward web app that helps a group choose restaurants where everyone can find something suitable for their dietary needs. The first version will focus on restaurants throughout Utah Valley and use real restaurant and menu information where feasible.

## Group and dietary needs

- One organizer enters the dietary needs for the whole group.
- The organizer can add a name or nickname for each person. Names help identify who each recommendation is for.
- Each person can have multiple dietary needs. The app should offer common options and let the organizer add a custom restriction when needed.
- Broad options can expand into more specific choices. For example, “nuts” can expand to peanuts and tree nuts, and “seafood” can expand to shellfish and finfish.
- Suggested common options include vegetarian, vegan, gluten-free, dairy-free, nuts, shellfish, eggs, soy, sesame, wheat, and finfish. The list can be refined as needed.

Use this severity scale for each restriction:

1. **I'd rather not have it** — The person might be open to suggestions that include it as an ingredient.
2. **I won't eat this** — Default severity.
3. **I can't eat anything that touches this** — Cross-contamination is a concern.
4. **I can't be in a room with this** — Most severe; potentially life-threatening.

## Restaurant search and recommendations

- Search all restaurants in Utah Valley; do not ask for the user's location.
- The main result view is a ranked list. A map could be a useful addition.
- The highest ranking priority is whether every group member has at least one suitable menu item. People do not need to share the same dish.
- Show specific menu items for specific people, including the person's name or nickname.
- Show items that appear suitable as listed separately from items that may work with a modification. Clearly state the suggested modification, such as omitting cheese.
- Show each restaurant's city and the most specific price information available, such as an entrée price range when listed.
- When useful menu information is uncertain or incomplete, include the restaurant with a clear warning and rank it below restaurants with stronger evidence of suitable dishes.
- For a room-level restriction, show the restaurant with a strong warning so the user can decide whether to consider it; do not automatically hide it.
- When information is uncertain, tell the user to check with the restaurant before relying on the recommendation.

## Menu information, sources, and trust

- Use real restaurant and menu data where feasible.
- Prefer official restaurant menus, websites, and statements. Third-party sources, such as delivery apps and restaurant listings, can help find candidate dishes but may be incomplete or out of date.
- Make the source of each menu detail visible, with a source link, a last-checked date, and a confidence label.
- Explain the evidence and uncertainty around ingredients and cross-contamination. A menu description alone may not establish whether a dish is safe, particularly for severe restrictions.
- Clearly advise users to confirm uncertain ingredients, preparation practices, and cross-contamination concerns directly with the restaurant.

## Later features

- Cuisine and price filters are not an immediate need and may be added later.
- Saving dietary profiles for reuse may be added later; searches can be temporary in the first version.
