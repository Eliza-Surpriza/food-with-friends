import fixture from "../../sample-data/costa-vida-ui-fixture.json";
import type { RestaurantResult, Source } from "./types";

const sources: Source[] = fixture.sources.map((source) => ({
  id: source.id,
  url: source.url,
  label: source.type === "official_menu" ? "Official menu" : "Nutrition & allergen information",
  type: source.type,
  lastCheckedOn: source.lastCheckedOn,
}));

export const sampleRestaurant: RestaurantResult = {
  id: fixture.restaurant.id,
  name: fixture.restaurant.name,
  city: fixture.restaurant.city,
  price: fixture.restaurant.priceRange,
  sources,
  warnings: [
    "Sample record only. No specific Utah Valley location or price has been verified.",
    "This menu has not been reviewed for your group's restrictions. Confirm ingredients and preparation with the restaurant.",
  ],
  people: [],
};

export const sampleMenuItems = fixture.menuItems;
