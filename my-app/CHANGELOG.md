# Changelog

All notable changes to the Taskboard app. Newest first.

## 2026-09-27 — Button text follows the background colour

- `app/globals.css`: `.btn-secondary` text (Add Task, Add Category/List, Upload picture, Remove picture, Cancel) now uses the page background colour instead of fixed violet. Light colours are darkened (`oklch(from … min(l, 0.5) c h)`) so the text stays readable on the white button.
- `app/page.tsx`: sets the CSS variable `--page-color` on the page for the rule above.
- `app/lib/useBackground.ts`: new `backgroundColor(background)`, which gives the background as `#rrggbb`, or the default violet while a picture is the background. `BackgroundPicker.tsx` now uses it too.
- Verification: `tsc`, `eslint`, `jest` (8/8) clean; the compiled CSS keeps the rule unchanged. Not checked visually in a browser.

## 2026-09-27 — Review fixes and cleanup

### What changed for users
- **Empty categories survive a reload.** The category list is saved in this browser (`localStorage` key `taskboard-categories`), like the colours and background.
- **No duplicate tasks from a double-click.** The Add button in the Add Task form is disabled while the task is saving.
- **Completed styling removed.** The green card and struck-through title for completed tasks are gone, since nothing in the UI can mark a task completed any more.
- The Add Category form has rounded corners again (`rounded-2x1` typo → `rounded-2xl`).

