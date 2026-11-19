export type Severity = 1 | 2 | 3 | 4;

export type RestrictionType =
  | "vegetarian"
  | "vegan"
  | "gluten_free"
  | "dairy_free"
  | "peanuts"
  | "tree_nuts"
  | "shellfish"
  | "finfish"
  | "eggs"
  | "soy"
  | "sesame"
  | "wheat"
  | "custom";

export type Need = {
  id: string;
  type: RestrictionType;
  label: string;
  severity: Severity;
};

export type Person = {
  id: string;
  name: string;
  needs: Need[];
};

export type SearchRequest = {
  people: Array<{
    id: string;
    restrictions: Array<{
      type: RestrictionType;
      label?: string;
      severity: Severity;
    }>;
  }>;
};

export type Source = {
  id: string;
  url: string;
  label: string;
  type: string;
  lastCheckedOn: string;
};

export type Citation = Source & {
  excerpt?: string;
};

export type IngredientDisclosure =
  | "complete_ingredient_list"
  | "description_only"
  | "not_stated"
  | "unknown";

export type IngredientEvidenceType = "ingredient_list" | "menu_description" | "other_source" | "unknown";

export type Ingredient = {
  name: string;
  evidenceType: IngredientEvidenceType;
  evidenceIds: string[];
};

export type MealSuggestion = {
  id: string;
  name: string;
  price: string | null;
  matchStatus: "as_listed" | "modification" | "uncertain";
  servingRole: "full_meal" | "side" | "snack" | "drink" | "unknown";
  servingRoleBasis: string;
  recommendationReason: string;
  modification: string | null;
  description: string;
  ingredientDisclosure: IngredientDisclosure;
  ingredients: Ingredient[];
  imageUrl: string | null;
  sources: Source[];
  citations: Citation[];
  warnings: string[];
};

export type RestaurantPersonSuggestions = {
  personId: string;
  meals: MealSuggestion[];
};

export type RestaurantResult = {
  id: string;
  name: string;
  cities: string[];
  price: string | null;
  sources: Source[];
  warnings: string[];
  people: RestaurantPersonSuggestions[];
};

export type PartialGroup = {
  personIds: string[];
  restaurants: RestaurantResult[];
};

export type SearchResponse = {
  outcome: "full" | "partial" | "none";
  matches: RestaurantResult[];
  partialGroups: PartialGroup[];
};

export const RESTRICTIONS: Array<{ type: Exclude<RestrictionType, "custom">; label: string }> = [
  { type: "vegetarian", label: "Vegetarian" },
  { type: "vegan", label: "Vegan" },
  { type: "gluten_free", label: "Gluten-free" },
  { type: "dairy_free", label: "Dairy-free" },
  { type: "peanuts", label: "Peanuts" },
  { type: "tree_nuts", label: "Tree nuts" },
  { type: "shellfish", label: "Shellfish" },
  { type: "finfish", label: "Finfish" },
  { type: "eggs", label: "Eggs" },
  { type: "soy", label: "Soy" },
  { type: "sesame", label: "Sesame" },
  { type: "wheat", label: "Wheat" },
];

export const SEVERITIES: Array<{
  value: Severity;
  shortLabel: string;
  title: string;
  description: string;
}> = [
  { value: 1, shortLabel: "Preference", title: "I'd rather not have it", description: "I might be open to suggestions that include it as an ingredient." },
  { value: 2, shortLabel: "Avoid", title: "I won't eat this", description: "Default choice." },
  { value: 3, shortLabel: "No contact", title: "I can't eat anything that touches this", description: "Cross-contamination is a concern." },
  { value: 4, shortLabel: "Room-level", title: "I can't be in a room with this", description: "Most severe; potentially life-threatening." },
];

export function severityInfo(value: Severity) {
  return SEVERITIES.find((item) => item.value === value) ?? SEVERITIES[1];
}
