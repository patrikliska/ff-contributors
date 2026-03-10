# CLAUDE.md — Git Contributors Dashboard

## Project Overview

A React single-page app that visualizes git contributor statistics for the ChyronHego Frontend Framework (FF) project. Deployed to GitHub Pages. Dark terminal/cyberpunk aesthetic with animated bar charts, hover effects, and team grouping.

## Tech Stack

- **React 18** (Vite)
- **TypeScript**
- **CSS Modules** or inline styles (no Tailwind, no MUI — keep it zero-dependency for styling)
- **GitHub Pages** deployment via `gh-pages` package
- **Google Fonts**: JetBrains Mono

## Design

Dark terminal aesthetic. Background `#0a0a0f`, accent color `#00f0ff` (cyan). JetBrains Mono monospace font throughout. Animated bar chart rows that slide in on load. Hover highlights with glow effects. Each contributor gets a unique accent color from a rotating palette. Scanline animation across the top for subtle CRT effect.

### Layout

```
┌─────────────────────────────────────────────┐
│ ● ● ●  FF server                         │
│ git contributors                            │
│ [45 authors] [1,621 commits] [215 top]      │
│ Updated: 2026-03-10                         │
├─────────────────────────────────────────────┤
│ [People ○ Teams] toggle                     │
│                                             │
│ $ git shortlog -sne --all _                  │
│                                             │
│ 01  David Krpec      ████████████████  215  │
│ 02  Martin Skarabela ██████████       164  │
│ 03  ...                                     │
│                                             │
│ [▼ Show all 20 contributors]                │
├─────────────────────────────────────────────┤
│ ChyronHego · Frontend Framework · 2026               │
└─────────────────────────────────────────────┘
```

## Data Model

All data lives in a single file: `src/data/contributors.ts`. No backend, no API. Manual updates by editing this file.

```ts
// src/data/contributors.ts

export interface Alias {
  name: string;
  commits: number;
}

export interface Contributor {
  /** Primary display name */
  name: string;
  /** Total commits (sum of all aliases + own) */
  commits: number;
  /** Alternative git identities that map to this person */
  aliases?: Alias[];
  /** Team assignment (optional) */
  team?: string;
}

export interface TeamDefinition {
  name: string;
  color: string;
}

/** Last time the data was refreshed */
export const LAST_UPDATED = "2026-03-10";

/**
 * Team definitions with display colors.
 * Contributors reference teams by name string.
 */
export const TEAMS: TeamDefinition[] = [
  { name: "Frontend", color: "#00f0ff" },
  { name: "Backend", color: "#ff3e6c" },
  { name: "DevOps", color: "#22d65e" },
  { name: "QA", color: "#facc15" },
  { name: "Design", color: "#a855f7" },
];

/**
 * HOW TO UPDATE:
 * 1. Run `git shortlog -sne --all --no-merges` in the FF repo
 * 2. Merge duplicate identities into a single Contributor with aliases
 * 3. Update LAST_UPDATED date
 *
 * Alias merging example:
 *   "Martin Skarabela" (1 commit) + "MartinSkarabela" (57) + "Skarabela" (107)
 *   → single entry: { name: "Martin Skarabela", commits: 165, aliases: [...] }
 */
export const CONTRIBUTORS: Contributor[] = [
  {
    name: "David Krpec",
    commits: 215,
    aliases: [],
    team: "Frontend",
  },
  {
    name: "Martin Skarabela",
    commits: 165, // 107 + 57 + 1
    aliases: [
      { name: "Skarabela", commits: 107 },
      { name: "MartinSkarabela", commits: 57 },
      { name: "Martin Skarabela", commits: 1 },
    ],
    team: "Frontend",
  },
  {
    name: "David",
    commits: 157,
    aliases: [],
    team: undefined, // unassigned
  },
  // ... etc — full list below in INITIAL DATA section
];
```

### How updating works

The contributor data is a **manually edited TypeScript array**. To update:

1. Run `git shortlog -sne --all --no-merges` in the Frontend Framework repo
2. Open `src/data/contributors.ts`
3. Update numbers, merge new aliases, add new people
4. Update `LAST_UPDATED`
5. Commit & push → GitHub Actions rebuilds and deploys

This is intentionally simple. No database, no scraping, no git hooks.

## Features

### 1. Bar Chart View (People mode)

- Sorted by total commits descending
- Each row: rank number, name, animated bar, commit count, percentage of total
- Initially show top 16, expandable to all via toggle button
- On hover over a row:
  - Bar glows brighter
  - Name and numbers highlight with the row's accent color
  - If the contributor has aliases, show a small tooltip/popover below the name listing the aliases with their individual commit counts, e.g.:
    ```
    Martin Skarabela (165 total)
    ├ Skarabela — 107
    ├ MartinSkarabela — 57
    └ Martin Skarabela — 1
    ```
  - Tooltip should appear with a slight delay (~300ms) and fade in. No external tooltip library — build a simple positioned div.