### Code changes
| File | Change |
|---|---|
| `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts` | Removed `include: { user: true }` (it sent each task's user, including their email, to every visitor) and the `userId` field, which nothing sent. |
| `app/lib/storedValue.ts` | The setter also accepts a function of the current value, like React's `setState`. |
| `app/lib/useTaskBoard.ts` | `columns` comes from `createStoredValue("taskboard-categories", "[]")` instead of `useState`; `setColumns(update)` is used the same way as before. |
| `app/components/AddTaskForm.tsx` | New `saving` state disables Add while the request is in flight. |
| `app/components/TaskCard.tsx`, `BoardColumn.tsx` | Removed the `completed` prop and its styling. |
| `app/layout.tsx` | Removed Radix Themes (its stylesheet and `<Theme>` wrapper); no Radix components were used. |
| `docker-compose.yml` | Now matches `.env`: `mysql:8.0`, port `3307`, database `taskboard-db`, password read from `MYSQL_ROOT_PASSWORD` in `.env`. Removed the obsolete `version:` line. |
| `package.json` | Uninstalled unused `@radix-ui/themes`, `dotenv`, `nodemon`, `ts-node`; removed `npm init` leftovers (`main`, `keywords`, `author`, `license`, `description`). |
| `tsconfig.json`, `.gitignore` | Removed `outDir`/`sourceMap` (ignored with `noEmit`) and duplicate or unused ignore entries. |
| `useTaskBoard.test.jsx` | **New.** Checks an empty category is saved and still shows after a reload. |

### Verification
- `npx tsc --noEmit`, `npx eslint app`: clean. `npx jest`: 8/8 pass. `docker compose config`: valid. Dev server: `GET /` and `GET /api/tasks` return 200. Not checked visually in a browser.

## 2026-09-27 — Remove background picture

- `app/components/BackgroundPicker.tsx`: while a picture is the background, a **Remove picture** button appears next to "Upload picture". Clicking it switches back to the default colour (`DEFAULT_BACKGROUND`), and that choice is remembered in this browser.

## 2026-09-27 — Page title visible again

- `app/page.tsx`: the gradient title was removed by hand, but `text-transparent` stayed, which made "Taskboard Demo" invisible. Removed it; the title now uses the page's default dark text colour (`text-slate-900`).

## 2026-09-27 — Custom colour per category

### What changed for users
- **Click a category's colour dot** (next to its name) to open a colour picker. The chosen colour is used for the dot and the column's colour bar, and is remembered in this browser. Works for every column, including Uncategorized.
- Categories you haven't picked a colour for keep their automatic colour.

### Code changes
| File | Change |
|---|---|
| `app/lib/storedValue.ts` | **New.** `createStoredValue(key, default)` returns a hook `[value, setValue]` for one text value saved in `localStorage`. This is the logic that was previously written inline in `useBackground.ts`, moved here so category colours can reuse it. |
| `app/lib/useBackground.ts` | Now a one-liner using `createStoredValue("taskboard-background", DEFAULT_BACKGROUND)`. Same behaviour and storage key as before. |
| `app/lib/useCategoryColors.ts` | **New.** `useCategoryColors()` returns `colorFor(name)` (picked colour, else the automatic one; grey `#94a3b8` for Uncategorized) and `setColor(name, color)`. Colours are stored as JSON under the `localStorage` key `taskboard-category-colors`. Damaged JSON falls back to automatic colours. |
| `app/components/BoardColumn.tsx` | Uses `useCategoryColors()` instead of `colorForCategory()`. The 10px dot became a 16px clickable dot: a `<label>` with an invisible `<input type="color">` stretched over it. Hovering shows a ring. |
| `useCategoryColors.test.jsx` | **New.** Checks the automatic colour is used by default, a picked colour replaces it (only for that category), and it's saved to `localStorage`. |

### Notes
- Colours are per browser, like the background, not saved in the database. Other people and other devices see the automatic colours.
- Deleting a category leaves its colour in storage, so re-creating a category with the same name brings the colour back.

### Verification
- `npx tsc --noEmit`, `npx eslint app`: clean. `npx jest`: 7/7 pass. Not checked visually in a browser.

## 2026-09-27 — Spacing around the colour bar

- `app/components/BoardColumn.tsx`: the colour bar now floats inside the column instead of touching its edges: `absolute inset-y-3 left-2 w-3 rounded-full` (12px from the top and bottom, 8px from the left, 12px wide, both ends rounded). The column gained `pl-8` (32px left padding = 8px offset + 12px bar + 12px gap) so the header, buttons and task cards no longer sit against the bar.

## 2026-09-27 — Colour bar flipped

- `app/components/BoardColumn.tsx`: the colour bar's rounded ends now face outward (`rounded-l-full` instead of `rounded-r-full`); its flat side now faces the column content. The bar's gap from the top and bottom is `inset-y-1` (4px, changed by hand from 16px); the comment above it was updated to match.

## 2026-09-27 — Straight category colour bar

- `app/components/BoardColumn.tsx`: the category colour was a thick left border (`border-l-5` + inline `borderLeftColor`), which curved around the rounded corners. Replaced with a separate bar: an absolutely positioned `<div>` (`absolute inset-y-4 left-0 w-1.5 rounded-r-full`) in the category colour. The column got `relative` so the bar positions against it. `inset-y-4` (16px) equals the `rounded-2xl` corner radius, so the bar stays on the straight part of the edge.

## 2026-09-27 — Rounded category columns

- `app/components/BoardColumn.tsx`: the column class had `rounded-2x3`, which isn't a Tailwind class, so columns had square corners. Changed to `rounded-2xl` (16px radius).

## 2026-09-27 — Background: colour picker + picture upload

### What changed for users
- **Presets removed.** The six gradient swatches are gone. The background is now set with a **colour picker** ("Background colour") or by **uploading a picture**.
- **Picture backgrounds.** "Upload picture" accepts any image the browser can read (JPG, PNG, WebP, GIF…). It fills the whole page, cropping the edges if the shape doesn't match. Choosing a colour afterwards replaces the picture.
- **Default** is now solid violet (`#8b5cf6`) instead of the Sunset gradient. Anyone who had picked a preset keeps it until they choose a new colour or picture.
- If a file can't be read (e.g. HEIC photos in most browsers), a red message appears next to the button.

### Code changes
| File | Change |
|---|---|
| `app/lib/useBackground.ts` | Removed `BACKGROUND_PRESETS`. Added exported `DEFAULT_BACKGROUND` (`#8b5cf6`). Added `imageFileToBackground(file)`: shrinks the picture to at most 1920px on its longest side, re-encodes it as JPEG (quality 0.85, transparent areas become white) and returns a CSS value `url("data:…") center / cover no-repeat`. Shrinking keeps it well under the ~5 MB `localStorage` limit so it survives a reload. |
| `app/components/BackgroundPicker.tsx` | Rewritten: a visible native `<input type="color">` and an "Upload picture" button (a `<label>` wrapping a visually hidden `<input type="file" accept="image/*">`). Shows an error message if the picture can't be read. |
| `useBackground.test.jsx` | Uses `DEFAULT_BACKGROUND` instead of the removed presets. |

### Verification
- `npx tsc --noEmit`, `npx eslint app`: clean. `npx jest`: 6/6 pass.
- `GET /` returns 200 and includes the new controls.
- **Not automatically tested:** the picture upload itself (the test environment has no canvas/image decoding). Check it by hand in a browser.

## 2026-09-27 — Vibrant colour palette and customizable background

### What changed for users
- **New colour scheme.** Violet/fuchsia replaces the old indigo/grey look: gradient primary buttons, violet secondary buttons and focus rings, a gradient page title, fuchsia tag chips, sky-blue due-date badges.
- **Customizable background.** A "Background" picker next to "Sort Tasks by" offers six presets (Sunset, Ocean, Aurora, Candy, Pastel, Midnight) plus a rainbow circle that opens a colour picker for any solid colour. The choice is saved in the browser and restored on the next visit. Default: Sunset.
- **Readable on any background.** The title/toolbar area and every column sit on frosted white panels (`bg-white/80`–`/85` + `backdrop-blur`), so text stays readable even on dark or bright backgrounds.

### Code changes
| File | Change |
|---|---|
| `app/lib/useBackground.ts` | **New.** `BACKGROUND_PRESETS` list and a `useBackground()` hook returning `[background, setBackground]`. Saves to `localStorage` under the key `taskboard-background`. Uses `useSyncExternalStore` so server rendering uses the default and the browser switches to the saved value without a hydration mismatch. Keeps an in-memory copy so the picker still works if `localStorage` is blocked. |
| `app/components/BackgroundPicker.tsx` | **New.** Round swatch buttons for each preset (`aria-pressed` marks the selected one) and a hidden `<input type="color">` stretched over a rainbow circle for custom colours. |
| `app/page.tsx` | Page background now comes from `useBackground()` via an inline `style`. Title and sort dropdown moved into a frosted panel together with the new `BackgroundPicker`. Gradient title text. Loading message given a frosted pill so it's readable. |
| `app/globals.css` | `.btn-primary` → violet-to-fuchsia gradient. `.btn-secondary` → white with violet border/text. `.field` and `.btn` focus colours → violet. |
| `app/components/BoardColumn.tsx` | Column background → frosted white with shadow; drag-over highlight → violet. "Drop tasks here" placeholder → violet. |
| `app/components/TaskCard.tsx` | Tag chips → fuchsia. Due-date badge → sky blue (overdue stays red, slightly stronger). |
| `app/lib/useTaskBoard.ts` | `CATEGORY_COLORS` swapped for a brighter set (violet, pink, cyan, green, amber, red, blue, orange). Existing categories may get a different colour than before. |
| `useBackground.test.jsx` | **New.** Checks the default background, that choosing one applies it, and that it's saved to `localStorage`. |

### How to add or change a background preset
Edit `BACKGROUND_PRESETS` in `app/lib/useBackground.ts`. Each entry is `{ name, value }`, where `value` is any CSS `background` value (a colour or a gradient). The first entry is the default.

### Verification
- `npx tsc --noEmit`: no errors in app code.
- `npx jest`: 6/6 tests pass.
- `npx eslint app`: no warnings.
- `GET /` returns 200 and includes the picker. Not checked visually in a browser.

---

## Earlier changes (2026-09-27)

- **Sort fix.** "Newest" now sorts by id, highest first. Before, it showed tasks in database order (oldest first after a reload). Title sort now orders numbers naturally ("Task 2" before "Task 10").
- **Uncategorized column** only appears when at least one task has no category.
- **Column colour** shown as a thick left border in the category's colour.
- **Add Category** uses an inline form instead of `window.prompt()` (which some embedded browsers block). Duplicate names show an error instead of failing silently.
- **Tags.** Tasks can have up to 10 comma-separated tags (new `tags` JSON column on `Task`; run `npx prisma db push` and `npx prisma generate` on other machines).
- **Add Task** button in each column opens an inline form; the task gets that column's category.
- **Readability refactor.** `page.tsx` split into `BoardColumn`, `AddTaskForm` and `AddCategoryTile` components; form state moved out of `useTaskBoard`.
- **Due date fix.** Editing a task no longer shifts its due date back one day for users east of UTC.
