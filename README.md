# ReviewLens

ReviewLens is a full-stack React + Express app that turns a product URL or pasted customer reviews into a structured AI shopping report.

## Features

- Gemini-powered JSON analysis with a strict system prompt
- 3-sentence TL;DR summary
- Positive / neutral / negative sentiment percentages with themes
- Top 3 praised and top 3 complained-about lists
- 1-10 buy verdict with one-line justification
- Edge-case handling for sparse reviews, non-English input, noisy product pages, and fake-review signals
- Copy report button
- Shareable report links using short UUIDs stored in SQLite

## Stack

- Frontend: React, Vite, Tailwind CSS, lucide-react
- Backend: Node.js, Express
- AI: Google Gemini REST API
- DB: SQLite file powered by `sql.js`

## Local Setup

```bash
npm install
cp .env.example .env
```

Set `GEMINI_API_KEY` in `.env`.

```bash
npm run dev
```

Open the Vite URL, usually `http://127.0.0.1:5173`.

The backend runs on `http://127.0.0.1:8787`. If `GEMINI_API_KEY` is not set, ReviewLens returns a clearly flagged local demo analysis so the UI can still be tested.

## API

`POST /api/analyze`

```json
{
  "inputType": "reviews",
  "input": "Paste reviews here..."
}
```

`inputType` can be `reviews`, `url`, or `auto`.

`GET /api/reports/:id`

Returns a saved shared report.

## Deployment Notes

This repo includes `vercel.json` and `api/index.js` for Vercel. Add these environment variables in Vercel:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` optional, defaults to `gemini-1.5-flash`
- `SQLITE_PATH` optional

Vercel serverless storage is ephemeral. For a production-grade share-link database, switch the small persistence layer in `server/db.js` to Supabase or another hosted database. The current SQLite setup is ideal for local development and lightweight demos.

## GitHub and Vercel Publishing

This workspace does not include an authenticated GitHub CLI or Vercel CLI session. To publish from your machine:

```bash
git init
git add .
git commit -m "Build ReviewLens full-stack app"
gh repo create reviewlens --public --source=. --remote=origin --push
vercel --prod
```

If `gh` or `vercel` is not installed, create the repo and project in their web dashboards and connect this folder.
