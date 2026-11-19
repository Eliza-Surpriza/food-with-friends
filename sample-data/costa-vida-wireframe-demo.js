(() => {
  const iframe = document.getElementById("wireframe");
  const params = new URLSearchParams(window.location.search);
  const scenario = params.get("results");
  const forwardedQuery = ["partial", "none", "error"].includes(scenario)
    ? `?results=${encodeURIComponent(scenario)}`
    : "";

  iframe.addEventListener("load", initialize, { once: true });
  iframe.src = `../wireframe.html${forwardedQuery}`;

  async function initialize() {
    let fixture;
    try {
      const response = await fetch("./costa-vida-ui-fixture.json");
      if (!response.ok) throw new Error(`Fixture request failed: ${response.status}`);
      fixture = await response.json();
    } catch {
      showLoadError();
      return;
    }

    const frameDocument = iframe.contentDocument;
    const app = frameDocument?.getElementById("app");
    if (!frameDocument || !app) return;

    const style = frameDocument.createElement("style");
    style.textContent = `
      .sample-data-banner { margin: 12px 0; padding: 12px; border: 1px solid #d9bd68; border-radius: 12px; color: #51431a; background: #fff8dc; font-size: 13px; line-height: 1.45; }
      .sample-role { display: block; margin-top: 7px; color: #246b4b; font-size: 11px; font-weight: 750; }
      .sample-links { display: grid; gap: 8px; }
      .sample-links a { color: #155f8c; overflow-wrap: anywhere; }
      .sample-warning { color: #7b3d18; }
    `;
    frameDocument.head.append(style);

    let lastMain = null;
    const observer = new MutationObserver(() => enhance());
    observer.observe(app, { childList: true, subtree: true });

    function makeText(tag, text, className) {
      const element = frameDocument.createElement(tag);
      element.textContent = text;
      if (className) element.className = className;
      return element;
    }

    function makeBanner(text, className = "sample-data-banner") {
      return makeText("aside", text, className);
    }

    function addBanner(main, text) {
      if (main.querySelector(":scope > .sample-data-banner")) return;
      const heading = main.querySelector("h1");
      if (heading) heading.after(makeBanner(text));
      else main.prepend(makeBanner(text));
    }

    function addSourceLinks(container, ids) {
      const links = frameDocument.createElement("div");
      links.className = "sample-links detail-value";
      for (const id of ids || []) {
        const source = fixture.sources.find(item => item.id === id);
        if (!source) continue;
        const url = new URL(source.url);
        if (url.protocol !== "https:" || url.hostname !== "www.costavida.com") continue;
        const link = frameDocument.createElement("a");
        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = `${source.type.replaceAll("_", " ")} · checked ${source.lastCheckedOn}`;
        links.append(link);
      }
      container.replaceChildren(links);
    }

    function setSection(section, content) {
      const target = section?.querySelector(".detail-placeholder, .detail-value");
      if (target) target.replaceWith(content);
    }

    function getSection(main, title) {
      return [...main.querySelectorAll(".detail-section")]
        .find(section => section.querySelector("h2")?.textContent.trim() === title);
    }

    function replacePlaceholderWithLinks(main, title, sourceIds) {
      const section = getSection(main, title);
      if (!section) return;
      const box = frameDocument.createElement("div");
      addSourceLinks(box, sourceIds);
      setSection(section, box.firstElementChild || makeText("p", "No source link in this sample.", "detail-value"));
    }

    function enhanceResults(main) {
      if (scenario === "error") {
        const content = main.querySelector(".content");
        if (!content) return;
        content.replaceChildren(
          makeText("h1", "Search error"),
          makeText("p", "There was an error. Please try again later.", "lead")
        );
        return;
      }

      addBanner(main, "Costa Vida sample catalog preview. These are source examples, not AI-selected or allergy-safe recommendations.");
      const containers = [...main.querySelectorAll(".restaurant-list, .partial-section")];
      for (const container of containers) {
        const cards = [...container.querySelectorAll(":scope > .restaurant-card, .restaurant-list > .restaurant-card")];
        cards.forEach((card, index) => {
          if (index > 0) card.hidden = true;
          const title = card.querySelector(".restaurant-title");
          const meta = card.querySelector(".restaurant-meta");
          if (title) title.textContent = fixture.restaurant.name;
          if (meta) meta.textContent = "Utah County location not selected · Price not listed";
        });
      }
    }

    function enhanceRestaurant(main) {
      const heading = main.querySelector("h1");
      if (heading) heading.textContent = `${fixture.restaurant.name} · Sample catalog`;
      const meta = main.querySelector(".restaurant-meta");
      if (meta) meta.textContent = "Location not selected · Price not listed in supplied sources";
      addBanner(main, "Catalog preview only. Menu components and allergen markers need maintainer review; this page does not determine whether an item matches a person's restrictions.");

      const cards = [...main.querySelectorAll(".meal-card")];
      cards.forEach((card, index) => {
        const item = fixture.menuItems[index % fixture.menuItems.length];
        const roleLabel = item.servingRole === "side" ? "Side dish" : "Full meal";
        card.dataset.meal = item.id;
        card.textContent = `${item.name} — ${roleLabel}`;
      });

      const sourceSection = getSection(main, "Sources");
      if (sourceSection) {
        const box = frameDocument.createElement("div");
        addSourceLinks(box, fixture.sources.map(source => source.id));
        setSection(sourceSection, box.firstElementChild);
      }
      const warningSection = getSection(main, "Warnings");
      if (warningSection) {
        setSection(warningSection, makeText("p", "Allergen status for configured items is incomplete. Costa Vida notes possible flour-in-the-air contact for gluten-friendly customization; confirm current ingredients and preparation directly with the restaurant.", "detail-value sample-warning"));
      }
    }

    function enhanceMeal(main) {
      const heading = main.querySelector("h1");
      const item = fixture.menuItems.find(entry => entry.id === heading?.textContent.trim());
      if (!item) return;

      heading.textContent = item.name;
      const description = getSection(main, "Description");
      if (description) {
        const role = item.servingRole === "side"
          ? `Side dish — this is a side, not a full meal. ${item.servingRoleBasis}`
          : `${item.servingRoleBasis} The exact configured item may vary.`;
        setSection(description, makeText("p", `${item.description} ${role}`, "detail-value"));
      }

      const ingredients = getSection(main, "Ingredients");
      if (ingredients) {
        const disclosureLabels = {
          complete_ingredient_list: "These ingredients are from the source's definitive ingredient list for this item/configuration.",
          description_only: "These ingredients are mentioned in the menu description; the list may be incomplete.",
          not_stated: "The reviewed source does not state the ingredients.",
          unknown: "Ingredient information is unknown from the available evidence."
        };
        const disclosure = item.ingredientDisclosure || "unknown";
        const ingredientContent = frameDocument.createElement("div");
        ingredientContent.className = "detail-value";
        ingredientContent.append(makeText("p", disclosureLabels[disclosure] || disclosureLabels.unknown));
        const list = frameDocument.createElement("ul");
        for (const ingredient of item.ingredients || []) {
          const evidenceLabel = ingredient.evidenceType === "ingredient_list"
            ? "from ingredient list"
            : ingredient.evidenceType === "menu_description"
              ? "mentioned in menu description"
              : "evidence basis unknown";
          const qualifier = ingredient.status ? ` — ${ingredient.status}` : "";
          list.append(makeText("li", `${ingredient.name} (${evidenceLabel})${qualifier}`));
        }
        if (item.ingredients?.length) ingredientContent.append(list);
        setSection(ingredients, ingredientContent);
      }

      const price = getSection(main, "Price");
      if (price) setSection(price, makeText("p", "Not listed in the supplied sources.", "detail-value"));

      const match = [...main.querySelectorAll(".detail-section")]
        .find(section => section.querySelector("h2")?.textContent.startsWith("Match for"));
      if (match) setSection(match, makeText("p", "Sample catalog item only — no restriction-match result is included in this fixture.", "detail-value sample-warning"));

      const sources = [...new Set(item.sourceIds || [])];
      replacePlaceholderWithLinks(main, "Sources", sources);

      const warning = getSection(main, "Warnings");
      if (warning) {
        let text = item.allergenStatus || "Allergen information is not established for this item.";
        if (item.allergenFacts?.length) {
          text += ` Source observation: ${item.allergenFacts.map(fact => fact.sourceObservation).join(" ")}`;
        }
        text += " Unmarked allergen fields remain unknown; confirm ingredients and preparation with the restaurant.";
        setSection(warning, makeText("p", text, "detail-value sample-warning"));
      }
    }

    function enhance() {
      const main = frameDocument.querySelector("#app main");
      if (!main || main === lastMain) return;
      lastMain = main;
      const title = main.querySelector("h1")?.textContent.trim() || "";
      if (["Best matches", "No matches for everyone", "No matches"].includes(title)) {
        enhanceResults(main);
      } else if (title.startsWith("Restaurant ")) {
        enhanceRestaurant(main);
      } else if (fixture.menuItems.some(item => item.id === title)) {
        enhanceMeal(main);
      }
    }

    enhance();
  }

  function showLoadError() {
    const message = document.createElement("p");
    message.textContent = "Costa Vida sample data could not be loaded. Serve the project over localhost and reopen this demo.";
    Object.assign(message.style, {
      position: "fixed", zIndex: "10", inset: "12px 12px auto", margin: "0",
      padding: "12px", borderRadius: "10px", background: "#fff1f0", color: "#85241f",
      font: "14px system-ui, sans-serif"
    });
    document.body.append(message);
  }
})();
