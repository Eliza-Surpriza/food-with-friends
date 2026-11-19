// Setup type definitions for built-in Supabase Runtime APIs.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const COMMON_RESTRICTION_TYPES = [
  "vegetarian",
  "vegan",
  "gluten_free",
  "dairy_free",
  "peanuts",
  "tree_nuts",
  "shellfish",
  "finfish",
  "eggs",
  "soy",
  "sesame",
  "wheat",
] as const;

type CommonRestrictionType = typeof COMMON_RESTRICTION_TYPES[number];
type RestrictionType = CommonRestrictionType | "custom";

interface SearchRestriction {
  type: RestrictionType;
  severity: number;
  label?: string;
}

interface SearchPerson {
  id: string;
  restrictions: SearchRestriction[];
}

interface SearchRequest {
  people: SearchPerson[];
}

type ParseResult =
  | { ok: true; value: SearchRequest }
  | { ok: false; code: string; message: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSearchRequest(value: unknown): ParseResult {
  if (!isObject(value) || !Array.isArray(value.people) || value.people.length === 0) {
    return {
      ok: false,
      code: "invalid_request",
      message: "The request must include at least one person.",
    };
  }

  const seenIds = new Set<string>();
  const people: SearchPerson[] = [];

  for (const [personIndex, rawPerson] of value.people.entries()) {
    if (!isObject(rawPerson) || typeof rawPerson.id !== "string" || rawPerson.id.trim() === "") {
      return {
        ok: false,
        code: "invalid_person",
        message: `Person ${personIndex + 1} must have a non-empty string id.`,
      };
    }

    const id = rawPerson.id.trim();
    if (seenIds.has(id)) {
      return {
        ok: false,
        code: "duplicate_person_id",
        message: "Each person must have a unique id.",
      };
    }
    seenIds.add(id);

    if (!Array.isArray(rawPerson.restrictions)) {
      return {
        ok: false,
        code: "invalid_restrictions",
        message: `Person ${personIndex + 1} must have a restrictions array; it may be empty.`,
      };
    }

    const restrictions: SearchRestriction[] = [];
    for (const [restrictionIndex, rawRestriction] of rawPerson.restrictions.entries()) {
      if (!isObject(rawRestriction)) {
        return {
          ok: false,
          code: "invalid_restriction",
          message: `Restriction ${restrictionIndex + 1} for person ${personIndex + 1} must be an object.`,
        };
      }

      const type = rawRestriction.type;
      const isCommonType = typeof type === "string" &&
        (COMMON_RESTRICTION_TYPES as readonly string[]).includes(type);
      if (type !== "custom" && !isCommonType) {
        return {
          ok: false,
          code: "invalid_restriction_type",
          message: `Restriction ${restrictionIndex + 1} for person ${personIndex + 1} has an unsupported type.`,
        };
      }

      if (typeof rawRestriction.severity !== "number" ||
        !Number.isInteger(rawRestriction.severity) ||
        rawRestriction.severity < 1 ||
        rawRestriction.severity > 4) {
        return {
          ok: false,
          code: "invalid_severity",
          message: `Restriction ${restrictionIndex + 1} for person ${personIndex + 1} must have an integer severity from 1 to 4.`,
        };
      }

      if (type === "custom") {
        if (typeof rawRestriction.label !== "string" || rawRestriction.label.trim() === "") {
          return {
            ok: false,
            code: "missing_custom_label",
            message: `Custom restriction ${restrictionIndex + 1} for person ${personIndex + 1} needs a non-empty label.`,
          };
        }
        restrictions.push({
          type,
          severity: rawRestriction.severity,
          label: rawRestriction.label.trim(),
        });
      } else {
        restrictions.push({
          type: type as CommonRestrictionType,
          severity: rawRestriction.severity,
        });
      }
    }

    // Build a fresh object so unexpected fields (including names) are not
    // carried forward to later processing or to the AI provider.
    people.push({ id, restrictions });
  }

  return { ok: true, value: { people } };
}

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}

