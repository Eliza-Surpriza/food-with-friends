import type { Person, SearchRequest, SearchResponse } from "./types";

/**
 * Builds the public request shape without sending names or local person IDs.
 * The returned map is held only in frontend memory to label response personIds.
 */
export function createSearchRequest(people: Person[]) {
  const personByRequestId = new Map<string, Person>();
  const request: SearchRequest = {
    people: people.map((person) => {
      const id = globalThis.crypto?.randomUUID?.() ?? `search-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      personByRequestId.set(id, person);
      return {
        id,
        restrictions: person.needs.map((need) => ({
          type: need.type,
          ...(need.type === "custom" ? { label: need.label } : {}),
          severity: need.severity,
        })),
      };
    }),
  };
  return { request, personByRequestId };
}

export async function searchRestaurants(endpoint: string, request: SearchRequest): Promise<SearchResponse> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error("Search request failed.");

  const data: unknown = await response.json();
  if (!isSearchResponse(data)) throw new Error("Search response was invalid.");
  const requestedIds = new Set(request.people.map((person) => person.id));
  if (!referencesOnlyRequestedPeople(data, requestedIds)) throw new Error("Search response included an unknown person.");
  return data;
}

function isSearchResponse(value: unknown): value is SearchResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Partial<SearchResponse>;
  if (!["full", "partial", "none"].includes(response.outcome ?? "")
    || !Array.isArray(response.matches)
    || !response.matches.every(isRestaurantResult)
    || !Array.isArray(response.partialGroups)
    || !response.partialGroups.every((group) => Boolean(group)
      && Array.isArray(group.personIds)
      && group.personIds.every((id) => typeof id === "string")
      && Array.isArray(group.restaurants)
      && group.restaurants.every(isRestaurantResult))) return false;

  if (response.outcome === "full") return response.matches.length > 0 && response.partialGroups.length === 0;
  if (response.outcome === "partial") return response.matches.length === 0 && response.partialGroups.length > 0;
  return response.matches.length === 0 && response.partialGroups.length === 0;
}

function referencesOnlyRequestedPeople(response: SearchResponse, requestedIds: Set<string>): boolean {
  return response.partialGroups.every((group) => group.personIds.every((id) => requestedIds.has(id)))
    && [...response.matches, ...response.partialGroups.flatMap((group) => group.restaurants)]
      .every((restaurant) => restaurant.people.every((person) => requestedIds.has(person.personId)));
}

function isRestaurantResult(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const restaurant = value as Partial<SearchResponse["matches"][number]>;
  return typeof restaurant.id === "string"
    && typeof restaurant.name === "string"
    && Array.isArray(restaurant.cities)
    && restaurant.cities.every((city) => typeof city === "string")
    && (typeof restaurant.price === "string" || restaurant.price === null)
    && Array.isArray(restaurant.sources)
    && restaurant.sources.every(isSource)
    && Array.isArray(restaurant.warnings)
    && restaurant.warnings.every((warning) => typeof warning === "string")
    && Array.isArray(restaurant.people)
    && restaurant.people.every((person) => Boolean(person)
      && typeof person.personId === "string"
      && Array.isArray(person.meals)
      && person.meals.every(isMeal));
}

function isSource(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const source = value as Record<string, unknown>;
  return typeof source.id === "string"
    && isHttpsUrl(source.url)
    && typeof source.label === "string"
    && typeof source.type === "string"
    && typeof source.lastCheckedOn === "string";
}

function isMeal(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const meal = value as Record<string, unknown>;
  const citations = meal.citations;
  const validStatus = ["as_listed", "modification", "uncertain"].includes(String(meal.matchStatus));
  const validRole = ["full_meal", "side", "snack", "drink", "unknown"].includes(String(meal.servingRole));
  return typeof meal.id === "string"
    && typeof meal.name === "string"
    && (typeof meal.price === "string" || meal.price === null)
    && validStatus
    && validRole
    && typeof meal.servingRoleBasis === "string"
    && typeof meal.recommendationReason === "string"
    && (typeof meal.modification === "string" || meal.modification === null)
    && typeof meal.description === "string"
    && ["complete_ingredient_list", "description_only", "not_stated", "unknown"].includes(String(meal.ingredientDisclosure))
    && Array.isArray(meal.ingredients)
    && meal.ingredients.every(isIngredient)
    && (meal.imageUrl === null || isHttpsUrl(meal.imageUrl))
    && Array.isArray(meal.sources)
    && meal.sources.every(isSource)
    && Array.isArray(citations)
    && citations.every((citation) => isSource(citation)
      && (!("excerpt" in citation) || typeof citation.excerpt === "string"))
    && Array.isArray(meal.warnings)
    && meal.warnings.every((warning) => typeof warning === "string");
}

function isIngredient(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const ingredient = value as Record<string, unknown>;
  return typeof ingredient.name === "string"
    && ["ingredient_list", "menu_description", "other_source", "unknown"].includes(String(ingredient.evidenceType))
    && Array.isArray(ingredient.evidenceIds)
    && ingredient.evidenceIds.every((id) => typeof id === "string");
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
