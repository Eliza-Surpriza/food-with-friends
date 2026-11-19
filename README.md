# Food with Friends

Next.js App Router frontend with TypeScript. The app is configured for a static export so GitHub Pages can host the UI; group search can call the Supabase Edge Function when its public URL is configured.

## Run locally

Use Node.js 20.9 or newer. Install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. Without `NEXT_PUBLIC_SEARCH_FUNCTION_URL`, the group flow uses a clearly labeled sample preview and does not claim the sample menu matches anyone's dietary needs.

To connect search, copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SEARCH_FUNCTION_URL` to the Supabase Edge Function URL. This URL is public configuration; never put AI provider keys or Supabase service-role credentials in frontend environment variables.

## GitHub Pages

The production build exports static files to `out/`. Set `NEXT_PUBLIC_BASE_PATH=/food-with-friends` during the build if the repository is published from a project path. The Supabase Edge Function must separately allow the local and published site origins through CORS.