### 2. Team View

- Toggle switch at the top: `People | Teams`
- In Teams mode, show one bar per team with the team's total commits (sum of all members)
- Sorted by total commits descending
- Each team row is expandable (click to expand) — shows the team's members as sub-rows indented underneath, each with their own mini bar relative to the team's total
- Team bar color matches the team's defined color from `TEAMS`
- Contributors without a team go into an "Unassigned" group at the bottom

### 3. Stats Header

Show three stats in the header:
- Total unique contributors (after alias merging)
- Total commits
- Top contributor's commit count

Plus the `LAST_UPDATED` date displayed as a subtle label, e.g. `Updated: 2026-03-10`

### 4. Animations

- Bar rows slide in from left with staggered delay (`animation-delay: index * 40ms`)
- Bars grow from 0% to final width
- Scanline effect across the page (subtle)
- Blinking cursor after the `$ git shortlog` line
- Smooth transitions on hover (color, glow, brightness)
- Toggle between People/Teams should animate (fade or slide transition)

## Component Structure

```
src/
├── data/
│   └── contributors.ts        # All data lives here
├── components/
│   ├── Header.tsx              # Title, stats, terminal dots, updated date
│   ├── ViewToggle.tsx          # People | Teams toggle switch
│   ├── Chart.tsx               # Main chart container, handles view mode
│   ├── PersonRow.tsx           # Single contributor bar row
│   ├── PersonRow.module.css    # Styles for PersonRow
│   ├── TeamRow.tsx             # Expandable team row with sub-rows
│   ├── TeamRow.module.css      # Styles for TeamRow
│   ├── AliasTooltip.tsx        # Hover tooltip showing aliases
│   ├── Footer.tsx              # Footer with branding
│   └── ShowMoreButton.tsx      # Toggle to expand/collapse list
├── hooks/
│   └── useContributorData.ts   # Hook that processes raw data → sorted, merged, team-grouped
├── utils/
│   └── colors.ts               # Accent color palette and getter
├── App.tsx
├── App.css                     # Global styles, animations, scrollbar, scanline
├── main.tsx
└── index.html
```

## GitHub Pages Deployment

### Setup

```bash
npm install gh-pages --save-dev
```

In `vite.config.ts`:
```ts
export default defineConfig({
  base: '/<repo-name>/',  // e.g. '/ff-contributors/'
  plugins: [react()],
});
```

In `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  },
  "homepage": "https://<username>.github.io/<repo-name>/"
}
```

### Deploy

```bash
npm run deploy
```

This pushes the `dist/` folder to the `gh-pages` branch automatically.

## Initial Data

Here is the full merged contributor list to seed `src/data/contributors.ts`. Aliases are pre-merged where obvious duplicates exist. Team assignments are placeholders — update as needed.

