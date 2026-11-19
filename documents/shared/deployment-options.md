# Deployment and Search Architecture Options

**Decision status:** Selected: Option B, GitHub Pages + Supabase Edge Function.

**Context:** Next.js + Supabase is the selected app/data stack. The team prefers GitHub Pages because it is free, and wants to compare deployment approaches before deciding. Visitors should only need a browser. The proposed group-search API contract is in [`search-api-contract.md`](search-api-contract.md).

The team agreed to the backend plan: a static Next.js export on GitHub Pages, Supabase Postgres for the reviewed catalog, and a Supabase Edge Function for protected search-time AI. Option C remains here as a comparison only; it is not the selected direction.

## Options at a glance

| Option | Hosting | Search logic | Keeps the proposed `POST /api/search`? | Cost profile |
| --- | --- | --- | --- | --- |
| A. Vercel + Supabase | Vercel hosts the Next.js app; Supabase hosts Postgres | Next.js server route | Yes | Can be $0 for a non-commercial project within free-plan quotas |
| B. GitHub Pages + Supabase Edge Function | GitHub Pages hosts static Next.js output; Supabase hosts the function and database | Supabase Edge Function | Same request/response shape, but a Supabase function URL replaces `/api/search` | Can be $0 within free-plan quotas |
| C. GitHub Pages + static catalog | GitHub Pages hosts static Next.js output and catalog data | Browser | No HTTP endpoint; matching becomes a browser-side function | $0 hosting; catalog updates are published with the site |

## Option A: Vercel + Supabase

### How it works

- Deploy Next.js with its server features enabled. The search handler can remain a Next.js Route Handler at `POST /api/search`.
- Connect the hosted app to a hosted Supabase database.
- Visitors open the deployed URL in a browser; they do not need Node.js, Docker, or Supabase installed.

### Advantages

- Requires the fewest architecture changes to the current proposal and API contract.
- The frontend and search endpoint live in one Next.js project.
- Vercel lists a $0 Hobby plan for personal, non-commercial projects. Supabase also offers a Free plan.

### Tradeoffs

- Vercel Hobby is limited to personal, non-commercial use and has usage caps. Confirm the project's use fits its terms.
- Supabase Free has resource limits and can pause projects after a week of inactivity. Current quotas and terms should be rechecked before launch.
- AI-provider API calls, if used, are billed separately by that provider.

### Effect on the API contract

No structural change is needed. The request and response in `search-api-contract.md` can remain as written.

## Option B: GitHub Pages + Supabase Edge Function

### How it works

- Configure Next.js for static export and publish its generated HTML, CSS, and JavaScript on GitHub Pages.
- Put the search handler in a Supabase Edge Function, which calls Supabase Postgres and returns the agreed result shape.
- The browser calls the Edge Function directly. Configure CORS for the published site and store any secret credentials in Supabase, not in the static site.

### Advantages

- Keeps GitHub Pages as the public site host.
- Retains server-side search logic and keeps the request/response data model from the proposed API contract.
- Supabase Free currently includes 500,000 Edge Function invocations per month.

### Tradeoffs

- Static Next.js export does not run a dynamic `POST /api/search` Route Handler. The function must have a Supabase URL, so the frontend API client needs a small change.
- This adds CORS configuration and a separate function deployment step.
- Supabase Edge Functions use a Deno-based TypeScript runtime, and the Free plan currently limits function wall time to 150 seconds. They suit short searches; heavy or long-running menu processing needs a separate worker.
- Supabase Free project and database limits still apply. AI-provider calls, if any, are separate costs.

### Effect on the API contract

Keep the same JSON request and response. Replace the relative `/api/search` endpoint with the deployed Supabase Edge Function URL, and agree on CORS and error behavior.

## Option C: GitHub Pages + static catalog and browser matching

### How it works

- Keep a reviewed restaurant/menu catalog as static JSON or another version-controlled data file in the repository.
- Publish the data alongside the Next.js static export on GitHub Pages.
- Download/read the catalog in the browser and run deterministic restriction matching and ranking there.
- Maintainers update the catalog through a reviewed repository change and republish the site. Menu extraction and AI assistance, if used, happen outside the public website.

### Advantages

- GitHub Pages can host the whole public site without a runtime server.
- No search endpoint, database service, CORS setup, or server deployment is required for the public search flow.
- No runtime secrets or AI-provider credentials are needed by the public site.

### Tradeoffs

- This changes the proposed API contract: `POST /api/search` becomes a browser-side matching function, and `search-api-contract.md` would need replacement or revision.
- This also changes the current AI-search direction: the public app would no longer call AI at search time. AI would need to be used offline during catalog preparation, or the team would need a different protected server-side service.
- The restaurant catalog is public in the browser. Only publish data intended to be public.
- Data changes require a reviewed commit and a site rebuild/redeploy; there is no live catalog update or server-side processing.
- Large catalogs or complex matching may make browser load and performance more important to manage.

### Effect on the API contract

Replace the HTTP endpoint contract with a typed function contract, such as `matchGroup(people, catalog) -> full | partial | none`. Keep the same result data fields where practical so the UI can remain similar.

## Remaining setup questions

- Confirm the repository's GitHub Pages base path and final published origin.
- Configure local and published origins for the Edge Function's CORS policy.
- Recheck free-tier limits and terms before launch.

## Sources checked 2026-11-18

- [Vercel pricing and Hobby plan terms](https://vercel.com/pricing)
- [Supabase pricing](https://supabase.com/pricing)
- [Supabase Edge Function pricing](https://supabase.com/docs/guides/functions/pricing)
- [Supabase Edge Function limits](https://supabase.com/docs/guides/functions/limits)
- [Supabase Edge Functions overview](https://supabase.com/docs/guides/functions)
- [Next.js static exports and unsupported runtime features](https://nextjs.org/docs/app/guides/static-exports)
- [Next.js deployment options](https://nextjs.org/docs/app/getting-started/deploying)
- [GitHub Pages overview and static hosting limitations](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