export default {
  fetch: withSupabase({ auth: ["publishable"] }, async (req, ctx) => {
    if (req.method !== "POST") {
      return errorResponse("method_not_allowed", "Use POST for search requests.", 405);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("invalid_json", "The request body must be valid JSON.", 400);
    }

    const parsed = parseSearchRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.code, parsed.message, 400);
    }

    const [
      chainsResult,
      locationsResult,
      sourcesResult,
      menuItemsResult,
      itemLocationsResult,
      evidenceResult,
      factsResult,
      factEvidenceResult,
    ] = await Promise.all([
      ctx.supabase
        .from("restaurant_chains")
        .select("id, name, record_status")
        .eq("record_status", "published"),
      ctx.supabase
        .from("restaurant_locations")
        .select("id, chain_id, city, location_name, address, record_status")
        .eq("record_status", "published"),
      ctx.supabase
        .from("catalog_sources")
        .select("id, chain_id, location_id, url, source_type, publisher, title, last_checked_on, source_status, record_status")
        .eq("record_status", "published"),
      ctx.supabase
        .from("menu_items")
        .select("id, chain_id, name, description, category, serving_role, serving_role_basis, price, image_url, ingredient_disclosure, availability_note, review_status, record_status")
        .eq("record_status", "published"),
      ctx.supabase
        .from("menu_item_locations")
        .select("menu_item_id, location_id, availability_status, record_status")
        .eq("record_status", "published"),
      ctx.supabase
        .from("catalog_evidence")
        .select("id, source_id, excerpt, source_location, excerpt_unavailable, record_status")
        .eq("record_status", "published"),
      ctx.supabase
        .from("menu_facts")
        .select("id, chain_id, menu_item_id, location_id, fact_type, subject, statement, claim_status, ingredient_evidence_type, attribution, review_status, record_status, uncertainty_notes")
        .eq("record_status", "published"),
      ctx.supabase
        .from("menu_fact_evidence")
        .select("fact_id, evidence_id"),
    ]);

    const failedQuery = [
      { table: "restaurant_chains", error: chainsResult.error },
      { table: "restaurant_locations", error: locationsResult.error },
      { table: "catalog_sources", error: sourcesResult.error },
      { table: "menu_items", error: menuItemsResult.error },
      { table: "menu_item_locations", error: itemLocationsResult.error },
      { table: "catalog_evidence", error: evidenceResult.error },
      { table: "menu_facts", error: factsResult.error },
      { table: "menu_fact_evidence", error: factEvidenceResult.error },
    ].find((query) => query.error !== null);

    if (failedQuery) {
      console.error(`Published catalog read failed for ${failedQuery.table}:`, failedQuery.error);
      return errorResponse(
        "catalog_read_failed",
        "Search is temporarily unavailable. Please try again later.",
        500,
      );
    }

    const chains = chainsResult.data ?? [];
    const locations = locationsResult.data ?? [];
    const sources = sourcesResult.data ?? [];
    const menuItems = menuItemsResult.data ?? [];
    const itemLocations = itemLocationsResult.data ?? [];
    const evidence = evidenceResult.data ?? [];
    const facts = factsResult.data ?? [];
    const factEvidenceLinks = factEvidenceResult.data ?? [];

    const chainIds = new Set(chains.map((chain) => chain.id));
    const locationIds = new Set(locations.map((location) => location.id));
    const itemIds = new Set(menuItems.map((item) => item.id));
    const sourceById = new Map(sources.map((source) => [source.id, source]));
    const evidenceById = new Map(
      evidence
        .filter((record) => sourceById.has(record.source_id))
        .map((record) => [record.id, {
          id: record.id,
          excerpt: record.excerpt,
          sourceLocation: record.source_location,
          excerptUnavailable: record.excerpt_unavailable,
          source: sourceById.get(record.source_id),
        }]),
    );

    const evidenceIdsByFact = new Map<string, string[]>();
    for (const link of factEvidenceLinks) {
      if (!evidenceById.has(link.evidence_id)) continue;
      const linkedIds = evidenceIdsByFact.get(link.fact_id) ?? [];
      linkedIds.push(link.evidence_id);
      evidenceIdsByFact.set(link.fact_id, linkedIds);
    }

    // Facts without a published evidence link, or facts tied to unpublished
    // records, are not passed forward as support for a recommendation.
    const evidenceBackedFacts = facts
      .filter((fact) =>
        chainIds.has(fact.chain_id) &&
        (fact.menu_item_id === null || itemIds.has(fact.menu_item_id)) &&
        (fact.location_id === null || locationIds.has(fact.location_id)) &&
        (evidenceIdsByFact.get(fact.id)?.length ?? 0) > 0
      )
      .map((fact) => ({
        ...fact,
        evidence: (evidenceIdsByFact.get(fact.id) ?? [])
          .map((id) => evidenceById.get(id))
          .filter((record) => record !== undefined),
      }));

    const catalog = chains.map((chain) => {
      const chainLocations = locations.filter((location) => location.chain_id === chain.id);
      const chainItems = menuItems.filter((item) => item.chain_id === chain.id);
      const chainSources = sources.filter((source) => source.chain_id === chain.id);
      const chainFacts = evidenceBackedFacts.filter((fact) => fact.chain_id === chain.id);

      return {
        id: chain.id,
        name: chain.name,
        cities: [...new Set(chainLocations.map((location) => location.city))],
        locations: chainLocations,
        sources: chainSources,
        facts: chainFacts.filter((fact) => fact.menu_item_id === null),
        menuItems: chainItems
          .map((item) => ({
            ...item,
            locations: itemLocations
              .filter((entry) => entry.menu_item_id === item.id)
              .map((entry) => ({
                ...entry,
                location: chainLocations.find((location) => location.id === entry.location_id) ?? null,
              })),
            facts: chainFacts.filter((fact) => fact.menu_item_id === item.id),
          }))
          // An item without published evidence-backed facts cannot support an
          // allergy recommendation, so keep it out of the model's future input.
          .filter((item) => item.facts.length > 0),
      };
    }).filter((chain) => chain.menuItems.length > 0 || chain.facts.length > 0);

    const publishedItemCount = catalog.reduce((total, chain) => total + chain.menuItems.length, 0);
    if (publishedItemCount === 0) {
      return errorResponse(
        "catalog_not_ready",
        "Search is temporarily unavailable. Please try again later.",
        503,
      );
    }

    // Temporary development summary. The full API response and AI selection
    // are the next implementation stage; do not report an empty catalog as
    // outcome "none".
    return Response.json({
      requestValid: true,
      catalogConnected: true,
      peopleReceived: parsed.value.people.length,
      catalogSummary: {
        restaurantCount: catalog.length,
        menuItemCount: publishedItemCount,
        evidenceBackedFactCount: evidenceBackedFacts.length,
      },
    });
  }),
};
