# Taskboard

A task board built with Next.js 16 (App Router), React 19, Prisma 5 on MySQL 8 (dockerized), Zod, and Tailwind 4.

## Setup

```bash
cd my-app
npm install
# .env: DATABASE_URL="mysql://root:<pw>@localhost:3307/taskboard-db"
#       MYSQL_ROOT_PASSWORD=<pw>
docker compose up -d        # MySQL on host port 3307
npm run prisma:migrate      # no migrations are committed; the first run creates one
npm run dev
```

`npm test` runs Jest (jsdom + Testing Library). `npm run prisma:studio` opens a DB browser.

## Deploy

GitHub Pages can't host this (API routes + MySQL). Deploy on Vercel instead:

1. Create a hosted MySQL database (e.g. TiDB Cloud Serverless or Aiven) and copy its Prisma connection string.
2. Create the tables once from `my-app`: `DATABASE_URL="<hosted-url>" npx prisma db push`. In PowerShell, run `$env:DATABASE_URL="<hosted-url>"; npx prisma db push`.
3. On Vercel, import this repo. Set **Root Directory** to `my-app` and add the `DATABASE_URL` env var, then deploy. Every push to `main` redeploys.

**Docker instead:** from `my-app`, run `docker build -t taskboard .` and then `docker run -p 3000:3000 -e DATABASE_URL="<url>" taskboard`. If you're using the compose MySQL, write `host.docker.internal` in the URL instead of `localhost`. `.dockerignore` keeps `.env` files out of the image.

`postinstall` runs `prisma generate`, because Vercel's dependency cache would otherwise leave the Prisma client missing or out of date. With no auth, everyone using the deployed site shares one board.

## Architecture

```
page.tsx ─ useTaskBoard ─ fetch ─ /api/tasks/* ─ Prisma ─ MySQL
```

- **Source of truth is split.** Tasks live in MySQL. Column list, column colours, and background are in `localStorage` via `useSyncExternalStore`, so they're per-browser. Columns are rebuilt from task categories on load, which means an empty column exists only in the browser that created it.
- **Categories are just a nullable string on `Task`.** There's no Category table. Deleting a column is one `updateMany` that nulls the category, so it either fully succeeds or does nothing.
- **Tags** are a `Json` string array on `Task` (max 10 × 30 chars, validated by Zod), so you can't filter by tag in SQL.
- **Due dates** are picked as date-only values and sent as the local midnight in UTC ISO format. They show up on the previous day if read as UTC in a timezone east of UTC.
- **PATCH semantics:** a missing field stays unchanged; `null` clears `category` and `dueDate`.
- **No auth.** A `User` model exists and `Task.userId` is optional, but nothing uses it yet.

## API

| Route | Method | Body / notes |
|---|---|---|
| `/api/tasks` | GET | All tasks, unsorted (the client sorts). |
| `/api/tasks` | POST | `{ title, description, category?, dueDate?, tags? }` → 201. |
| `/api/tasks` | PATCH | `{ clearCategory }` moves every task in that category to uncategorized and returns `{ count }`. |
| `/api/tasks/:id` | PATCH | Any subset of `title, description, completed, category, dueDate, tags`. |
| `/api/tasks/:id` | DELETE | `{ success: true }`. |

Zod failures return 400 with the issue array. A non-integer id returns 400. Prisma errors return 500.

## Files

```
my-app/
├─ app/
│  ├─ page.tsx                    client page; composes the hooks below with the components
│  ├─ layout.tsx                  root layout, Geist fonts
│  ├─ globals.css                  Tailwind + .field/.btn* component classes; .btn-secondary text tints from --page-color
│  ├─ api/tasks/route.ts           collection routes (GET/POST/bulk PATCH)
│  ├─ api/tasks/[id]/route.ts      item routes (PATCH/DELETE)
│  ├─ components/
│  │  ├─ BoardColumn.tsx           column: native HTML5 drag-and-drop target, colour picker, delete, add-task toggle
│  │  ├─ TaskCard.tsx              card with inline edit mode
│  │  ├─ AddTaskForm.tsx           new-task form; blocks double submit while saving
│  │  ├─ AddCategoryTile.tsx       new-column input (Enter/Escape)
│  │  └─ BackgroundPicker.tsx      colour input + image upload
│  └─ lib/
│     ├─ useTaskBoard.ts           all board state: fetch, CRUD (state updates after the server responds, not optimistically), grouping, sorting
│     ├─ storedValue.ts            localStorage-backed hook factory; in-memory fallback, SSR-safe snapshot
│     ├─ useBackground.ts          stored background; uploads downscaled to 1920px JPEG data URLs
│     ├─ useCategoryColors.ts      per-column colour overrides, otherwise a hash-based palette
│     └─ prisma.ts                 PrismaClient singleton (survives dev HMR)
├─ prisma/schema.prisma            Task, User
├─ docker-compose.yml              mysql:8.0, named volume, password from .env
├─ Dockerfile, .dockerignore       app image (node:22-alpine, next build → next start on :3000)
├─ *.test.jsx                      TaskCard + hook tests (useTaskBoard mocks fetch)
└─ jest.config.cjs, jest.setup.js, eslint.config.mjs, postcss.config.mjs, tsconfig.json
```

Leftovers you can ignore or delete: `public/*.svg` and `my-app/README.md` (create-next-app defaults), `.gitattributes` (from `prisma init`, points at paths that don't exist), and `skills-lock.json` (AI-assistant skill manifest). `.postman/` and `postman/` link the repo to a Postman workspace for manual API testing.
