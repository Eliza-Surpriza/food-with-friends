# Food with Friends

## Product overview

Food with Friends is a mobile-forward web app that helps a group choose restaurants where everyone can find something suitable for their dietary needs. The first version will focus on restaurants throughout Utah County and use real restaurant and menu information where feasible.

The site will be published on GitHub Pages. For the first version, restaurant menus and allergen facts are gathered from internet sources by the project maintainers, prepared with AI assistance, reviewed by a person, and committed as static catalog data before publication. Users do not submit menus or reports in v1. At runtime, the browser reads the published catalog and uses deterministic matching rules; AI is not called from the public website. Do not place AI credentials or other secrets in the client-side site.

## Group and dietary needs

- One organizer enters the dietary needs for the whole group.
- The organizer must enter a name or nickname for each person. Results use it to identify who each suggested meal is for.
- Names or nicknames must be unique within the group.
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

- Search all restaurants in Utah County; do not ask for the user's location.
- The main result view is a ranked list. A map could be a useful addition.
- The highest ranking priority is whether every group member has at least one suitable menu item. People do not need to share the same dish.
- If no restaurant works for everyone, show partial matches grouped by the people each restaurant works for. A restaurant may appear in more than one group, and groups covering more people appear first.
- If no restaurant works for anyone in the group, show a **No matches** state with an option to edit the group and search again.
- Selecting a restaurant opens its detail page. Show each person's meal ideas in a horizontally scrollable row; the page itself can scroll vertically for more information.
- Selecting a meal idea opens a separate meal detail page with its name, description, ingredients, price, sources, and warnings. Show an image when one is available; omit the image area when none is available. Identify the person it is for and whether it works as listed or needs a modification.
- Show specific menu items for specific people, including the person's name or nickname.
- Show items that appear suitable as listed separately from items that may work with a modification. Clearly state the suggested modification, such as omitting cheese.
- Show each restaurant's city and the most specific price information available, such as an entrée price range when listed.
- When useful menu information is uncertain or incomplete, include the restaurant with a clear warning and rank it below restaurants with stronger evidence of suitable dishes.
- For a room-level restriction, show the restaurant with a strong warning so the user can decide whether to consider it; do not automatically hide it.
- When information is uncertain, tell the user to check with the restaurant before relying on the recommendation.

## Menu information, sources, and trust

- Use real restaurant and menu data where feasible.
- Prefer official restaurant menus, websites, and statements. Third-party sources, such as delivery apps and restaurant listings, can help find candidate dishes but may be incomplete or out of date.
- Maintain the v1 catalog manually from public internet sources. AI may help structure candidate menu facts, but a project maintainer must check the evidence before committing the data for publication.
- Make the source of each menu detail visible, with a source link, a last-checked date, and a confidence label.
- Show sources and warnings at both the restaurant level and the individual meal level.
- Explain the evidence and uncertainty around ingredients and cross-contamination. A menu description alone may not establish whether a dish is safe, particularly for severe restrictions.
- Clearly advise users to confirm uncertain ingredients, preparation practices, and cross-contamination concerns directly with the restaurant.

## Later features

- Cuisine and price filters are not an immediate need and may be added later.
- Saving dietary profiles for reuse may be added later; searches can be temporary in the first version.
- People can rate a restaurant based on how it took care of their allergy needs.