```ts
export const CONTRIBUTORS: Contributor[] = [
  {
    name: "David Krpec",
    commits: 216, // 215 + 1 (David Slabý is separate person)
    aliases: [
      { name: "David Krpec", commits: 215 },
      { name: "David Slabý", commits: 1 },
    ],
    team: "Frontend",
  },
  {
    name: "Martin Skarabela",
    commits: 165,
    aliases: [
      { name: "Skarabela", commits: 107 },
      { name: "MartinSkarabela", commits: 57 },
      { name: "Martin Skarabela", commits: 1 },
    ],
    team: "Frontend",
  },
  {
    name: "David",
    commits: 157,
    team: undefined,
  },
  {
    name: "Tadeas Jindra",
    commits: 107,
    team: undefined,
  },
  {
    name: "Michael Polivka",
    commits: 103,
    aliases: [
      { name: "Michael Polivka", commits: 101 },
      { name: "Michael Polívka", commits: 2 },
    ],
    team: undefined,
  },
  {
    name: "Honza Kovář",
    commits: 112,
    aliases: [
      { name: "Honza Kovář", commits: 59 },
      { name: "honzaKovar", commits: 47 },
      { name: "Honza Kovar", commits: 6 },
    ],
    team: undefined,
  },
  {
    name: "Roman Polak",
    commits: 90,
    team: undefined,
  },
  {
    name: "Martin",
    commits: 84,
    team: undefined,
  },
  {
    name: "Patrik Liška",
    commits: 86,
    aliases: [
      { name: "Patrik Liška", commits: 84 },
      { name: "Patrik", commits: 2 },
    ],
    team: "Frontend",
  },
  {
    name: "Michal Kopcil",
    commits: 69,
    aliases: [
      { name: "Michal Kopcil", commits: 61 },
      { name: "MichalKopcil", commits: 7 },
      { name: "Michal Kopčil", commits: 1 },
    ],
    team: undefined,
  },
  {
    name: "david.slaby",
    commits: 68,
    team: undefined,
  },
  {
    name: "Vojtech Fadrny",
    commits: 46,
    team: undefined,
  },
  {
    name: "Michael",
    commits: 44,
    team: undefined,
  },
  {
    name: "Lukáš Philipp",
    commits: 47,
    aliases: [
      { name: "lukas.philipp", commits: 40 },
      { name: "Lukáš Philipp", commits: 7 },
    ],
    team: undefined,
  },
  {
    name: "Jiri Zalud",
    commits: 29,
    team: undefined,
  },
  {
    name: "Alfons Zelicko",
    commits: 20,
    aliases: [
      { name: "AlfonsZelicko", commits: 10 },
      { name: "Alfons Zelicko", commits: 9 },
      { name: "alfons zelicko", commits: 1 },
    ],
    team: undefined,
  },
  {
    name: "Silvia Sojčáková",
    commits: 16,
    aliases: [
      { name: "Silvia Sojčáková", commits: 10 },
      { name: "Silvia Sojcakova", commits: 6 },
    ],
    team: undefined,
  },
  {
    name: "Victoria Rodriguez",
    commits: 13,
    team: undefined,
  },
  {
    name: "Vojtěch Šanda",
    commits: 7,
    team: undefined,
  },
  {
    name: "Ján Kováč",
    commits: 13,
    aliases: [
      { name: "Jan Kovac", commits: 7 },
      { name: "Ján Kováč", commits: 6 },
    ],
    team: undefined,
  },
  {
    name: "Jiri Zelenka",
    commits: 10,
    team: undefined,
  },
  {
    name: "Ondrej Vagner",
    commits: 10,
    team: undefined,
  },
  {
    name: "Patrik Křemeček",
    commits: 9,
    team: undefined,
  },
  {
    name: "Dmytro Kranin",
    commits: 4,
    team: undefined,
  },
  {
    name: "Krzysztof Majda",
    commits: 3,
    team: undefined,
  },
  {
    name: "Martin Vana",
    commits: 3,
    team: undefined,
  },
  {
    name: "mskara",
    commits: 3,
    team: undefined,
  },
  {
    name: "Tomas Turan",
    commits: 2,
    team: undefined,
  },
  {
    name: "Jana Zíková",
    commits: 1,
    team: undefined,
  },
  {
    name: "Ondrej Mikula",
    commits: 1,
    team: undefined,
  },
  {
    name: "Ondrej Molnar",
    commits: 1,
    team: undefined,
  },
];
```

> **NOTE**: The alias merging above is my best guess from the git shortlog output. Review and correct — especially "David" (157 commits) and "Martin" (84 commits) which might be aliases of existing people but I can't tell for sure. Same for "Michael" (44) vs "Michael Polivka". Also "David Slabý" (1) is NOT merged into "David Krpec" — they look like different people — fix the initial data entry above if that's wrong.

## Style Reference

### Color Palette (rotating per contributor)

```ts
const ACCENT_COLORS = [
  "#00f0ff", "#ff3e6c", "#a855f7", "#22d65e", "#ff9f1c",
  "#3b82f6", "#f472b6", "#facc15", "#14b8a6", "#e879f9",
  "#fb7185", "#38bdf8", "#4ade80", "#f97316", "#818cf8",
];
```

### Key CSS Values

- Background: `#0a0a0f`
- Card/section bg: `rgba(255,255,255,0.03)`
- Border: `rgba(255,255,255,0.06)`
- Primary text: `rgba(255,255,255,0.9)`
- Secondary text: `rgba(255,255,255,0.3)`
- Muted text: `rgba(255,255,255,0.15)`
- Accent: `#00f0ff`
- Font: `'JetBrains Mono', monospace`

## What NOT to Do

- No backend, no API calls, no database
- No external UI libraries (no MUI, no Chakra, no Ant)
- No Tailwind
- No localStorage or sessionStorage
- No over-engineering — this is a simple static visualization
- Don't fetch from git at runtime — data is hardcoded

## Summary

Build a Vite + React + TypeScript app. All data in one `.ts` file. Two views (People / Teams) with a toggle. Animated dark terminal aesthetic. Alias tooltips on hover. Deployable to GitHub Pages with `npm run deploy`. Keep it simple, keep it pretty.
