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
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
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

    // Temporary local verification: confirm the function can read published
    // catalog items. The final search response will be added in a later step.
    const { data, error } = await ctx.supabase
      .from("menu_items")
      .select("id, name, description, category, serving_role")
      .eq("record_status", "published")
      .limit(10);

    if (error) {
      console.error("Catalog read failed:", error);
      return errorResponse(
        "catalog_read_failed",
        "Search is temporarily unavailable. Please try again later.",
        500,
      );
    }

    return Response.json({
      requestValid: true,
      catalogConnected: true,
      items: data ?? [],
    });
  }),
};
