"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { sampleMenuItems, sampleRestaurant } from "@/lib/demo-data";
import { createSearchRequest, searchRestaurants } from "@/lib/search-client";
import {
  RESTRICTIONS,
  SEVERITIES,
  severityInfo,
  type MealSuggestion,
  type IngredientDisclosure,
  type Person,
  type RestrictionType,
  type RestaurantResult,
  type Severity,
  type SearchResponse,
} from "@/lib/types";

type Screen = "welcome" | "person" | "needs" | "severity" | "group" | "results" | "restaurant" | "meal";
type Removal = { kind: "need"; id: string } | { kind: "person"; id: string };
type ResultMode = "best" | "partial" | "none";
type SampleMenuItem = (typeof sampleMenuItems)[number];

function ingredientDisclosureText(disclosure: IngredientDisclosure): string {
  switch (disclosure) {
    case "complete_ingredient_list":
      return "These ingredients are from the source's definitive ingredient list for this item or configuration.";
    case "description_only":
      return "These ingredients are mentioned in the menu description; the list may be incomplete.";
    case "not_stated":
      return "The reviewed source does not state the ingredients.";
    case "unknown":
      return "Ingredient information is unknown from the available evidence.";
  }
}

const newId = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function SeverityMarker({ value }: { value: Severity }) {
  return (
    <svg className={`severity-marker marker-${value}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10.25 4.8c.78-1.35 2.72-1.35 3.5 0l7.1 12.3c.78 1.35-.19 3.05-1.75 3.05H4.9c-1.56 0-2.53-1.7-1.75-3.05z" />
      <text x="12" y="17">!</text>
    </svg>
  );
}

function Dialog({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title">{title}</h2>{children}
      </section>
    </div>
  );
}

function SourceLinks({ sources }: { sources: RestaurantResult["sources"] }) {
  if (!sources.length) return <p className="muted">No source links available.</p>;
  return (
    <ul className="source-list">
      {sources.map((source) => (
        <li key={source.id}>
          <a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>
          <span className="source-meta">Checked {source.lastCheckedOn}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [people, setPeople] = useState<Person[]>([]);
  const [draft, setDraft] = useState<Person | null>(null);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [activeNeedId, setActiveNeedId] = useState<string | null>(null);
  const [nameError, setNameError] = useState("");
  const [customText, setCustomText] = useState("");
  const [customError, setCustomError] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [removePrompt, setRemovePrompt] = useState<Removal | null>(null);
  const [exitPrompt, setExitPrompt] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantResult | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealSuggestion | SampleMenuItem | null>(null);
  const [resultMode, setResultMode] = useState<ResultMode>("best");
  const [liveResponse, setLiveResponse] = useState<SearchResponse | null>(null);
  const [personByRequestId, setPersonByRequestId] = useState<Record<string, Person>>({});
  const [searchError, setSearchError] = useState(false);
  const [searching, setSearching] = useState(false);

  const activeNeed = useMemo(
    () => draft?.needs.find((need) => need.id === activeNeedId) ?? null,
    [draft, activeNeedId],
  );

  const beginPerson = () => {
    setDraft({ id: newId(), name: "", needs: [] });
    setEditingPersonId(null);
    setNameError("");
    setScreen("person");
  };

  const openPerson = (person: Person) => {
    setDraft({ ...person, needs: person.needs.map((need) => ({ ...need })) });
    setEditingPersonId(person.id);
    setNameError("");
    setScreen("person");
  };

  const addNeed = (type: RestrictionType, label: string) => {
    if (!draft) return;
    if (draft.needs.some((need) => need.label.toLocaleLowerCase() === label.toLocaleLowerCase())) {
      setCustomError("This need is already on the list.");
      setCustomOpen(true);
      return;
    }
    setDraft({ ...draft, needs: [...draft.needs, { id: newId(), type, label, severity: 2 }] });
    setCustomOpen(false);
    setCustomText("");
    setCustomError("");
    setScreen("person");
  };

  const savePerson = () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      setNameError("Please enter a name or nickname.");
      return;
    }
    const isDuplicate = people.some((person) =>
      person.id !== editingPersonId && person.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    if (isDuplicate) {
      setNameError("That name is already used in this group.");
      return;
    }
    const saved = { ...draft, name };
    setPeople((current) => editingPersonId
      ? current.map((person) => person.id === editingPersonId ? saved : person)
      : [...current, saved]);
    setDraft(null);
    setEditingPersonId(null);
    setScreen("group");
  };

  const confirmRemoval = () => {
    if (!removePrompt) return;
    if (removePrompt.kind === "need" && draft) {
      setDraft({ ...draft, needs: draft.needs.filter((need) => need.id !== removePrompt.id) });
    } else if (removePrompt.kind === "person") {
      setPeople((current) => current.filter((person) => person.id !== removePrompt.id));
    }
    setRemovePrompt(null);
  };

  const search = async () => {
    setSelectedRestaurant(null);
    setSelectedMeal(null);
    setLiveResponse(null);
    setPersonByRequestId({});
    setSearchError(false);
    setResultMode("best");
    setScreen("results");
    const endpoint = process.env.NEXT_PUBLIC_SEARCH_FUNCTION_URL;
    if (!endpoint) return;

    setSearching(true);
    try {
      const { request, personByRequestId: localPeople } = createSearchRequest(people);
      const response = await searchRestaurants(endpoint, request);
      setLiveResponse(response);
      setPersonByRequestId(Object.fromEntries(localPeople.entries()));
    } catch {
      setSearchError(true);
    } finally {
      setSearching(false);
    }
  };

  const openSampleRestaurant = () => {
    setSelectedRestaurant(sampleRestaurant);
    setScreen("restaurant");
  };

  const openLiveRestaurant = (restaurant: RestaurantResult) => {
    setSelectedRestaurant(restaurant);
    setScreen("restaurant");
  };

  const changeSeverity = (value: Severity) => {
    if (!draft || !activeNeedId) return;
    setDraft({
      ...draft,
      needs: draft.needs.map((need) => need.id === activeNeedId ? { ...need, severity: value } : need),
    });
    setActiveNeedId(null);
    setScreen("person");
  };

  const partialGroups = people.length >= 3
    ? [people.slice(0, 2), people.slice(1, 3)]
    : people.map((person) => [person]);

  const header = (
    <header className="topbar">
      <button className="brand" type="button" onClick={() => setScreen("welcome")} aria-label="Food with Friends home">
        <span className="brand-mark" aria-hidden="true">f</span><span>Food with Friends</span>
      </button>
      {["results", "restaurant", "meal"].includes(screen) && (
        <button className="header-action" type="button" onClick={() => setScreen("group")}>Edit group</button>
      )}
    </header>
  );

  let content: ReactNode;
  if (screen === "welcome") {
    content = <section className="welcome"><div className="welcome-art" aria-hidden="true">⌂</div><h1>Welcome</h1><button className="button button-primary button-full" onClick={beginPerson}>Get started</button></section>;
  } else if (screen === "person" && draft) {
    content = <>
      {(editingPersonId !== null || people.length > 0) && <button className="back-link" onClick={() => setExitPrompt(true)}><span aria-hidden="true">←</span> Back</button>}
      <label className="field-label" htmlFor="nickname">Nickname <span aria-hidden="true">*</span></label>
      <input id="nickname" type="text" maxLength={32} autoComplete="off" value={draft.name}
        onChange={(event) => { setDraft({ ...draft, name: event.target.value }); setNameError(""); }}
        aria-describedby="name-error" />
      <p className="error" id="name-error" role="alert">{nameError}</p>
      <div className="section-row"><h2>Dietary needs</h2></div>
      {draft.needs.length > 0 && <div className="need-list">
        {draft.needs.map((need) => {
          const severity = severityInfo(need.severity);
          return <div className="need-row" key={need.id}>
            <span className="need-name">{need.label}</span>
            <button className="severity-button" onClick={() => { setActiveNeedId(need.id); setScreen("severity"); }}
              aria-label={`Change restriction level for ${need.label}. Current level: ${severity.shortLabel}. ${severity.title}`}>
              <SeverityMarker value={need.severity} /><span className="severity-short-label">{severity.shortLabel}</span>
            </button>
            <button className="icon-button" onClick={() => setRemovePrompt({ kind: "need", id: need.id })} aria-label={`Remove ${need.label}`}>×</button>
          </div>;
        })}
      </div>}
      <button className="add-row" onClick={() => { setScreen("needs"); setCustomOpen(false); setCustomError(""); }} aria-label="Add a dietary need"><span className="add-circle" aria-hidden="true">+</span></button>
      <footer className="actions"><button className="button button-primary button-full" onClick={savePerson} aria-label="Save person and return to group">✓</button></footer>
    </>;
  } else if (screen === "needs" && draft) {
    content = <>
      <button className="back-link" onClick={() => setScreen("person")}><span aria-hidden="true">←</span> Back</button>
      <h1>Add a dietary need</h1>
      <div className="option-list">
        {RESTRICTIONS.map((restriction) => {
          const exists = draft.needs.some((need) => need.type === restriction.type && need.label === restriction.label);
          return <button className="option" key={restriction.type} disabled={exists}
            onClick={() => addNeed(restriction.type, restriction.label)}>
            <span>{restriction.label}</span><span aria-hidden="true">{exists ? "✓" : "+"}</span>
          </button>;
        })}
      </div>
      <button className="option" onClick={() => { setCustomOpen((open) => !open); setCustomError(""); setCustomText(""); }}>
        <span>Custom</span><span aria-hidden="true">{customOpen ? "−" : "+"}</span>
      </button>
      {customOpen && <form className="custom-box" onSubmit={(event: FormEvent) => {
        event.preventDefault();
        const label = customText.trim();
        if (!label) { setCustomError("Enter a name for this need."); return; }
        if (draft.needs.some((need) => need.label.toLocaleLowerCase() === label.toLocaleLowerCase())) {
          setCustomError("This need is already on the list."); return;
        }
        addNeed("custom", label);
      }}>
        <label className="field-label" htmlFor="custom-need">Custom need</label>
        <input id="custom-need" type="text" maxLength={60} value={customText} onChange={(event) => setCustomText(event.target.value)} aria-describedby="custom-error" />
        <p className="error" id="custom-error" role="alert">{customError}</p>
        <button className="button button-primary button-full" type="submit" aria-label="Add custom need">✓</button>
      </form>}
    </>;
  } else if (screen === "severity" && draft && activeNeed) {
    content = <>
      <button className="back-link" onClick={() => { setActiveNeedId(null); setScreen("person"); }}><span aria-hidden="true">←</span> Back</button>
      <h1>{activeNeed.label} restriction level</h1>
      <div className="severity-options">
        {SEVERITIES.map((item) => <button className="severity-option" key={item.value} aria-pressed={activeNeed.severity === item.value} onClick={() => changeSeverity(item.value)}>
          <span className="severity-option-marker"><SeverityMarker value={item.value} /><span className="severity-short-label">{item.shortLabel}</span></span>
          <span><span className="severity-title">{item.title}{item.value === 2 ? " · Default" : ""}</span><span className="severity-description">{item.description}</span></span>
        </button>)}
      </div>
    </>;
  } else if (screen === "group") {
    content = <>
      <div className="section-row"><h1>My group</h1></div>
      <div className="people-grid">{people.map((person) => <article className="person-card" key={person.id}>
        <div className="person-top">
          <button className="person-heading" onClick={() => openPerson(person)}><span className="person-name">{person.name}</span><span className="chevron" aria-hidden="true">›</span></button>
          <button className="icon-button" onClick={() => setRemovePrompt({ kind: "person", id: person.id })} aria-label={`Remove ${person.name}`}>×</button>
        </div>
        {person.needs.length ? <div className="summary-needs">{person.needs.map((need) => <span className="summary-chip" key={need.id}>
          <SeverityMarker value={need.severity} /><span className="severity-short-label">{severityInfo(need.severity).shortLabel}</span><span aria-hidden="true">·</span>{need.label}
        </span>)}</div> : <div className="summary-empty">No dietary needs</div>}
      </article>)}</div>
      <button className="add-row" onClick={beginPerson} aria-label="Add a friend"><span className="add-circle" aria-hidden="true">+</span></button>
      <footer className="group-foot"><button className="button button-primary button-search" onClick={search} disabled={!people.length} aria-label="Search restaurants" title="Search restaurants">⌕</button></footer>
    </>;
  } else if (screen === "results") {
    if (searching) {
      content = <><p className="eyebrow">Searching</p><h1>Finding restaurant ideas</h1><div className="loading-indicator" role="status" aria-label="Searching"><span /></div></>;
    } else if (searchError) {
      content = <>
        <h1>Search unavailable</h1><p className="lead" role="alert">There was an error. Please try again later.</p>
        <button className="button button-primary" onClick={search}>Try again</button>
      </>;
    } else if (liveResponse) {
      content = <>
        {liveResponse.outcome === "none" ? <>
          <h1>No matches</h1><p className="lead">Edit your group and try again.</p>
          <button className="button button-primary" onClick={() => setScreen("group")}>Edit group</button>
        </> : liveResponse.outcome === "partial" ? <>
          <h1>No matches for everyone</h1>
          {[...liveResponse.partialGroups].sort((a, b) => b.personIds.length - a.personIds.length).map((group, groupIndex) => <section className="partial-section" key={`${group.personIds.join("-")}-${groupIndex}`}>
            <h2>{group.personIds.map((id) => personByRequestId[id]?.name).filter(Boolean).join(" & ")}</h2>
            <div className="restaurant-list">{group.restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} onClick={() => openLiveRestaurant(restaurant)} />)}</div>
          </section>)}
        </> : <>
          <h1>Best matches</h1>
          <div className="restaurant-list">{liveResponse.matches.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} onClick={() => openLiveRestaurant(restaurant)} />)}</div>
        </>}
      </>;
    } else content = <>
      <div className="prototype-note"><strong>Preview only.</strong> These sample cards are not matched to your group's needs and are not recommendations.</div>
      {resultMode === "none" ? <>
        <h1>No matches</h1><p className="lead">Edit your group and try again.</p>
        <button className="button button-primary" onClick={() => setScreen("group")}>Edit group</button>
      </> : resultMode === "partial" ? <>
        <h1>No matches for everyone</h1>
        {(people.length >= 3 ? partialGroups : partialGroups.slice(0, 2)).map((group, groupIndex) => <section className="partial-section" key={groupIndex}>
          <h2>{group.map((person) => person.name).join(" & ")}</h2>
          <div className="restaurant-list"><RestaurantCard restaurant={sampleRestaurant} onClick={openSampleRestaurant} />
          <RestaurantCard restaurant={{ ...sampleRestaurant, id: `${sampleRestaurant.id}-again` }} onClick={openSampleRestaurant} /></div>
        </section>)}
      </> : <>
        <h1>Example results</h1>
        <p className="small">Sample menu record for layout review</p>
        <RestaurantCard restaurant={sampleRestaurant} onClick={() => openSampleRestaurant()} />
      </>}
      <div className="preview-controls" aria-label="Preview result states">
        <span>Preview state</span>
        <button onClick={() => setResultMode("best")} aria-pressed={resultMode === "best"}>Example</button>
        <button onClick={() => setResultMode("partial")} aria-pressed={resultMode === "partial"}>Partial</button>
        <button onClick={() => setResultMode("none")} aria-pressed={resultMode === "none"}>None</button>
      </div>
    </>;
  } else if (screen === "restaurant" && selectedRestaurant) {
    const isSampleRestaurant = selectedRestaurant.id.startsWith(sampleRestaurant.id);
    content = <>
      <button className="back-link" onClick={() => setScreen("results")}><span aria-hidden="true">←</span> Back to results</button>
      {isSampleRestaurant && <div className="prototype-note"><strong>Sample menu only.</strong> No suitability has been determined for anyone in your group.</div>}
      <h1>{selectedRestaurant.name}</h1>
      <p className="restaurant-meta">{selectedRestaurant.city ?? "City not verified"} · {selectedRestaurant.price ?? "Price not available"}</p>
      {isSampleRestaurant ? <section className="meal-section">
        <h2>Sample menu items</h2>
        <div className="meal-row" aria-label="Sample menu items">
          {sampleMenuItems.map((item) => <button className="meal-card" key={item.id} onClick={() => { setSelectedMeal(item); setScreen("meal"); }}>
            <span className="meal-card-name">{item.name}</span><span className="meal-role">{item.servingRole.replace("_", " ")}</span>
          </button>)}
        </div>
      </section> : selectedRestaurant.people.map((entry) => {
        const person = personByRequestId[entry.personId];
        return <section className="meal-section" key={entry.personId}>
          <h2>Suggestions for {person?.name ?? "group member"}</h2>
          {entry.meals.length ? <div className="meal-row" aria-label={`Meal ideas for ${person?.name ?? "group member"}`}>
            {entry.meals.map((meal) => <button className="meal-card" key={meal.id} onClick={() => { setSelectedMeal(meal); setScreen("meal"); }}>
              <span className="meal-card-name">{meal.name}</span>
              <span className={`meal-status status-${meal.matchStatus}`}>{meal.matchStatus === "as_listed" ? "As listed" : meal.matchStatus === "modification" ? "Modification" : "Uncertain"}</span>
              <span className="meal-role">{meal.servingRole.replace("_", " ")}</span>
            </button>)}
          </div> : <p className="muted">No menu suggestions for this person.</p>}
        </section>;
      })}
      <section className="detail-section"><h2>Sources</h2><SourceLinks sources={selectedRestaurant.sources} /></section>
      {selectedRestaurant.warnings.length > 0 && <section className="detail-section"><h2>Warnings</h2><ul className="warning-list">{selectedRestaurant.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></section>}
    </>;
  } else if (screen === "meal" && selectedRestaurant && selectedMeal) {
    const meal = selectedMeal;
    const isSampleMeal = "sourceIds" in meal;
    const ingredients = isSampleMeal
      ? meal.ingredients.map((item) => `${item.name}${"status" in item && item.status ? ` — ${item.status}` : ""}`)
      : meal.ingredients.map((item) => item.name);
    const mealSources = isSampleMeal
      ? selectedRestaurant.sources.filter((source) => meal.sourceIds.includes(source.id))
      : meal.sources;
    const mealWarnings = isSampleMeal
      ? [
        "Ingredient selections and preparation can vary by location and order.",
        "Unmarked allergen information is unknown; confirm ingredients and cross-contact with the restaurant.",
        ...("allergenStatus" in meal && meal.allergenStatus ? [meal.allergenStatus] : []),
        ...("allergenFacts" in meal ? meal.allergenFacts.map((fact) => `${fact.allergen}: ${fact.status}. ${fact.sourceObservation}`) : []),
      ]
      : meal.warnings;
    const personEntry = isSampleMeal ? undefined : selectedRestaurant.people.find((entry) => entry.meals.some((item) => item.id === meal.id));
    const personName = personEntry ? personByRequestId[personEntry.personId]?.name : undefined;
    const ingredientDisclosure: IngredientDisclosure = meal.ingredientDisclosure as IngredientDisclosure;
    content = <>
      <button className="back-link" onClick={() => setScreen("restaurant")}><span aria-hidden="true">←</span> Back to {selectedRestaurant.name}</button>
      {isSampleMeal && <div className="prototype-note"><strong>Sample item only.</strong> It has not been assessed against your group's needs.</div>}
      <h1>{meal.name}</h1>
      <p className="meal-detail-person">{selectedRestaurant.name}{personName ? ` · for ${personName}` : ""}</p>
      {!isSampleMeal && meal.imageUrl && <img className="meal-image" src={meal.imageUrl} alt={meal.name} />}
      <section className="detail-section"><h2>Description</h2><p>{meal.description}</p></section>
      {!isSampleMeal && <section className="detail-section"><h2>Match details</h2>
        <p>{meal.matchStatus === "as_listed" ? "Suggested as listed" : meal.matchStatus === "modification" ? "May work with a modification" : "Uncertain — check with the restaurant"}</p>
        {meal.modification && <p><strong>Ask the restaurant:</strong> {meal.modification}</p>}
        <p>{meal.recommendationReason}</p>
      </section>}
      <section className="detail-section"><h2>Ingredients</h2>
        {ingredients.length > 0 ? <ul>{ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul> : <p className="muted">No ingredient details listed.</p>}
        <p className="ingredient-note">{ingredientDisclosureText(ingredientDisclosure)}</p>
      </section>
      <section className="detail-section"><h2>Price</h2><p>{meal.price ?? "Not listed"}</p></section>
      <section className="detail-section"><h2>Sources</h2><SourceLinks sources={mealSources} />
        {!isSampleMeal && meal.citations.length > 0 && <ul className="source-list citation-list">{meal.citations.map((citation) => <li key={`${citation.id}-${citation.url}`}>
          <a href={citation.url} target="_blank" rel="noreferrer">{citation.label} ↗</a>
          {citation.excerpt && <span className="source-meta">{citation.excerpt}</span>}
        </li>)}</ul>}
      </section>
      <section className="detail-section"><h2>Warnings</h2><ul className="warning-list">
        {mealWarnings.map((warning) => <li key={warning}>{warning}</li>)}
        {!mealWarnings.length && <li>Confirm ingredients and preparation with the restaurant. Recommendations are not safety guarantees.</li>}
      </ul></section>
    </>;
  } else {
    content = <section><h1>Welcome</h1><button className="button button-primary" onClick={() => setScreen("welcome")}>Continue</button></section>;
  }

  return <div className="app"><div className="device">{header}<main><div className={`content screen-${screen}`}>{content}</div></main></div>
    {removePrompt && <Dialog title={removePrompt.kind === "need"
      ? `Remove ${draft?.needs.find((need) => need.id === removePrompt.id)?.label ?? "this need"}?`
      : `Are you sure you want to remove “${people.find((person) => person.id === removePrompt.id)?.name ?? "this person"}”?`}>
      <div className="dialog-actions"><button className="button button-secondary" onClick={() => setRemovePrompt(null)}>Cancel</button><button className="button button-danger" onClick={confirmRemoval}>Remove</button></div>
    </Dialog>}
    {exitPrompt && <Dialog title="Are you sure you want to exit without saving changes?">
      <div className="dialog-actions"><button className="button button-secondary" onClick={() => setExitPrompt(false)}>Stay</button><button className="button button-danger" onClick={() => { setExitPrompt(false); setDraft(null); setScreen("group"); }}>Exit</button></div>
    </Dialog>}
  </div>;
}

function RestaurantCard({ restaurant, onClick }: { restaurant: RestaurantResult; onClick: () => void }) {
  return <button className="restaurant-card" onClick={onClick}>
    <span><span className="restaurant-title">{restaurant.name}</span><span className="restaurant-meta">{restaurant.city ?? "City not verified"} · {restaurant.price ?? "Price unavailable"}</span></span>
    <span className="chevron" aria-hidden="true">›</span>
  </button>;
}
