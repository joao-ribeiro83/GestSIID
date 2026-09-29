---
status: draft
shadcn_initialized: false
preset: none
created: 2026-09-15
step: MASTER_PLAN 1.2
---

# GestSIID — UI design contract

Binding for every SPA step (Phase 2 on). Authority: `DECISIONS.md` > `ARCHITECTURE.md` > this file. Tokens: `app/design-tokens.json`.

## 0. Scope, inputs, decisions

**Scope.** `app/apps/web`: tokens and theme, app shell, message channels, the DataBlock, and the screens in §4. Every other screen reuses a §4 pattern (table in §4.7). Out of scope: API, tests, deployment.

**Inputs read.** `STRUCTURE.md` §1–§3 · `ARCHITECTURE.md` (all) · `DECISIONS.md` D-01..D-31, A-01..A-08 · `BUSINESS_RULES.md` §2, §3 · `analysis/forms-xml/summary/*.md` (items, prompts, X/Y positions, alerts, LOVs, visual attributes) · `forms-xml/T/MD_SIID*_mmb.xml`, `FD_*_fmb.xml` (popup menus, tab pages, radio labels, window titles) · `db/tables/SVR_DOCUMENTOS_VW.md` (the real ESTADO labels) · GSD `UI-SPEC.md` template (checklist) · Context7: Tailwind v4 (`@theme`, `@custom-variant dark`), shadcn theming (CSS variables, `@theme inline`), TanStack Table v9 (`useTable`, `tableFeatures`, `manualPagination`, `rowCount`) · npm: `@fontsource-variable/ibm-plex-sans` 5.3.0, `@fontsource/ibm-plex-mono` 5.3.0.

**Design system**

| Property | Value |
|---|---|
| Tool | shadcn/ui CLI 4.21, copied source. Not initialised yet: the scaffold step runs `npx shadcn@4.21 init` (Vite, TypeScript, CSS variables, no preset) and then replaces the generated CSS with §1.2. |
| Component library | Radix (`radix-ui`) |
| Icons | `lucide-react`, 16 px, stroke 1.75 |
| Fonts | IBM Plex Sans Variable (UI and grids), IBM Plex Mono (codes), both self-hosted through `@fontsource` |
| Registry | shadcn official only. No third-party registry, so no vetting gate applies. |

**Decisions made in this spec**

| # | Decision | Reason |
|---|---|---|
| UI-01 | Type: IBM Plex Sans Variable + IBM Plex Mono, imported in `main.tsx` from `@fontsource-variable/ibm-plex-sans` and `@fontsource/ibm-plex-mono/{400,600}.css`. | Tabular figures, full Latin‑1/Ext‑A (ã õ ç ª º €), an engineered look that suits a document-engine back office. Bundled because this is an intranet app. |
| UI-02 | Primary colour "petrol" `#13655F` (dark theme `#5FB0A8`). | It descends from the Forms current-record mint (`CURRENT_REC r75g100b88`), and it leaves blue and dark red free for their legacy meanings. |
| UI-03 | OFFLINE rows use blue text (weight 600) and ANULADO rows use wine text (weight 600), each with a gutter icon. | Same as the Forms visual attributes `OFFLINE` (bold blue) and `ANULADO` (bold darkred). The icon means colour is not the only cue (WCAG 1.4.1). |
| UI-04 | The boldness goes into one place only: the 7-tone status palette plus the environment badge. Everything else is neutral: borders instead of shadows, 4 px radius, no zebra rows, no gradients. | A grid app earns its identity through density and a disciplined status colour system. |
| UI-05 | Colours are hex, not oklch. | Every ratio in §1.4 can be checked by hand, and shadcn accepts any CSS colour. |
| UI-06 | Density defaults to compact (28 px rows). Comfortable (36 px) is a per-viewer switch (`localStorage gestsiid.densidade`). | Operators need dense grids; the switch covers low-vision users. |
| UI-07 | Theme is the `dark` class on `<html>`, stored in `localStorage gestsiid.tema` (`claro` \| `escuro`), default light. It is applied by the external `public/theme-init.js`. | The CSP has `default-src 'self'` and no `script-src 'unsafe-inline'`, so an inline pre-paint script would be blocked. |
| UI-08 | The grid uses `role="grid"` with a roving tabindex, not a `table`. | Cell navigation, inline edit and selection all need grid semantics. |
| UI-09 | Dates are typed as `DD-MM-AAAA` in a masked text input. No calendar popover. | ARCHITECTURE rejects date libraries (react-day-picker needs date-fns). The native `type=date` format follows the browser locale, not `lang`. Typing is faster for operators. |
| UI-10 | Display formats: date `DD-MM-AAAA`, date-time `DD-MM-AAAA HH:MM`, numbers `Intl.NumberFormat('pt-PT', { useGrouping: 'always' })` (so `1 250`, `4,7`). | Portuguese convention. `'always'` makes 4-digit numbers group too, so counts line up. |
| UI-11 | Label rules. (a) Human-written Forms labels are copied verbatim. (b) ALL-CAPS strings become sentence case and arrow glyphs are dropped (`< VOLTAR` → `Voltar`, `BACKUP >` → `Backup`). (c) Prompts that Forms generated from the column name only get their accents back (`Codigo Postal` → `Código Postal`), marked FIX. (d) A raw column-code prompt reuses the legacy label of the same column elsewhere (`Cdemplea` → `Utilizador`, `Cddeparta` → `Depart.`). (e) A trailing `:` is dropped from field labels. | Keeps the words users know without inventing text. Rule (b) follows the copy guidance. |
| UI-12 | Documentos layout is stacked: list on top, detail tabs below. Tab labels are the `GENERICO` popup labels verbatim (`Mais Informação`, `Parâmetros`, `Comentários`, `Detalhes` = queue, `Log`), plus NEW `Anexos`. | Parity for UAT users (D-10). Forms had no attachments window; `/anexos` exists in §10.1. |
| UI-13 | Every Forms popup menu becomes both a row context menu (right-click, Shift+F10, Menu key) and visible toolbar buttons. | Discoverability and keyboard reach. |
| UI-14 | USER never sees ADM-only controls (they are hidden, not disabled). | D-08; ARCHITECTURE §5 "only hide". |
| UI-15 | Every Documentos batch action run with no selection shows toast #30 `Não existem documentos seleccionados.` and sends nothing. | The API requires `ids` (1..1000) or `consulta`. Forms checked only four actions and silently looped over nothing for the rest. This is a UI-only difference with no data difference. |
| UI-16 | The "Seleccionar todos" header checkbox switches to consulta mode: rows render ticked and locked, and a banner shows the count. It never ticks rows one by one. | ARCHITECTURE §4.2. The API has no "all except" form. |
| UI-17 | Edit mode rule: **inline** when the Forms block was a multi-record grid with ≤ 8 editable columns and no long text or image. **Side panel** (Sheet) when Forms used a single-record form layout, or there are > 8 editable fields, a textarea or an image. **Dialog** for named actions. | One predictable rule for every screen (§4.7 applies it). |
| UI-18 | Master-detail is stacked by default. Side-by-side (master 400 px) when the master grid shows ≤ 4 columns and there is a single detail; below 1280 px it falls back to stacked. | Wide masters need the full width. |
| UI-19 | Forms F-keys are not mapped where the browser owns the key (F5, F6, F7 caret browsing, F10 menu bar, F11, F12). F8 = Executar consulta and F9 = open LOV are aliases. Ctrl+S = Guardar. | `preventDefault` does not reliably win on those keys. |
| UI-20 | Impressoras Associadas and Alterar password sit under **Configuração**, ADM only, as in `MD_SIID_mmb.xml`. | Owner decision on OP-1 (DECISIONS A-09). |
| UI-21 | Login button is `Entrar` (NEW); Forms `CANCELAR` is dropped. | It matches the session text `A sessão expirou. Entre novamente.` (same verb everywhere). Forms `CANCELAR` exited the runtime, which has no web meaning. |
| UI-22 | Documentos action buttons are grouped by kind: print, re-send, queue, destructive. The legacy labels are verbatim. | Forms stacked them in one column; groups read faster across 1440 px. |
| UI-23 | Success toasts use the past participle of the button verb (`Guardar` → `Guardado.`). All new strings live in `packages/shared/src/pt.ts` (§2.8). | Copy guidance: one action name everywhere. |
| UI-24 | Grids have a 24 px row-status gutter as their first column. | Row states (new, dirty, deleted, error, conflict, offline, anulado) need a non-colour cue. |
| UI-25 | Environment badge: amber solid when `ambiente` contains `TESTE` (the Forms rule BR-XC-07), a quiet neutral outline otherwise. | Test must be unmistakable. A red production badge worn all day becomes noise. |
| UI-26 | Error toasts stay until closed; success disappears after 4 s, info after 6 s. | WCAG 2.2.1: users must be able to read errors. |
| UI-27 | On a 401 while a DataBlock is dirty, re-login happens in a modal on the same page; the unsaved rows stay and the user presses Guardar again. Any other 401 redirects to `/login`. | Prevents losing edits after the 30 min idle expiry. |
| UI-28 | Tailwind's default text sizes are reset and `xs/sm/base/lg` are redefined as 12/13/14/18 px. | shadcn copies use `text-xs/sm/base/lg`, so they land on the 4-size scale with no edits. |
| UI-29 | LOV dialog (searchable) for open-ended lists (modelos, usuarios, empregados, impressoras, utilizadores, meses, tipos de mídia). Select for domain values and small lookups. | Forms LOVs were used for large lists; domain record groups were list items. |
| UI-30 | Novo backup asks for confirmation before creating (NEW text). | It sets `BACKUP_ID` on every chosen document; the user cannot undo it. |

**Open points and conflicts found**

| # | Finding | What this spec does | Who decides |
|---|---|---|---|
| OP-1 | `forms-xml/T/MD_SIID_mmb.xml` nests **Impressoras Associadas** and **Alterar password** inside `CONFIGURAÇÃO_MENU`, not `GESTÃO_MENU`. In `MD_SIID_USER`, `CONFIGURAÇÃO` has `Enabled="false"`, so a Forms USER could not reach Impressoras Associadas at all. STRUCTURE §1/§2, D-08 and ARCHITECTURE §10 all place them under Gestão and give them to USER. | **Resolved 2026-09-15:** the owner chose Forms parity (DECISIONS A-09). Both items sit under Configuração, routes `/configuracao/...`, ADM only. | Owner (done) |
| OP-2 | The shadcn copies and this spec need runtime packages ARCHITECTURE §1 does not list: `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `sonner`, `cmdk`, `tw-animate-css`, `react-resizable-panels` (shadcn `resizable`), `@fontsource-variable/ibm-plex-sans`, `@fontsource/ibm-plex-mono`. `npx shadcn add sonner` also installs `next-themes`, which must be removed (UI-07 handles theme). | Lists them. | Add to ARCHITECTURE §1 in the scaffold step |
| OP-3 | In `FD_GESTAO_SIID` the `SUSPENDER` / `RETOMAR` buttons have no canvas (x 668, not on `TELA_DOCUMENTOS`), so ADM may not have seen them in Forms. ARCHITECTURE §10.1 keeps them as ADM actions. | Shows them for ADM. | Step 7.5 checks running Forms |
| OP-4 | D-08 gives USER "select all", but USER has no batch action that consumes a selection. | Keeps the selection column for USER (D-08 as written). | Step 7.5: drop it if still unused |
| OP-5 | shadcn defaults use `outline-ring/50` and `ring-ring/50`. A 50 % alpha ring drops below 3:1. | Copy-edit rule in §1.2: replace them with full `ring`. | Scaffold step |

---

## 1. Design tokens

### 1.1 Summary (source of truth: `app/design-tokens.json`)

**Type** (weights: 400 regular, 600 semibold only; `font-variant-numeric: tabular-nums` on `html`)

| Tailwind | Size / line | Use |
|---|---|---|
| `text-xs` | 12 / 16 px | Counters, badges, breadcrumb, row error line, help text |
| `text-sm` | 13 / 20 px | Grid cells and headers, buttons, menus, filter inputs |
| `text-base` | 14 / 20 px | Body, form fields in dialogs and panels, toasts |
| `text-lg` | 18 / 24 px | Page title (h1), dialog title |
| `font-mono` | same sizes | Code columns: Spool Id, Modelo, CHAVE, ROWID-like ids, paths, RESULTADO |

**Spacing** (multiples of 4): 4, 8, 12, 16, 24, 32, 48 (Tailwind `--spacing: 0.25rem`, so `p-1`=4 … `p-12`=48). Exceptions: badge padding-x 6 px, current-row bar 2 px, 1 px borders.

**Radius:** `--radius: 0.25rem` → `rounded-sm` 2.4 px (badges), `rounded-md` 3.2 px, `rounded-lg` 4 px (buttons, inputs, dialogs, popovers). Full only for the stepper markers.

**Elevation:** e0 none (grids, panels, sticky header at rest) · e1 sticky header while scrolled · e2 popover, dropdown, context menu, tooltip · e3 dialog, sheet. Dark theme uses black shadows at 0.40/0.50/0.60 (see JSON).

**Density:** `--datablock-row-height` 28 px (compact, default) / 36 px (`html[data-densidade="confortavel"]`). Header 32, filter row 32 (inputs 28), toolbar 40, footer 32, gutter 24, select column 32.

**Z-index:** sticky header 10 · dirty bar 20 · top bar and sidebar 30 · popover 50 · overlay 60 · dialog 61 · toast 70 · tooltip 80.

**Motion:** fast 100 ms (hover), base 160 ms (popover, dialog), slow 240 ms (sheet); easing `cubic-bezier(0.2,0,0,1)`. `prefers-reduced-motion: reduce` → 0.01 ms everywhere; skeleton shimmer off; the spinner keeps rotating at 1.5 s.

**Colour roles (60/30/10)**

| Role | Light | Dark | Where |
|---|---|---|---|
| Dominant 60 % | `#FFFFFF` background | `#111417` | Content area, grid body, dialogs |
| Secondary 30 % | `#F3F5F7` sidebar, `#EEF1F4` grid header | `#171B20`, `#1B2025` | Sidebar, top bar, grid header, tabs strip |
| Accent 10 % | `#13655F` primary | `#5FB0A8` | Reserved for: primary button, focus ring (`#1F7A73` / `#6FC2BA`), current-row bar, selected-row tint, ticked checkbox and radio, active sort arrow, active nav item, active preset, active tab underline, links. Nothing else. |
| Destructive | `#B42318` | `#B8352B` (text `#F28B82`) | Anular, Cancelar (documents), Retirar Permissão, Anular Impressora, Apagar, Retirar todos confirm buttons, and error text |

**Status palette** (StatusBadge and row tones; §6.3 maps values to tones)

| Tone | Light fg / bg | Dark fg / bg | Meaning |
|---|---|---|---|
| pending | `#7A4A00` / `#FFF1CC` | `#F5C66A` / `#3A2A06` | Waiting or enqueued |
| running | `#5B32B4` / `#F0EAFD` | `#C4B1FF` / `#2A1F4A` | Being executed or printed |
| success | `#1E6B34` / `#E3F2E7` | `#86D19C` / `#0F2E1A` | Done |
| danger | `#912018` / `#FDE7E5` | `#F6A39B` / `#3A1614` | ERRO |
| neutral | `#39414B` / `#E6E9ED` | `#C9CFD6` / `#262C33` | Cancelled, suspended, unknown |
| offline | `#1D4ED8` / `#E6EDFD` | `#8FB1FF` / `#172449` | `DISPONIBILIDADE = OFF` |
| anulado | `#8B1A1A` / `#F8E3E3` | `#F0A3A3` / `#3A1616` | `DISPONIBILIDADE = ANU` or `ATRIBUTO9 = 'A'` |

### 1.2 CSS: `app/apps/web/src/styles/theme.css`

Imported once in `main.tsx` after the font imports. After every `npx shadcn add`: replace `outline-ring/50` → `outline-ring`, `ring-ring/50` → `ring-ring`, `bg-black/50` → `bg-overlay` (OP-5).

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme {
  --font-sans: "IBM Plex Sans Variable", "IBM Plex Sans", system-ui, "Segoe UI", sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, Consolas, monospace;
  --text-*: initial;
  --text-xs: 0.75rem;    --text-xs--line-height: 1rem;
  --text-sm: 0.8125rem;  --text-sm--line-height: 1.25rem;
  --text-base: 0.875rem; --text-base--line-height: 1.25rem;
  --text-lg: 1.125rem;   --text-lg--line-height: 1.5rem;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-danger-text: var(--danger-text);
  --color-field-error: var(--field-error);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-overlay: var(--overlay);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-surface-header: var(--surface-header);
  --color-row-hover: var(--row-hover);
  --color-row-current: var(--row-current);
  --color-row-current-bar: var(--row-current-bar);
  --color-row-selected: var(--row-selected);
  --color-row-dirty-cell: var(--row-dirty-cell);
  --color-row-deleted: var(--row-deleted);
  --color-row-error: var(--row-error);
  --color-row-new-bar: var(--row-new-bar);
  --color-icon-pending: var(--icon-pending);
  --color-icon-danger: var(--icon-danger);
  --color-text-offline: var(--text-offline);
  --color-text-anulado: var(--text-anulado);
  --color-status-pending-bg: var(--status-pending-bg);   --color-status-pending-fg: var(--status-pending-fg);
  --color-status-running-bg: var(--status-running-bg);   --color-status-running-fg: var(--status-running-fg);
  --color-status-success-bg: var(--status-success-bg);   --color-status-success-fg: var(--status-success-fg);
  --color-status-danger-bg: var(--status-danger-bg);     --color-status-danger-fg: var(--status-danger-fg);
  --color-status-neutral-bg: var(--status-neutral-bg);   --color-status-neutral-fg: var(--status-neutral-fg);
  --color-status-offline-bg: var(--status-offline-bg);   --color-status-offline-fg: var(--status-offline-fg);
  --color-status-anulado-bg: var(--status-anulado-bg);   --color-status-anulado-fg: var(--status-anulado-fg);
  --color-env-test-bg: var(--env-test-bg);   --color-env-test-fg: var(--env-test-fg);
  --color-env-prod-bg: var(--env-prod-bg);   --color-env-prod-fg: var(--env-prod-fg);   --color-env-prod-border: var(--env-prod-border);
  --color-dirty-bar-bg: var(--dirty-bar-bg); --color-dirty-bar-fg: var(--dirty-bar-fg);
  --color-tooltip-bg: var(--tooltip-bg);     --color-tooltip-fg: var(--tooltip-fg);
  --shadow-e1: var(--shadow-e1);
  --shadow-e2: var(--shadow-e2);
  --shadow-e3: var(--shadow-e3);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
}

:root {
  color-scheme: light;
  --radius: 0.25rem;
  --datablock-row-height: 28px;
  --background: #FFFFFF;          --foreground: #171B20;
  --card: #FFFFFF;                --card-foreground: #171B20;
  --popover: #FFFFFF;             --popover-foreground: #171B20;
  --primary: #13655F;             --primary-hover: #0E514C;        --primary-foreground: #FFFFFF;
  --secondary: #EEF1F4;           --secondary-foreground: #171B20;
  --muted: #F3F5F7;               --muted-foreground: #5C6570;
  --accent: #EEF1F4;              --accent-foreground: #171B20;
  --destructive: #B42318;         --destructive-foreground: #FFFFFF;
  --danger-text: #B42318;         --field-error: #912018;
  --border: #D5DAE0;              --input: #7D8793;                --ring: #1F7A73;
  --overlay: rgba(17, 20, 23, 0.48);
  --sidebar: #F3F5F7;             --sidebar-foreground: #171B20;
  --sidebar-primary: #13655F;     --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #DDEDEA;      --sidebar-accent-foreground: #0E514C;
  --sidebar-border: #D5DAE0;      --sidebar-ring: #1F7A73;
  --surface-header: #EEF1F4;
  --row-hover: #F7F8FA;           --row-current: #F1F3F5;          --row-current-bar: #13655F;
  --row-selected: #E6F2F0;        --row-dirty-cell: #FFF8E1;
  --row-deleted: #FDECEC;         --row-error: #FDECEC;            --row-new-bar: #2E8540;
  --icon-pending: #B87700;        --icon-danger: #B42318;
  --text-offline: #1D4ED8;        --text-anulado: #8B1A1A;
  --status-pending-bg: #FFF1CC;   --status-pending-fg: #7A4A00;
  --status-running-bg: #F0EAFD;   --status-running-fg: #5B32B4;
  --status-success-bg: #E3F2E7;   --status-success-fg: #1E6B34;
  --status-danger-bg: #FDE7E5;    --status-danger-fg: #912018;
  --status-neutral-bg: #E6E9ED;   --status-neutral-fg: #39414B;
  --status-offline-bg: #E6EDFD;   --status-offline-fg: #1D4ED8;
  --status-anulado-bg: #F8E3E3;   --status-anulado-fg: #8B1A1A;
  --env-test-bg: #F2B53A;         --env-test-fg: #2B1D00;
  --env-prod-bg: #EEF1F4;         --env-prod-fg: #171B20;          --env-prod-border: #7D8793;
  --dirty-bar-bg: #FFF1CC;        --dirty-bar-fg: #171B20;
  --tooltip-bg: #262C33;          --tooltip-fg: #FFFFFF;
  --shadow-e1: 0 1px 2px rgba(17, 20, 23, 0.08);
  --shadow-e2: 0 4px 12px rgba(17, 20, 23, 0.14);
  --shadow-e3: 0 16px 40px rgba(17, 20, 23, 0.24);
}

.dark {
  color-scheme: dark;
  --background: #111417;          --foreground: #E6E9ED;
  --card: #1B2025;                --card-foreground: #E6E9ED;
  --popover: #1B2025;             --popover-foreground: #E6E9ED;
  --primary: #5FB0A8;             --primary-hover: #7CC3BC;        --primary-foreground: #08201E;
  --secondary: #262C33;           --secondary-foreground: #E6E9ED;
  --muted: #1B2025;               --muted-foreground: #9AA3AE;
  --accent: #262C33;              --accent-foreground: #E6E9ED;
  --destructive: #B8352B;         --destructive-foreground: #FFFFFF;
  --danger-text: #F28B82;         --field-error: #F6A39B;
  --border: #2C333B;              --input: #6B7581;                --ring: #6FC2BA;
  --overlay: rgba(0, 0, 0, 0.64);
  --sidebar: #171B20;             --sidebar-foreground: #E6E9ED;
  --sidebar-primary: #5FB0A8;     --sidebar-primary-foreground: #08201E;
  --sidebar-accent: #1D3532;      --sidebar-accent-foreground: #8FD3CC;
  --sidebar-border: #2C333B;      --sidebar-ring: #6FC2BA;
  --surface-header: #1B2025;
  --row-hover: #1B2025;           --row-current: #1B2025;          --row-current-bar: #5FB0A8;
  --row-selected: #16302D;        --row-dirty-cell: #2A2206;
  --row-deleted: #2A1413;         --row-error: #2A1413;            --row-new-bar: #6CC285;
  --icon-pending: #F5C66A;        --icon-danger: #F28B82;
  --text-offline: #8FB1FF;        --text-anulado: #F0A3A3;
  --status-pending-bg: #3A2A06;   --status-pending-fg: #F5C66A;
  --status-running-bg: #2A1F4A;   --status-running-fg: #C4B1FF;
  --status-success-bg: #0F2E1A;   --status-success-fg: #86D19C;
  --status-danger-bg: #3A1614;    --status-danger-fg: #F6A39B;
  --status-neutral-bg: #262C33;   --status-neutral-fg: #C9CFD6;
  --status-offline-bg: #172449;   --status-offline-fg: #8FB1FF;
  --status-anulado-bg: #3A1616;   --status-anulado-fg: #F0A3A3;
  --env-test-bg: #F2B53A;         --env-test-fg: #2B1D00;
  --env-prod-bg: #262C33;         --env-prod-fg: #E6E9ED;          --env-prod-border: #6B7581;
  --dirty-bar-bg: #2A2206;        --dirty-bar-fg: #F5C66A;
  --tooltip-bg: #E6E9ED;          --tooltip-fg: #171B20;
  --shadow-e1: 0 1px 2px rgba(0, 0, 0, 0.40);
  --shadow-e2: 0 4px 12px rgba(0, 0, 0, 0.50);
  --shadow-e3: 0 16px 40px rgba(0, 0, 0, 0.60);
}

html[data-densidade="confortavel"] { --datablock-row-height: 36px; }

@layer base {
  * { @apply border-border; }
  html { font-family: var(--font-sans); font-variant-numeric: tabular-nums; }
  body { @apply bg-background text-foreground text-base antialiased; }
  :focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
  [role="gridcell"]:focus, [role="columnheader"]:focus { outline: 2px solid var(--ring); outline-offset: -2px; }
}

@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important; scroll-behavior: auto !important;
  }
  .animate-spin { animation-duration: 1.5s !important; animation-iteration-count: infinite !important; }
}
```

**shadcn variable mapping.** The shadcn names (`--background` … `--sidebar-ring`) keep shadcn semantics: `accent` is the hover surface, not the brand accent. The brand accent is `--primary`. The app adds these names: `primary-hover`, `danger-text`, `field-error`, `overlay`, `surface-header`, `row-*`, `icon-*`, `text-offline`, `text-anulado`, `status-*`, `env-*`, `dirty-bar-*`, `tooltip-*`, `shadow-e1..e3`. Components use Tailwind classes built from these names (`bg-row-selected`, `text-status-danger-fg`), never hex values or Tailwind palette classes.

### 1.3 Theme and density switch

- `app/apps/web/index.html`: `<html lang="pt-PT">`, and in `<head>` before the CSS: `<script src="./theme-init.js"></script>`.
- `app/apps/web/public/theme-init.js`:
  ```js
  (function(){try{var d=document.documentElement;
  if(localStorage.getItem('gestsiid.tema')==='escuro')d.classList.add('dark');
  if(localStorage.getItem('gestsiid.densidade')==='confortavel')d.dataset.densidade='confortavel';}catch(e){}})();
  ```
- The switches live in the user menu (§2.1): `Tema escuro` and `Densidade confortável`. Toggling sets or removes the class or data attribute and writes `localStorage`. There is no "system" option (default light, per the brief).

### 1.4 Contrast ratios (WCAG 2.2 AA; computed with the WCAG relative-luminance formula)

Text needs ≥ 4.5; UI boundaries and focus need ≥ 3. **All pairs pass.**

| Pair | Light fg / bg | Ratio | Dark fg / bg | Ratio |
|---|---|---|---|---|
| Body text on background | `#171B20`/`#FFFFFF` | 17.30 | `#E6E9ED`/`#111417` | 15.18 |
| Text on sidebar | `#171B20`/`#F3F5F7` | 15.83 | `#E6E9ED`/`#171B20` | 14.22 |
| Text on card/popover | `#171B20`/`#FFFFFF` | 17.30 | `#E6E9ED`/`#1B2025` | 13.47 |
| Header text on grid header | `#171B20`/`#EEF1F4` | 15.26 | `#E6E9ED`/`#1B2025` | 13.47 |
| Text on secondary/accent (hover menus) | `#171B20`/`#EEF1F4` | 15.26 | `#E6E9ED`/`#262C33` | 11.57 |
| Muted text on background | `#5C6570`/`#FFFFFF` | 5.91 | `#9AA3AE`/`#111417` | 7.24 |
| Muted text on sidebar | `#5C6570`/`#F3F5F7` | 5.41 | `#9AA3AE`/`#171B20` | 6.78 |
| Muted text on grid header | `#5C6570`/`#EEF1F4` | 5.22 | `#9AA3AE`/`#1B2025` | 6.43 |
| Muted text on selected row | `#5C6570`/`#E6F2F0` | 5.16 | `#9AA3AE`/`#16302D` | 5.50 |
| Text on current row | `#171B20`/`#F1F3F5` | 15.55 | `#E6E9ED`/`#1B2025` | 13.47 |
| Text on hover row | `#171B20`/`#F7F8FA` | 16.28 | `#E6E9ED`/`#1B2025` | 13.47 |
| Text on selected row | `#171B20`/`#E6F2F0` | 15.09 | `#E6E9ED`/`#16302D` | 11.54 |
| Text on dirty cell | `#171B20`/`#FFF8E1` | 16.28 | `#E6E9ED`/`#2A2206` | 12.97 |
| Text on error row | `#171B20`/`#FDECEC` | 15.14 | `#E6E9ED`/`#2A1413` | 14.28 |
| Deleted row text (muted) | `#5C6570`/`#FDECEC` | 5.18 | `#9AA3AE`/`#2A1413` | 6.81 |
| Primary button label | `#FFFFFF`/`#13655F` | 6.88 | `#08201E`/`#5FB0A8` | 6.69 |
| Primary button hover | `#FFFFFF`/`#0E514C` | 9.13 | `#08201E`/`#7CC3BC` | 8.41 |
| Primary text / link on background | `#13655F`/`#FFFFFF` | 6.88 | `#6FC2BA`/`#111417` | 8.89 |
| Primary text on selected row | `#13655F`/`#E6F2F0` | 6.00 | `#6FC2BA`/`#16302D` | 6.76 |
| Primary text on grid header | `#13655F`/`#EEF1F4` | 6.06 | `#6FC2BA`/`#1B2025` | 7.89 |
| Active nav item | `#0E514C`/`#DDEDEA` | 7.55 | `#8FD3CC`/`#1D3532` | 7.69 |
| Destructive button label | `#FFFFFF`/`#B42318` | 6.57 | `#FFFFFF`/`#B8352B` | 5.86 |
| Danger text on background | `#B42318`/`#FFFFFF` | 6.57 | `#F28B82`/`#111417` | 7.74 |
| Field error on danger surface | `#912018`/`#FDECEC` | 7.59 | `#F6A39B`/`#3A1614` | 8.15 |
| OFFLINE row text on background | `#1D4ED8`/`#FFFFFF` | 6.70 | `#8FB1FF`/`#111417` | 8.71 |
| OFFLINE on selected / current row | `#1D4ED8`/`#E6F2F0` · `#F1F3F5` | 5.85 · 6.02 | `#8FB1FF`/`#16302D` · `#1B2025` | 6.62 · 7.74 |
| ANULADO row text on background | `#8B1A1A`/`#FFFFFF` | 9.29 | `#F0A3A3`/`#111417` | 9.22 |
| ANULADO on selected / current row | `#8B1A1A`/`#E6F2F0` · `#F1F3F5` | 8.11 · 8.35 | `#F0A3A3`/`#16302D` · `#1B2025` | 7.01 · 8.18 |
| Badge pending | `#7A4A00`/`#FFF1CC` | 6.66 | `#F5C66A`/`#3A2A06` | 8.70 |
| Badge running | `#5B32B4`/`#F0EAFD` | 6.99 | `#C4B1FF`/`#2A1F4A` | 7.95 |
| Badge success | `#1E6B34`/`#E3F2E7` | 5.65 | `#86D19C`/`#0F2E1A` | 8.14 |
| Badge danger | `#912018`/`#FDE7E5` | 7.32 | `#F6A39B`/`#3A1614` | 8.15 |
| Badge neutral | `#39414B`/`#E6E9ED` | 8.49 | `#C9CFD6`/`#262C33` | 8.98 |
| Badge offline | `#1D4ED8`/`#E6EDFD` | 5.71 | `#8FB1FF`/`#172449` | 7.15 |
| Badge anulado | `#8B1A1A`/`#F8E3E3` | 7.56 | `#F0A3A3`/`#3A1616` | 8.02 |
| Environment badge, test | `#2B1D00`/`#F2B53A` | 8.95 | same | 8.95 |
| Environment badge, production | `#171B20`/`#EEF1F4` | 15.26 | `#E6E9ED`/`#262C33` | 11.57 |
| Dirty bar text | `#171B20`/`#FFF1CC` | 15.41 | `#F5C66A`/`#2A2206` | 9.90 |
| Tooltip | `#FFFFFF`/`#262C33` | 14.09 | `#171B20`/`#E6E9ED` | 14.20 |
| **UI (≥ 3)** Focus ring on background | `#1F7A73`/`#FFFFFF` | 5.13 | `#6FC2BA`/`#111417` | 8.89 |
| Focus ring on selected row | `#1F7A73`/`#E6F2F0` | 4.48 | `#6FC2BA`/`#16302D` | 6.76 |
| Input border on background | `#7D8793`/`#FFFFFF` | 3.65 | `#6B7581`/`#111417` | 3.95 |
| Input border on sidebar / header / card | `#7D8793`/`#F3F5F7` · `#EEF1F4` | 3.34 · 3.22 | `#6B7581`/`#1B2025` | 3.51 |
| Input border on selected row (inline edit) | `#7D8793`/`#E6F2F0` | 3.18 | — | — |
| Ticked checkbox / radio | `#13655F`/`#FFFFFF` | 6.88 | `#5FB0A8`/`#111417` | 7.27 |
| Current-row bar | `#13655F`/`#F1F3F5` | 6.18 | `#5FB0A8`/`#1B2025` | 6.46 |
| Sort arrow on header | `#13655F`/`#EEF1F4` | 6.06 | `#6FC2BA`/`#1B2025` | 7.89 |
| Dirty gutter icon | `#B87700`/`#FFFFFF` | 3.70 | `#F5C66A`/`#111417` | 11.59 |
| Error gutter icon on error row | `#B42318`/`#FDECEC` | 5.76 | `#F28B82`/`#2A1413` | 7.28 |
| New-row bar | `#2E8540`/`#FFFFFF` | 4.62 | `#6CC285`/`#111417` | 8.53 |

`--border` (`#D5DAE0` / `#2C333B`) is decorative only (grid lines, panel dividers). Any boundary that identifies a control uses `--input`.

---

## 2. App shell

### 2.1 Layout (1440 px)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡] GestSIID  [GADOR_TESTES]                                                    MARIA SILVA (MSILVA) ▾   │ top bar 44
├──────────────────────┬────────────────────────────────────────────────────────────────────────────────────┤
│ Gestão             ▾ │ Gestão › Documentos                                               (breadcrumb 12) │
│  ▌Documentos         │ Documentos                                              [Procurar por parâmetros] │
│   Backups          ▸ │                                                                        [Actualizar] │ page header 40
│ Gador              ▸ │ ┌────────────────────────────────────────────────────────────────────────────────┐ │
│ Configuração       ▸ │ │ DataBlock …                                                                    │ │
│ Administração      ▸ │ │                                                                                │ │
│                      │ │                                                                                │ │
│                      │ └────────────────────────────────────────────────────────────────────────────────┘ │
│ 240 px, bg sidebar   │ content padding 16/12                                                             │
└──────────────────────┴────────────────────────────────────────────────────────────────────────────────────┘
```

| Part | Spec |
|---|---|
| Top bar | 44 px, `bg-sidebar`, bottom border. Left to right: collapse toggle (icon button `PanelLeft`, aria-label `Recolher menu`/`Expandir menu` NEW), wordmark `GestSIID` (14/600), EnvironmentBadge (§6.4). Right: user menu trigger `NOME (USERNAME)` 13/400 with the role on a second line 12/400 muted (`Administrador` / `Utilizador`, the ARCHITECTURE §9 role names). Menu items: `Tema escuro` (switch, NEW), `Densidade confortável` (switch, NEW), separator, `Sair` (NEW) → `POST /api/auth/logout` → clear query cache → `/login`. |
| Environment | `GET /api/health` on shell mount and on the login page; query key `['health']`, `staleTime: Infinity`, no retry. Uses `ambiente`. On 503 the badge still shows `ambiente` and a banner under the top bar shows `Base de dados indisponível. Tente mais tarde.` until the next successful API call. `document.title` = `<h1> · GestSIID · <ambiente>`. |
| Skip link | First focusable element: `Saltar para o conteúdo` (NEW), visible on focus, jumps to `<main id="conteudo">`. |
| Sidebar | `<nav aria-label="Menu">` (NEW). 240 px expanded. Groups are collapsible (`Collapsible`); the group holding the active route is forced open. Items are 32 px tall, 13 px text. The active item gets `bg-sidebar-accent`, `text-sidebar-accent-foreground`, weight 600, a 2 px left bar and `aria-current="page"`. Nested groups (Backups, Impressoras Associadas) are indented 12 px. `Alt+M` focuses the first menu item. |
| Collapse | 48 px icon rail. Group icons: Gestão `FileText`, Gador `Users`, Configuração `Settings2`, Administração `Wrench`. Clicking or pressing Enter on a rail icon opens a flyout (DropdownMenu) with the group tree. State is stored in `localStorage gestsiid.menu` (`recolhido`). Automatically collapsed below 1280 px (unless the user expanded it this session). Under 1024 px the sidebar becomes an off-canvas Sheet opened from the toggle. |
| Breadcrumb | 12 px, muted: `Grupo › Subgrupo › Item`. Groups are plain text; the item is `aria-current="page"`. Screens with a master key append it: `Configuração › Modelos › R3.D25`. |
| Page header | 40 px: `h1` 18/600 = the menu item label (for nested items: `Impressoras Associadas · Documento`), `tabIndex=-1`, focused after every route change. Page-level buttons on the right. |
| Main | `<main id="conteudo">` fills the remaining height. DataBlocks fill it; the page itself does not scroll when a DataBlock fills it. |

### 2.2 Menu tree per role (`MD_SIID` / `MD_SIID_USER` + D-06, D-08, D-11, D-15; routes from ARCHITECTURE §10)

Render rule: an item shows when `roles` includes the session role; a group shows only if at least one descendant shows. So **Auditoria never renders** (its only item Médias Execução is dropped, D-06) and **Gador shows only Equipa de Gestão (OD68)** (Gestores dropped, D-11).

| Group › item (label verbatim) | Form | Route | ADM | USER |
|---|---|---|---|---|
| Gestão › Documentos | FD_GESTAO_SIID / _USER | `/gestao/documentos` | ✓ | ✓ |
| Gestão › Backups › Novo | FD_NOVO_BACKUP | `/gestao/backups/novo` | ✓ | — |
| Gestão › Backups › Backups Online | FD_BACKUPS_ONLINE | `/gestao/backups/online` | ✓ | — |
| Gador › Equipa de Gestão (OD68) | FD_PERFIS_DEPARTAMENTO | `/gador/equipa-gestao` | ✓ | — |
| Configuração › Reports | FD_CONFIGURACAO_REPORTS | `/configuracao/reports` | ✓ | — |
| Configuração › Modelos | FD_CONFIGURACAO_MODELOS | `/configuracao/modelos` | ✓ | — |
| Configuração › Permissões | FD_PERMISSOES_SIID | `/configuracao/permissoes` | ✓ | — |
| Configuração › Impressoras | FD_IMPRESSORAS_SIID | `/configuracao/impressoras` | ✓ | — |
| Configuração › Impressoras Associadas › Documento | FD_GESTAO_IMPRESSORAS_DOC | `/configuracao/impressoras-associadas/documento` | ✓ | — |
| Configuração › Impressoras Associadas › Utilizador | FD_GESTAO_IMPRESSORAS_USR | `/configuracao/impressoras-associadas/utilizador` | ✓ | — |
| Configuração › Alterar password | FD_ALTERAR_PASSWORD | `/configuracao/alterar-password` | ✓ | — |
| Administração › Domínios | FD_DOMINIOS_SIID | `/administracao/dominios` | ✓ | — |
| Administração › Unidades Medida | FD_UNIDADES_MEDIDA | `/administracao/unidades-medida` | ✓ | — |
| Administração › Tipos Mídia | FD_TIPOS_MiDIA | `/administracao/tipos-midia` | ✓ | — |
| Administração › Utilizadores | FD_UTILIZADORES_SIID | `/administracao/utilizadores` | ✓ | — |
| Administração › Variáveis SIID | FD_VARIAVEIS_SIID | `/administracao/variaveis` | ✓ | — |
| ~~Gador › Gestores~~ | FD_GESTORES_SIID | none (D-11) | — | — |
| ~~Auditoria › Médias Execução~~ | report call | none (D-06) | — | — |

Result, ADM: Gestão (Documentos, Backups ▸ Novo / Backups Online), Gador (Equipa de Gestão (OD68)), Configuração (Reports, Modelos, Permissões, Impressoras, Impressoras Associadas ▸ Documento / Utilizador, Alterar password), Administração (Domínios, Unidades Medida, Tipos Mídia, Utilizadores, Variáveis SIID). USER: Gestão (Documentos).

`app/apps/web/src/menu.ts` (labels are read from `pt.menu`; they are shown literally here):

```ts
import type { Role } from '@gestsiid/shared';

export type MenuItem = { kind: 'item'; id: string; label: string; to: string; form: string; roles: readonly Role[] };
export type MenuGroup = { kind: 'group'; id: string; label: string; children: readonly MenuNode[] };
export type MenuNode = MenuItem | MenuGroup;

const ADM = ['ADM'] as const;
const TODOS = ['ADM', 'USER'] as const;

export const menu: readonly MenuNode[] = [
  { kind: 'group', id: 'gestao', label: 'Gestão', children: [
    { kind: 'item', id: 'documentos', label: 'Documentos', to: '/gestao/documentos', form: 'FD_GESTAO_SIID', roles: TODOS },
    { kind: 'group', id: 'backups', label: 'Backups', children: [
      { kind: 'item', id: 'backup-novo', label: 'Novo', to: '/gestao/backups/novo', form: 'FD_NOVO_BACKUP', roles: ADM },
      { kind: 'item', id: 'backups-online', label: 'Backups Online', to: '/gestao/backups/online', form: 'FD_BACKUPS_ONLINE', roles: ADM },
    ] },
  ] },
  { kind: 'group', id: 'gador', label: 'Gador', children: [
    { kind: 'item', id: 'equipa-gestao', label: 'Equipa de Gestão (OD68)', to: '/gador/equipa-gestao', form: 'FD_PERFIS_DEPARTAMENTO', roles: ADM },
  ] },
  { kind: 'group', id: 'configuracao', label: 'Configuração', children: [
    { kind: 'item', id: 'reports', label: 'Reports', to: '/configuracao/reports', form: 'FD_CONFIGURACAO_REPORTS', roles: ADM },
    { kind: 'item', id: 'modelos', label: 'Modelos', to: '/configuracao/modelos', form: 'FD_CONFIGURACAO_MODELOS', roles: ADM },
    { kind: 'item', id: 'permissoes', label: 'Permissões', to: '/configuracao/permissoes', form: 'FD_PERMISSOES_SIID', roles: ADM },
    { kind: 'item', id: 'impressoras', label: 'Impressoras', to: '/configuracao/impressoras', form: 'FD_IMPRESSORAS_SIID', roles: ADM },
    { kind: 'group', id: 'impressoras-associadas', label: 'Impressoras Associadas', children: [
      { kind: 'item', id: 'imp-documento', label: 'Documento', to: '/configuracao/impressoras-associadas/documento', form: 'FD_GESTAO_IMPRESSORAS_DOC', roles: ADM },
      { kind: 'item', id: 'imp-utilizador', label: 'Utilizador', to: '/configuracao/impressoras-associadas/utilizador', form: 'FD_GESTAO_IMPRESSORAS_USR', roles: ADM },
    ] },
    { kind: 'item', id: 'alterar-password', label: 'Alterar password', to: '/configuracao/alterar-password', form: 'FD_ALTERAR_PASSWORD', roles: ADM },
  ] },
  { kind: 'group', id: 'administracao', label: 'Administração', children: [
    { kind: 'item', id: 'dominios', label: 'Domínios', to: '/administracao/dominios', form: 'FD_DOMINIOS_SIID', roles: ADM },
    { kind: 'item', id: 'unidades-medida', label: 'Unidades Medida', to: '/administracao/unidades-medida', form: 'FD_UNIDADES_MEDIDA', roles: ADM },
    { kind: 'item', id: 'tipos-midia', label: 'Tipos Mídia', to: '/administracao/tipos-midia', form: 'FD_TIPOS_MiDIA', roles: ADM },
    { kind: 'item', id: 'utilizadores', label: 'Utilizadores', to: '/administracao/utilizadores', form: 'FD_UTILIZADORES_SIID', roles: ADM },
    { kind: 'item', id: 'variaveis', label: 'Variáveis SIID', to: '/administracao/variaveis', form: 'FD_VARIAVEIS_SIID', roles: ADM },
  ] },
  { kind: 'group', id: 'auditoria', label: 'Auditoria', children: [] }, // D-06: no items, never rendered
];

/** Removes items the role may not see, then groups left empty. */
export function menuFor(role: Role): MenuNode[] {
  const prune = (n: MenuNode): MenuNode | null => {
    if (n.kind === 'item') return n.roles.includes(role) ? n : null;
    const children = n.children.map(prune).filter((c): c is MenuNode => c !== null);
    return children.length ? { ...n, children } : null;
  };
  return menu.map(prune).filter((n): n is MenuNode => n !== null);
}
```

Each route's `beforeLoad` checks the same `roles` (it redirects to `/gestao/documentos` with toast `Não tem permissão para esta operação.`). The server decides access in any case.

### 2.3 Message channels (replacing SHOW_ALERT / MESSAGE)

| Forms mechanism | Web channel | Blocking | Buttons / behaviour |
|---|---|---|---|
| Alert with `Sim / Não` (style Caution): DESEJA_*, CONFIRMAR, CONFIRMAR_ANULACAO, CLONAR | `ConfirmDialog` (AlertDialog) | Yes | `Sim` (primary; destructive variant for anular/cancelar/retirar/apagar) and `Não`. Initial focus is on `Não` for destructive confirms and on `Sim` otherwise. Esc = `Não`. |
| Alert with `Sim / Não / Cancelar`: ASK_COMMIT (#46) | `AskCommitDialog` | Yes | `Sim` = save, then continue if every row saved · `Não` = discard, then continue · `Cancelar` = stay (initial focus, Esc). |
| One-button informational alert after a batch action, with a dynamic id list (OUT #9, #13, #19, #20, #22) | `ResultListDialog` | Yes | Title = the action label. Body: catalogue text, then a mono list of `spool_id`s (grouped by `motivo` when the API sends several reasons). `Copiar` (NEW) and `OK`. |
| Validation alert about one field (OBRIGATORIO, SEM_*, TIPO_MIDIA, #43–#45, #54–#56, #58) | Inline field error under the field (`text-xs text-field-error`), `aria-invalid`, and focus moves to the first invalid field | No | — |
| Validation alert about the whole form (#31, #32, #34, #35, #50, #51, #57) | Inline `Alert` (destructive) at the top of the dialog, panel or wizard step, `role="alert"` | No | Stays until the next submit |
| `MESSAGE()` status-line text (#10 per document, #26) | Toast (info) or inline empty state | No | — |
| Alert `OUT` (#5) | Not reproduced: the router guard sends unauthenticated users to `/login` | — | — |
| Row save failure in a grid | Row error state (§3.8) plus the dirty-bar message | No | — |
| Any other API error | Toast (error, persistent), or field errors when the body has `fields` | No | Close button; action `Recarregar` (NEW) for `CSRF` |

Toasts: `sonner` `<Toaster position="bottom-right" visibleToasts={3} closeButton containerAriaLabel="Notificações" />`. Success 4 s, info 6 s, error persistent (UI-26). An error toast's second line is `Ref.: <requestId>` (NEW, 12 px mono muted).

### 2.4 Catalogue texts to reproduce (`BUSINESS_RULES.md` §3, verbatim; key `pt.msg[<#>]`)

| # | Text (verbatim) | Screen / trigger | Channel | Buttons |
|---|---|---|---|---|
| 1 | `O 'Utilizador' é de preenchimento obrigatório.` | Login, empty Utilizador (client and 400) | Field error | — |
| 2 | `A 'Password' é de preenchimento obrigatório.` | Login, empty Password | Field error | — |
| 3 | `Utilizador e/ou password inválidos.` | Login, 401 `LOGIN_INVALIDO` | Inline alert above the button | — |
| 4 | `Erro` | Any 500 `ERRO` | Toast error, title | Close |
| 5 | `É obrigatório a aplicação ser 'aberta' a partir do formulário de Login.` | — | Not reproduced (router guard) | — |
| 6 | `As passwords não coincidem. Alteração não efectuada.` | Alterar password, 422 | Field error on `Confirmação` | — |
| 7 | `Deseja imprimir os documentos selecionados?` | Documentos: Reimprimir, 2ª Via, Cópia (ADM spelling) | ConfirmDialog | Sim / Não |
| 8 | `Imprimir documentos para a impressora associada` / `Outra impressora:` | Reimprimir / 2ª Via / Cópia dialog | Radio labels | — |
| 9 | `Não foram impressos os documentos com os seguintes spool_id, por se encontrarem anulados:` | Reimprimir / 2ª Via / Cópia result with `skipped` | ResultListDialog | Copiar / OK |
| 10 | `Para imprimir 2ª Via é necessário que o documento já tenha sido impresso.` | 2ª Via result, `skipped` with that `motivo` | ResultListDialog group heading | OK |
| 11 | `Para reenviar é necessário que o documento já tenha sido impresso.` | — (commented out in Forms) | Not reproduced | — |
| 12 | `Deseja regerar os documentos selecionados?` | Documentos: Regerar | ConfirmDialog | Sim / Não |
| 13 | `Não foram Regerados os documentos com os seguintes spool_id, por se encontrarem anulados:` | Regerar result | ResultListDialog | Copiar / OK |
| 14 | `Insira a password para regerar o(s) documento(s) seleccionado(s):` | Regerar, 428 | Password dialog label | Cancelar / OK |
| 15 | `A password inserida está errada.` | Regerar dialog 403 `PASSWORD_ERRADA`; Alterar password `Password actual` | Field error | — |
| 16 | `Deseja anular os documentos selecionados?` | Documentos: Anular | ConfirmDialog (destructive) | Sim / Não |
| 17 | `Deseja cancelar os documentos selecionados?` | Documentos: Cancelar (with the D-12 checkbox) | ConfirmDialog (destructive) | Sim / Não |
| 18 | `Deseja reenviar os documentos selecionados?` | Documentos: Reenviar, Reenviar Email | ConfirmDialog | Sim / Não |
| 19 | `Não foram Reenviados os documentos com os seguintes spool_id, por não serem documentos para o EDoc:` | Reenviar result | ResultListDialog | Copiar / OK |
| 20 | `Não foram Reenviados os documentos com os seguintes spool_id, por não serem documentos de Email:` | Reenviar Email result | ResultListDialog | Copiar / OK |
| 21 | `Deseja re-arquivar os documentos selecionados?` | Documentos: Re-Arquivar | ConfirmDialog | Sim / Não |
| 22 | `Não foram Re-Arquivados os documentos com os seguintes spool_id, por não serem documentos para ARQUIVO:` | Re-Arquivar result | ResultListDialog | Copiar / OK |
| 23 | `Suspender documentos seleccionados` / `Suspender todos os documentos em espera` | Suspender dialog | Radio labels | Cancelar / OK |
| 24 | `Retomar documentos seleccionados` / `Retomar todos os documentos suspensos` | Retomar dialog | Radio labels | Cancelar / OK |
| 25 | `Deseja cancelar este pedido?` | Documentos › Detalhes, row menu `Cancelar` | ConfirmDialog (destructive) | Sim / Não |
| 26 | `A consulta não obteve documentos.` | Documentos empty list; Procurar por parâmetros with no result | Grid empty state / inline alert in the dialog | — |
| 27 | `Procurar por parâmetros` / `Procurar apenas no modelo:` | Documentos search dialog | Dialog title / field label | Procurar |
| 28 | `Conversão de Parametros` | Conversion helper (clone and search) | Dialog title | OK |
| 29 | `Ficheiro não foi encontrado.<path>` | — (legacy, disabled) | Not reproduced; replaced by `Documento não disponível` + reason | — |
| 30 | `Não existem documentos seleccionados.` (D-26 text) | Every Documentos batch action with no selection (UI-15); Novo backup with no documents | Toast (warning/info) / inline alert in wizard | — |
| 31 | `Todos os campos são obrigatórios, excepto a data de fim.` | Permissões: Adicionar Permissão, 422 `OBRIGATORIO` | Form alert in dialog (and field errors) | — |
| 32 | `ERRO: Permissão já existe válida para o intervalo definido!!` | Adicionar Permissão, overlap | Form alert in dialog | — |
| 33 | `O Campo 'Data de Início' é de preenchimento obrigatório.` | Alterar Validade (permissão) | Field error on Início Validade | — |
| 34 | `ERRO: Tipo de permissão inválido!` | Alterar Validade, 422 | Form alert | — |
| 35 | `ERRO: O intervalo de datas sobrepõe-se a uma permissão já existente!` | Alterar Validade, overlap | Form alert | — |
| 36 | `Deseja anular a permissão do utilizador <user> para o documento <modelo>?` | Permissões: Retirar Permissão | ConfirmDialog (destructive) | Sim / Não |
| 37 | `Já existe um modelo com esta referência` | Clonar Modelo, 422 `MODELO_EXISTENTE` | Field error on Modelo | — |
| 38 | `Esta operação é irreversível.` + `Quer criar um novo modelo à semelhança do existente?` | Clonar Modelo, before POST | ConfirmDialog (title `Clonar`, 2 paragraphs) | Sim / Não |
| 39 | `Esta operação é irreversível.` + `Quer criar uma nova alinea à semelhança da existente?` | Secções: Clonar | ConfirmDialog (title `Clonar`) | Sim / Não |
| 40 | `File stored in the database` | — (English WebUtil) | Replaced by toast `Imagem guardada.` (NEW) | — |
| 41 | `Error when transfering <file>` | — (WebUtil) | Replaced by field errors 413 `O ficheiro excede o tamanho máximo permitido.` / 415 `Formato de imagem não suportado (JPEG, PNG, GIF ou BMP).` | — |
| 42 | `Impossível apagar registo mestre se existirem registos de detalhe correspondentes.` | Modelos (secção), Domínios, Reports delete, 409 `ORA_02292` | Row error (grid) or toast (immediate delete) | — |
| 43 | `A data de inicio é superior à data de fim.` | Modelos parâmetros por omissão, Utilizadores (client + 422) | Field error on the end date | — |
| 44 | `A data de inicio econtra-se num intervalo já definido.` | Parâmetros por omissão / Histórico | Field error on start date | — |
| 45 | `A data de fim econtra-se num intervalo já definido.` | same | Field error on end date | — |
| 46 | `Deseja gravar as alterações efectuadas?` | Any dirty DataBlock before navigation, re-query, master change | AskCommitDialog | Sim / Não / Cancelar |
| 47 | `(Origem do documento é o canto superior esquerdo e medida em cm)` | Código Barras dialog | Help text under Posição X/Y | — |
| 48 | `O campo 'Nome' é de preenchimento obrigatório.` | — (Nome is generated server-side) | Not reproduced | — |
| 49 | `O campo 'Tipo Mídia' é de preenchimento Obrigatorio.` | Novo backup step 2, client + 422 | Field error on Tipos Mídia | — |
| 50 | `O tamanho do Mídia não suporta todos os documentos que seleccionou.` | Novo backup step 2, client preview + 422 | Inline form alert | — |
| 51 | `As datas de início e de fim que introduziu são incompatíveis com outra configuração já introduzida.` + `Por favor, altere as configurações de modo a eliminar a incompatibilidade.` | Impressoras Associadas: nova / alterar validade, 422 `DATAS_INCOMPAT` | Form alert (2 lines) | — |
| 52 | `Deseja anular a impressora '<impressora>' para o documento <modelo>?` | Impressoras Associadas › Documento: Anular Impressora | ConfirmDialog (destructive) | Sim / Não |
| 53 | `Deseja anular a impressora '<impressora>' do utilizador <cdemplea> para o documento <modelo>?` | Impressoras Associadas › Utilizador: Anular Impressora | ConfirmDialog (destructive) | Sim / Não |
| 54 | `O 1º parâmetro é obrigatório ser '_USER'.` | Reports, row 1 | Row error / field error on Nome do Parâmetro | — |
| 55 | `O 2º parâmetro é obrigatório ser 'P_USUARIO'.` | Reports, row 2 | same | — |
| 56 | `O 3º parâmetro é obrigatório ser 'P_DATAACTUAL'.` | Reports, row 3 | same | — |
| 57 | `O número de parâmetros inseridos tem que ser igual ao número de parâmetros na informação do relatório.` | Reports Guardar, 422 `N_PARAM_ERRADO` | Form alert + field error on N.º Parâmetros | — |
| 58 | `Este tipo de variável já está associado.` | Variáveis SIID, 422 | Row error on Tipo | — |
| 59 | `WHEN-VALIDATE-ITEM trigger failed on field - <field>` | — (Forms generated) | Replaced by field error `Campo obrigatório não preenchido.` (ARCHITECTURE §8) | — |
| 60 | Audit texts (`DOCUMENTO REGERADO POR …` etc.) | DB rows only | Shown as data in Documentos › Log | — |

### 2.5 HTTP error handling in `api/client.ts`

| Status / code | UI |
|---|---|
| Network failure (fetch rejects) | Toast error `Sem ligação ao servidor. Verifique a rede e tente novamente.` (NEW). DataBlock body error state with `Tentar novamente` (NEW). |
| 400 `VALIDACAO` with `fields` | Field errors in the open form, dialog or row; no toast. Without `fields`: toast. |
| 400 `ORA_01400`, `ORA_12899` | Row error or form alert with `message`. |
| 401 `SESSAO_EXPIRADA` | If a DataBlock or form is dirty: `SessionExpiredDialog` (modal, not dismissible) with the message and the login fields `Utilizador` / `Password` and button `Entrar`. On success, refresh `csrf` from `/api/auth/me`, keep the dirty state and close; the user presses Guardar again. Otherwise: clear the query cache and go to `/login?redirect=<path+search>&motivo=sessao`; the login page shows an info alert with the message. |
| 401 `LOGIN_INVALIDO` | Login only: inline alert #3. |
| 403 `SEM_PERMISSAO` | Toast error. |
| 403 `CSRF` | Toast error with action `Recarregar` → `location.reload()`. |
| 403 `PASSWORD_ERRADA` | Field error #15 in the dialog that sent it. |
| 404 `NAO_ENCONTRADO` | Toast; invalidate the active list query. |
| 404/502 `DOCUMENTO_NAO_DISPONIVEL` | Toast error with the `message` (includes the Offline/Anulado reason). |
| 409 `REGISTO_ALTERADO` / `REGISTO_BLOQUEADO` | DataBlock: row conflict state (§3.8). Named action: toast error. |
| 409 `ORA_00001`, `ORA_02292` | Row error in a DataBlock; toast for immediate actions. |
| 413 / 415 | Field error on the file input. |
| 422 (any code) | `fields` → field errors; otherwise form alert (dialog/panel/wizard), row error (DataBlock) or toast (no form). |
| 428 `PASSWORD_REGERACAO_NECESSARIA` | Open the Regerar password dialog; repeat the same request with `password`. |
| 500 `ERRO` | Toast error `Erro` + `Ref.:`. |
| 503 `BD_INDISPONIVEL` | Toast error + shell banner (§2.1) until a later 2xx. |
| 504 `TEMPO_ESGOTADO` | Toast error with the message. Batch actions: the list is invalidated, because some documents may already be done. |

Batch `200 { ok, skipped }`: `skipped.length === 0` → success toast `<Acção>: <n> documento(s) processado(s).` (NEW). Otherwise → ResultListDialog with the matching catalogue text. In both cases clear the selection and invalidate the list and open detail tabs.

### 2.6 Login (see §4.1) and route guard

`_app.tsx` `beforeLoad`: `GET /api/auth/me` (query key `['me']`, `staleTime: Infinity`); 401 → `/login?redirect=`. The login page redirects to `redirect` (same origin, path only) or `/gestao/documentos`.

### 2.7 Page conventions

- Every screen is `routes/_app/<menu>/<screen>.tsx`. It renders `PageHeader` (h1 + page actions) and one layout: a single DataBlock, master-detail, tabs, or a wizard.
- Page-level action buttons are 32 px. Grid toolbars use 28 px.
- Help text under a screen header (for example the D-22 printer order on Impressoras Associadas) is at most one line, 12 px muted, with a `Info` icon.

### 2.8 New UI strings (`packages/shared/src/pt.ts`, all NEW)

| Key | Text |
|---|---|
| `shell.saltarConteudo` | `Saltar para o conteúdo` |
| `shell.menu` | `Menu` |
| `shell.recolherMenu` / `shell.expandirMenu` | `Recolher menu` / `Expandir menu` |
| `shell.temaEscuro` / `shell.densidade` / `shell.sair` | `Tema escuro` / `Densidade confortável` / `Sair` |
| `shell.notificacoes` | `Notificações` |
| `shell.roles` | `{ ADM: 'Administrador', USER: 'Utilizador' }` |
| `login.entrar` / `login.capsLock` | `Entrar` / `Caps Lock activo.` |
| `erro.semLigacao` | `Sem ligação ao servidor. Verifique a rede e tente novamente.` |
| `erro.ref(id)` / `erro.recarregar` / `erro.tentarNovamente` | `Ref.: ${id}` / `Recarregar` / `Tentar novamente` |
| `db.registo(i, total, capped)` | `Registo ${i} de ${total}` · capped: `Registo ${i} de mais de 10 000` |
| `db.registos(total, capped)` | `0 registos` · `1 registo` · `${total} registos` · capped: `Mais de 10 000 registos` |
| `db.seleccionados(n)` | `${n} seleccionado(s)` |
| `db.todosSeleccionados(total, capped)` | `Todos os ${total} registos da consulta estão seleccionados.` · capped: `Todos os registos da consulta estão seleccionados (mais de 10 000).` |
| `db.seleccionarTodos` / `db.seleccionarRegisto` / `db.limparSeleccao` | `Seleccionar todos` / `Seleccionar registo` / `Limpar selecção` |
| `db.maxSeleccao` | `Máximo de 1000 registos seleccionados. Use «Seleccionar todos» para a consulta completa.` |
| `db.limparFiltros` / `db.filtrosPendentes` | `Limpar filtros` / `Filtros alterados. Prima Enter para consultar.` |
| `db.ajudaFiltros` (title + 4 lines) | `Ajuda dos filtros` · `Texto: valor exacto; use % (vários caracteres) e _ (um carácter).` · `Número e código: valor exacto.` · `Data: DD-MM-AAAA, ou intervalo DD-MM-AAAA..DD-MM-AAAA (um dos lados pode ficar vazio).` · `IS NULL / IS NOT NULL: registos sem valor / com valor.` |
| `db.numeroInvalido` / `db.dataInvalida` | `Valor numérico inválido.` / `Data inválida. Use DD-MM-AAAA.` |
| `db.semRegistos` / `db.consultaSemRegistos` / `db.seleccioneRegisto` | `Não existem registos.` / `A consulta não obteve registos.` / `Seleccione um registo.` |
| `db.pagina` / `db.de(n, capped)` / `db.porPagina` | `Página` / `de ${n}` · capped `de ${n}+` / `Por página` |
| `db.primeira` / `db.anterior` / `db.seguinte` / `db.ultima` | `Primeira página` / `Página anterior` / `Página seguinte` / `Última página` |
| `db.alteracoes({ novos, alterados, apagados })` | e.g. `2 novos · 1 alterado · 1 apagado` (zero parts omitted) |
| `db.erroNoRegisto(n, msg)` | `Erro no registo ${n}: ${msg}` |
| `db.estado` | `{ alterado: 'Alterado', apagado: 'Apagado', aGuardar: 'A guardar', erro: 'Erro', conflito: 'Bloqueado' }` (`Novo` is legacy) |
| `db.ordenarAsc` / `db.ordenarDesc` / `db.removerOrdenacao` | `Ordenar ascendente` / `Ordenar descendente` / `Remover ordenação` |
| `db.maisAccoes` / `db.guardado` / `db.guardeMestre` | `Mais acções` / `Guardado.` / `Guarde o registo principal antes de adicionar detalhes.` |
| `db.naoExecutado` | `Não executado` (screen-reader text for a null ESTADO) |
| `lov.abrir` / `lov.maisResultados` | `Abrir lista` / `Mais de 500 resultados. Refine a pesquisa.` |
| `dlg.copiar` / `dlg.fechar` | `Copiar` / `Fechar` |
| `wiz.passo(n, total)` / `wiz.passos` | `Passo ${n} de ${total}` / `Passos` |
| `datas.intervalo` / `datas.de` / `datas.ate` / `datas.aplicar` | `Intervalo de datas` / `De` / `Até` / `Aplicar` |
| `db.apagarConfirm(chave)` | `Apagar o registo ${chave}?` |
| `doc.anexos` / `doc.grupo(id)` | `Anexos` / `Grupo do documento ${id}` |
| `doc.accaoConcluida(accao, n)` | `${accao}: ${n} documento(s) processado(s).` |
| `doc.suspenderTodos(n)` / `doc.retomarTodos(n)` | `Vão ser suspensos ${n} pedidos em espera. Continuar?` / `Vão ser retomados ${n} pedidos suspensos. Continuar?` |
| `doc.clonado(id)` | `Documento clonado. Novo Spool Id: ${id}.` |
| `perm.adicionarSeleccionados` / `perm.adicionarTodos` / `perm.retirarSeleccionados` / `perm.retirarTodos` | `Adicionar seleccionados` / `Adicionar todos` / `Retirar seleccionados` / `Retirar todos` |
| `perm.retirarTodosConfirm(n)` | `Retirar as ${n} permissões?` |
| `bkp.geradoAoCriar` | `Gerado ao criar o backup.` |
| `bkp.confirmar(mes, n, tamanho)` | `Criar o backup de ${mes} com ${n} documentos (${tamanho})?` |
| `bkp.criado(nome)` / `bkp.actualizados` | `Backup ${nome} criado.` / `Backups actualizados.` |
| `bkp.colocarOnline` / `bkp.colocarOffline` / `bkp.semSeleccao` | `Colocar online` / `Colocar offline` / `Não existem backups seleccionados.` |
| `mod.formato` / `mod.removerImagem` / `mod.imagemGuardada` | `Formato` / `Remover a imagem desta alínea?` / `Imagem guardada.` |
| `utl.passwordManter` | `Deixe em branco para manter a password actual.` |
| `pwd.actual` / `pwd.alterada` | `Password actual` / `Password alterada.` |

---

## 3. The DataBlock (replaces a Forms multi-record block)

Files: `app/apps/web/src/components/datablock/` (§6.2). Built on TanStack Table v9: `useTable({ features: tableFeatures({ rowSortingFeature, rowPaginationFeature, rowSelectionFeature, columnSizingFeature }), columns, data, manualSorting: true, manualPagination: true, rowCount, state, on*Change })`. No client row models: the server sorts, filters and pages.

### 3.1 Props (derived from the shared resource definition, ARCHITECTURE §4.1)

```ts
import type { Resource, ListQuery, Consulta, Role } from '@gestsiid/shared';

export type Selection =
  | { mode: 'none' }
  | { mode: 'ids'; ids: number[] }                                        // 1..1000
  | { mode: 'consulta'; consulta: Consulta; total: number; capped: boolean };

export type RowTone = 'offline' | 'anulado' | undefined;

export interface ColumnView<Row> {
  col: string;                 // key in resource.columns
  width?: number;              // px; default by type: text 160, number 88, date 104 (datetime 132)
  align?: 'start' | 'end' | 'center';   // default: number → end, others → start
  mono?: boolean;              // code columns
  hidden?: boolean;            // not rendered; still usable in Mais Informação
  header?: string;             // only to shorten a label (e.g. 'FE'); full label goes to aria-label/title
  render?: (row: Row) => React.ReactNode;           // e.g. StatusBadge
  editor?: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'lov';
  options?: { source: 'dominio'; dominioId: string } | { source: 'lov'; name: string; valueCol: string; columns: string[] };
}

export interface DataBlockProps<Row extends { _rid?: string }> {
  resource: Resource;                     // columns (type, label, filter ops, sort, edit, insertOnly), defaultSort, roles
  columns: ColumnView<Row>[];              // display order = Forms X order (§4)
  endpoint?: string;                       // default `/api/${resource.name}`; nested: `/api/dominios/${id}/valores`
  master?: { label: string; keys: Record<string, string | number> | null };   // null = no current master row
  presets?: { id: string; label: string }[];                                   // server preset names
  defaultPreset?: string;
  extraParams?: Record<string, string | string[]>;                            // e.g. param[NOME], grupo
  selection?: 'none' | 'multi';            // default 'none'
  edit?: 'none' | 'inline' | 'panel';      // UI-17; default 'none'
  canInsert?: boolean; canUpdate?: boolean; canDelete?: boolean;              // default from resource.roles.write ∋ role and edit flags
  panel?: (row: Row | null, close: () => void) => React.ReactNode;           // edit === 'panel'
  rowTone?: (row: Row) => RowTone;
  rowMenu?: (row: Row) => MenuAction[];    // context menu (Forms popup)
  toolbar?: (ctx: { selection: Selection; current: Row | null; refetch: () => void }) => React.ReactNode;
  clearFiltersLabel?: string;              // default pt.db.limparFiltros; 'Todos' where Forms had that button
  urlState?: boolean;                      // true for the page's main block; false for details and dialog grids
  onCurrentRowChange?: (row: Row | null) => void;
  onSelectionChange?: (s: Selection, visibleRows: Row[]) => void;
  emptyText?: string;                      // default pt.db.consultaSemRegistos / semRegistos
  heading?: string;                        // accessible name when there is no page h1 for it
}
```

`useDataBlockQuery(endpoint, listQuery, master)` → TanStack Query key `[endpoint, master?.keys, listQuery]`, `placeholderData: keepPreviousData`, `refetchOnWindowFocus: !dirty`.

### 3.2 Anatomy

```
┌ toolbar 40: [preset][preset][preset]…   <screen buttons>                 [?] [Limpar filtros] [Novo][Apagar] ┐
├───┬───┬──────────┬────────────────┬───────────┬────────────── header 32 (surface-header, 13/600) ─────────────┤
│ ▪ │ ☐ │ Spool Id↓│ Data do pedido │ Modelo    │ …                                                           │
├───┼───┼──────────┼────────────────┼───────────┼────────────── filter row 32 (inputs 28) ─────────────────────┤
│   │   │ [      ] │ [01-09-2026..] │ [R3.D%  ] │ …                                                           │
├───┼───┼──────────┼────────────────┼───────────┼────────────── body, row 28 ──────────────────────────────────┤
│   │ ☐ │  512 340 │ 15-09-2026 10:02│ R3.D25   │ …                                                           │
│ ● │ ☑ │▌512 339 │ …   (current: bar + row-current; selected: row-selected)                                   │
├───┴───┴──────────┴────────────────┴───────────┴──────────────────────────────────────────────────────────────┤
│ ● 2 novos · 1 alterado            Erro no registo 3: Já existe um registo com estes valores.  [Cancelar][Guardar] │ dirty bar 44
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Registo 2 de 1 250 · 1 seleccionado(s)                  Por página [50▾]  |« ‹  Página [ 1 ] de 25  › »|     │ footer 32
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Grid lines: horizontal only (`--border`), plus a vertical line after the gutter/select columns. Header and filter row are sticky. The toolbar is omitted when it would be empty.

### 3.3 Filter row (query by example)

| Column type (resource) | Typed value | Query param |
|---|---|---|
| text, ops include `like` | contains `%` or `_` | `f[COL][like]=v` (server: `UPPER(col) LIKE UPPER(:v)`) |
| text | plain value | `f[COL]=v` (exact, as in Forms query mode) |
| number / code | digits (a `,` or `.` decimal is accepted for number) | `f[COL]=v`; not a number → cell error `Valor numérico inválido.`, query not sent |
| date | `DD-MM-AAAA` (also `DDMMAAAA`) | `f[COL]=YYYY-MM-DD` (whole day) |
| date | `DD-MM-AAAA..DD-MM-AAAA`, `DD-MM-AAAA..`, `..DD-MM-AAAA` | `f[COL][from]=`, `f[COL][to]=` |
| any | `IS NULL` (any case, trimmed) | `f[COL][null]=1` (BR-DOC-06) |
| any | `IS NOT NULL` | `f[COL][notnull]=1` |

- Only columns with `filter` ops get an input; the others show an empty cell.
- Enter (or F8) in any filter input executes the query: page 1, selection cleared, URL updated. Typing never auto-executes (Forms behaviour).
- Esc in a filter input with a value clears that input only. Esc in an empty input restores all inputs to the last executed values.
- A pending edit (typed but not executed) shows a 1 px dashed `--icon-pending` bottom border on that input, and the footer counter is replaced by `Filtros alterados. Prima Enter para consultar.`.
- The date input (§6.5) opens its range popover with Alt+ArrowDown.
- `?` toolbar icon button (aria-label `Ajuda dos filtros`) opens a Popover with the 4 help lines (§2.8).
- `Limpar filtros` clears every input and executes. The preset is kept.
- Executing while dirty → AskCommitDialog (#46) first.
- An unknown filter or sort produces `400 VALIDACAO`, a programming error: toast.

### 3.4 Presets bar

- `ToggleGroup type="single"` (required: always one pressed), 28 px items, labels verbatim (Documentos: `Todos`, `Em branco`, `Não Executados`, `Em Erro`, `A Executar`, `Em Execução`).
- Pressed style: `bg-primary text-primary-foreground`.
- Changing preset executes at once, clears the selection, keeps the filters and resets the sort to `defaultSort` when the preset is `todos` (BR-DOC-04). The param is `preset=<id>`.
- Extra context filters (`grupo`, `param[...]`) show as removable chips after the presets: `Grupo do documento 512339 ✕`, `Procurar por parâmetros ✕` (clicking ✕ removes the param and executes).

### 3.5 Column-header sort (ORDENAR_POR)

- Only columns with `sort: true` for the current role are interactive (a `<button>` inside the columnheader); for USER in Documentos only `Spool Id`.
- **Click** on a column that is not the first key → it becomes the only key, `asc` (Documentos `Spool Id` defaults to `desc`). Click on the first key → toggle its direction.
- **Shift+click** → append as the next key (max 3; a 4th replaces the 3rd). Shift+click on an existing key toggles its direction.
- Header context menu: `Ordenar ascendente`, `Ordenar descendente`, `Remover ordenação`.
- Indicator: `ArrowUp` / `ArrowDown` 12 px `text-primary` after the label. With more than one key, a 10 px superscript index `1`/`2`/`3`. Label weight stays 600.
- `aria-sort` goes on the first key's columnheader only.
- URL and API: `sort=COL:asc,COL2:desc`. Empty = `resource.defaultSort`, which is shown with the indicator too. Special aliases: Documentos header `Lote / Ordem` → `LOTE`; `FE` → `FATURACAO_ELECTRONICA`.
- Sorting keeps the selection and goes to page 1. When dirty → AskCommitDialog first.

### 3.6 Paging and record counter

- Server paging: `page`, `size` (default 50; options 25/50/100/250/500; max 500). Footer: `Por página` select, `|«` `‹` `Página [n] de N` `›` `»|`. The page input accepts Enter.
- `N = ceil(total/size)`. When `totalCapped`: `de N+`, `»|` disabled, `›` enabled while the page came back full.
- Counter (footer left, 12 px, `aria-live="polite"` on change of total only):
  - Current row exists: `Registo {offset+index+1} de {total}`, or capped `Registo 3 de mais de 10 000`.
  - No current row: `{total} registos`, or `Mais de 10 000 registos`.
  - Suffix ` · {n} seleccionado(s)` in ids mode. Consulta mode shows the banner (§3.7) instead.
- Numbers are formatted per UI-10 (`1 250`).

### 3.7 Row selection and "Seleccionar todos"

- `selection: 'multi'` adds a 32 px column. The header checkbox's aria-label is `Seleccionar todos`; each row checkbox is `Seleccionar registo`.
- Click or Space toggles the current row. Shift+click toggles the range from the last clicked row, within the page.
- The selection is a set of ids that survives page and sort changes. It is cleared by: executing a query, changing preset or chips, a successful batch action, `Limpar selecção`.
- Past 1000 ids → the tick is refused and toast `Máximo de 1000 registos seleccionados. Use «Seleccionar todos» para a consulta completa.`.
- **Header checkbox**
  - Unchecked → **consulta mode**: `{ mode: 'consulta', consulta: <executed f, preset, param, paramModelo, grupo> }`. Rows render ticked with `aria-disabled` checkboxes. A 32 px banner above the header reads `Todos os 1 250 registos da consulta estão seleccionados.` plus `[Limpar selecção]`.
  - Checked → clears.
  - Indeterminate while in ids mode with ≥ 1 id; clicking it then enters consulta mode.
- Batch actions receive `Selection` and send `{ ids }` or `{ consulta }` (never both). `mode: 'none'` → toast #30 (UI-15).
- Row background `bg-row-selected`; `aria-selected="true"` on the row.

### 3.8 Row states

| State | Gutter (24 px, icon 14 px + tooltip + sr text) | Row styling | Behaviour |
|---|---|---|---|
| clean | — | — | — |
| hover | — | `bg-row-hover` | — |
| current | — | `bg-row-current` + 2 px inset left bar `row-current-bar` | The roving-focus row; drives the detail blocks |
| selected | — | `bg-row-selected` (over current bg) | `aria-selected` |
| new | `Plus` green, `Novo` | 2 px left bar `row-new-bar` | `edit` + `insertOnly` cells editable; Esc on the row removes it |
| dirty | `Circle` (filled, 8 px) `icon-pending`, `Alterado` | Changed cells `bg-row-dirty-cell` | Esc on the row (not editing) reverts its changes |
| deleted | `Minus` `icon-danger`, `Apagado` | `bg-row-deleted`, cells `text-muted-foreground line-through`, read-only | Ctrl+Delete again or Esc undeletes |
| saving | `Spinner` 12 px, `A guardar` | — | Row read-only while its request runs |
| error | `CircleAlert` `icon-danger`, `Erro` | `bg-row-error`. A 20 px message line under the row (`text-xs text-field-error`, `id` referenced by the row's `aria-describedby`). Cells named in `fields` get a 2 px inset `--destructive` outline and a tooltip with the field message. | Stays dirty; editing the row clears the error |
| conflict 409 `REGISTO_ALTERADO` | `RefreshCw` `icon-danger`, `Bloqueado` | Like error; the message line shows the server text and a `[Actualizar]` link | `Actualizar` drops this row's overlay and refetches (the user's edit to that row is discarded) |
| conflict 409 `REGISTO_BLOQUEADO` | `Lock` `icon-danger`, `Bloqueado` | Like error | Guardar may be retried |
| offline (rowTone) | `Archive` `text-offline`, `Offline` | Text cells `text-text-offline font-semibold` | Read-only tone |
| anulado (rowTone) | `Ban` `text-anulado`, `Anulado` | Text cells `text-text-anulado font-semibold` | Read-only tone; anulado wins over offline |

### 3.9 Editing

**Mode choice (UI-17).** `inline`: Impressoras, Unidades Medida, Tipos Mídia, Variáveis SIID, Domínios › valores, Modelos (master list columns, Secções, Condições, Parâmetros por Omissão, Histórico, Atributos CDRAMO), Reports › parâmetros. `panel`: Utilizadores, Equipa de Gestão (OD68), Domínios master (right pane, §4.8), Reports master (form above grid). `dialog`: all named actions (Alterar Modelo, Código Barras, Adicionar Permissão, …).

**Inline editing**
- Enter or F2 on a cell starts editing; typing a printable character starts editing and replaces the value.
- Enter commits the cell and stays; Tab / Shift+Tab commit and move to the next/previous editable cell (wrapping to the next row); Esc cancels the cell edit.
- Editors: text input, number input (right-aligned), DateInput, Select (domain values), Checkbox (`S`/`N` → checked/unchecked), LOV cell (input + `…` button; Alt+ArrowDown or F9 opens the LOV dialog).
- zod validates a cell on commit; the message appears as a cell tooltip plus the row error line.
- `insertOnly` columns are editable only on new rows. Computed columns (e.g. Tipos Mídia `Bytes`) are never editable.

**Insert / delete**
- `Novo` toolbar button or Insert → new row at the top of the current page with defaults, focus on its first editable cell.
- `Apagar` or Ctrl+Delete → toggles the deleted mark on the current row (or on every selected row). Nothing is sent until Guardar.

**Panel editing**
- Enter or double-click on a row → Sheet (right, 480 px; 720 px when there is an image or more than 12 fields). Title = block label + key. The form is react-hook-form + the resource zod schema.
- `Guardar` sends one request at once (not the dirty bar) and closes on success with toast `Guardado.`. `Cancelar` closes; if the form is dirty, AskCommitDialog (#46) first. `Novo` opens an empty panel.

### 3.10 Dirty bar, Guardar / Cancelar (COMMIT_FORM / rollback)

- Appears (sticky, 44 px, `bg-dirty-bar-bg`, `role="region" aria-label="Alterações por guardar"`) as soon as one row is new, dirty or deleted.
- Left: `Circle` icon + `db.alteracoes` text. Middle: the error message of the first failing row, when there is one. Right: `Cancelar` (secondary) and `Guardar` (primary, with `<Kbd>Ctrl S</Kbd>` hint).
- **Guardar** (button, Ctrl+S anywhere on the page, or `Sim` in AskCommitDialog):
  1. Validate every dirty row client-side; any invalid → mark those rows as errors, send nothing.
  2. Send requests one at a time in the order **deletes → updates → inserts** (`DELETE /:rid {orig}`, `PUT /:rid {orig, values}` with only the changed columns, `POST {values}`). Master-detail pages with one bar: detail deletes → master updates → master inserts → detail updates → detail inserts. Master deletes are immediate actions with a ConfirmDialog (`db.apagarConfirm`), never batched.
  3. On each success, remove that row from the overlay.
  4. **Stop at the first error:** that row → error or conflict state with the message; the rows not yet sent stay dirty; the bar shows `Erro no registo {n}: {message}` (`n` = position on the page, or the key when the row is on another page).
  5. After the run, invalidate the list query (overlay kept for unsaved rows). All succeeded → toast `Guardado.`, bar disappears.
- **Cancelar**: discard the whole overlay (the rollback). No request, no confirmation.
- The overlay is a local map keyed by `_rid` (or a `tmp:<uuid>` for new rows) holding `{ orig, values, state }`. Refetched data never overwrites it.
- **Guards** (all use AskCommitDialog #46): route change (TanStack Router `useBlocker` with `withResolver`), executing a query, changing preset, sort, page or page size, changing the master's current row, closing a panel or dialog that holds a DataBlock. Plus a native `beforeunload` prompt while dirty. `Não` discards and continues; `Cancelar` stays.
- While dirty: `refetchOnWindowFocus` is off for that block, and `Actualizar` asks #46 first.

### 3.11 Master-detail

- The detail block gets `master.keys` from the master's current row. `null` → the detail shows the `Seleccione um registo.` empty state, and its `Novo` is disabled.
- A new, unsaved master row → detail `Novo` disabled with tooltip `Guarde o registo principal antes de adicionar detalhes.`.
- Changing the master's current row while the detail is dirty → #46.
- **Stacked:** master on top, a draggable horizontal splitter (`ResizablePanelGroup direction="vertical"`, default 55/45, keyboard: arrows move 5 %), detail below (often in `Tabs`).
- **Side-by-side** (UI-18): master 400 px on the left, splitter, detail on the right. Below 1280 px it switches to stacked.

### 3.12 Loading, empty, error

| State | Rendering |
|---|---|
| First load | 8 skeleton rows (28 px bars; shimmer off under reduced motion); grid `aria-busy="true"`. |
| Refetch with data | Rows stay; 2 px indeterminate progress bar under the header (static bar under reduced motion). |
| Empty, filters/preset/chips active | Centered in the body (shadcn `Empty`): icon `SearchX`, text `A consulta não obteve registos.` (Documentos: #26 `A consulta não obteve documentos.`), button `Limpar filtros`. |
| Empty, no filters | `Não existem registos.` + `Novo` when `canInsert`. |
| Detail without master | `Seleccione um registo.` |
| Error | Icon `CircleAlert` `text-danger-text`, the `message` from the error body, `Ref.: <requestId>`, button `Tentar novamente`. |

### 3.13 URL state (`urlState: true` blocks only)

- Search params hold the **executed** query only: `f[COL]…`, `preset`, `param[NOME]`, `paramModelo`, `grupo`, `sort`, `page`, `size`, plus screen keys: `tab`, the master key (`doc`, `modelo`, `dominio`, `report`) and the detail's own `page`/`sort` prefixed (`d.sort`, `d.page`).
- Validated in the route's `validateSearch` with the shared `listQuery` zod parser (unknown keys dropped).
- Executing a query or changing preset or chips → `navigate({ search })` (push). Sort, page, size, tab and master key → `replace: true`.
- Browser back/forward re-executes (with the #46 guard).
- Selection, current row, dirty overlay and pending filter text are never in the URL.

### 3.14 Keyboard map

| Context | Key | Action |
|---|---|---|
| Page | Ctrl+S | Guardar (dirty bar or open panel/dialog form) |
| Page | Alt+M | Focus the navigation menu |
| Page | Esc | Close the topmost popover, menu or dialog (dialogs: = Cancelar/Não) |
| Header cell | ArrowLeft/Right | Previous/next header |
| Header cell | ArrowDown / ArrowUp | Filter row / (none) |
| Header cell | Enter or Space · Shift+Enter | Sort (click) · add sort key (shift-click) |
| Header cell | Shift+F10 / Menu | Header context menu |
| Filter input | Enter or F8 | Executar consulta |
| Filter input | Esc | Clear this input; if empty, restore the last executed filters |
| Filter input | Tab / Shift+Tab | Next/previous filter input |
| Filter input | ArrowDown (no popover open) | Focus the first data row |
| Filter input | Alt+ArrowDown | Open the date range popover |
| Body | ArrowUp/Down | Previous/next row. Down on the last row of a page → next page, first row. ArrowUp on the first row → filter row. |
| Body | ArrowLeft/Right | Previous/next cell |
| Body | Home / End | First/last cell of the row |
| Body | Ctrl+Home / Ctrl+End | First/last row of the page |
| Body | PageUp / PageDown | Move by the number of visible rows (clamped to the page) |
| Body | Alt+PageUp / Alt+PageDown | Previous/next page |
| Body | Space | Toggle the row's selection (`selection: 'multi'`) |
| Body | Enter | Inline: edit cell · panel: open panel · read-only (Documentos): focus the detail tabs |
| Body | F2 / printable key | Start editing (inline) |
| Body | Insert | Novo (new row) |
| Body | Ctrl+Delete | Toggle deleted mark |
| Body | Esc (not editing) | Revert the current row's unsaved changes |
| Body | Shift+F10 / Menu | Row context menu |
| Cell editor | Enter · Tab/Shift+Tab · Esc | Commit and stay · commit and move · cancel |
| Cell editor (LOV/date) | Alt+ArrowDown or F9 | Open LOV dialog / date popover |
| Dialog | Tab / Shift+Tab | Cycle inside (focus trap) |
| Dialog | Enter in a single-line input | Submit the primary button |
| Tabs | ArrowLeft/Right, Home/End | Move between tabs (automatic activation) |

**Forms keys and browser conflicts**

| Forms key (Web Forms default) | Forms function | Web |
|---|---|---|
| F7 | Enter Query | Not mapped (browsers toggle caret browsing). The filter row is always present: ArrowUp from row 1. |
| F8 | Execute Query | Mapped in filter inputs (Chrome, Edge and Firefox do not bind F8 on a page). |
| F9 | List of Values | Mapped in LOV fields. Firefox may toggle Reader View; Alt+ArrowDown is the primary key. |
| F10 | Commit | Not mapped (browser menu bar); Ctrl+S. |
| F6 / Shift+F6 | Insert / Delete Record | Not mapped (F6 = address bar); Insert / Ctrl+Delete. |
| Shift+F4 | Clear Record | Esc on the row. |
| Ctrl+Q | Exit form | Not mapped (Firefox quit); use the menu. |
| F5, F11, F12, Ctrl+W/T/N/Tab, Ctrl+PageUp/PageDown, Ctrl+F, Alt+Left/Right | Browser | Never intercepted. Alt+Left/Right go through the router guard. |

---

## 4. Screens (desktop 1440 px)

Narrower widths, for every screen: < 1280 px the sidebar auto-collapses and side-by-side layouts stack; < 1024 px the sidebar becomes a Sheet; grids scroll horizontally (the gutter, select and first key column stay sticky left); toolbars overflow into `Mais acções`.

### 4.1 Login (`/login`)

```
                          ┌──────────────────────────────────────────────┐
                          │ GestSIID                                     │  18/600
                          │ Ambiente  [GADOR_TESTES]  (EnvironmentBadge) │  from /api/health
                          │                                              │
                          │ Utilizador                                   │
                          │ [MSILVA______________________________]       │  uppercase shown and sent
                          │ Password                                     │
                          │ [••••••••____________________________]       │
                          │ Caps Lock activo.                (when on)   │
                          │ ┌ Utilizador e/ou password inválidos. ┐      │  #3 inline alert
                          │                               [ Entrar ]     │
                          └──────────────────────────────────────────────┘
                                   360 px card, bg-card, border, e0
```

- Labels come from `Ambiente:`, `Utilizador:`, `Password:` (colons dropped, UI-11). Autofocus Utilizador; Enter submits.
- Client checks give #1 / #2 as field errors. Submitting shows a spinner in the button and disables it. 401 → #3; 503 → `Base de dados indisponível. Tente mais tarde.`; `motivo=sessao` → info alert `A sessão expirou. Entre novamente.`.
- If health fails with no `ambiente`, the Ambiente row is hidden.
- There is no environment selector (D-02, D-27).

### 4.2 Documentos (`/gestao/documentos`)

```
Gestão › Documentos
Documentos                                                                [Procurar por parâmetros] [Actualizar]
[Todos][Em branco][Não Executados][Em Erro][A Executar][Em Execução]  (chip: Grupo do documento 512339 ✕)       [?]
ADM only: [Regerar][Reimprimir][2ª Via][Cópia] │ [Reenviar][Reenviar Email][Re-Arquivar] │ [Suspender][Retomar] │ [Anular][Cancelar]
┌──┬──┬──┬─────────┬────────────────┬─────────┬──────────────┬───────────┬─────────────┬──────────────────────┬────┬───────┬──────┐
│▪ │☐ │✎ │Spool Id↓│Data do pedido  │Modelo   │Estado        │Criado por │Referência   │Destinatário          │ FE │Lote   │Ordem │
├──┼──┼──┼─────────┼────────────────┼─────────┼──────────────┼───────────┼─────────────┼──────────────────────┼────┼───────┼──────┤
│  │  │  │[       ]│[              ]│[       ]│[            ]│[         ]│[           ]│[                    ]│[  ]│[     ]│[    ]│
├──┼──┼──┼─────────┼────────────────┼─────────┼──────────────┼───────────┼─────────────┼──────────────────────┼────┼───────┼──────┤
│  │☐ │💬│  512 340│15-09-2026 10:02│R3.D25   │(IMPRESSO)    │JPEREIRA   │00012345     │ANA COSTA             │ S  │  8 812│     1│
│⛔│☐ │  │  512 339│15-09-2026 09:58│D1.A7    │(ERRO)        │JPEREIRA   │00012344     │RUI MATOS (wine 600)  │    │  8 812│     2│
│🗄│☑ │  │  498 001│02-08-2026 16:40│R3.D27   │(GERADO)      │MSILVA     │             │EMPRESA X (blue 600)  │    │       │      │
└──┴──┴──┴─────────┴────────────────┴─────────┴──────────────┴───────────┴─────────────┴──────────────────────┴────┴───────┴──────┘
Registo 1 de mais de 10 000 · 1 seleccionado(s)                           Por página [50▾]  |« ‹ Página [1] de 200+ › »|
═══════════════════════════════════════════ splitter (55 / 45) ═══════════════════════════════════════════════════
Documento 512340 · R3.D25 · (IMPRESSO)                                     [Mostrar Documento] [Mostrar Grupo] [Clonar]
[Mais Informação] [Parâmetros] [Comentários] [Anexos] [Detalhes] [Log]
┌ tab content (see below) ────────────────────────────────────────────────────────────────────────────────────────────┐
```

**List**
- Resource `documentos`; `selection: 'multi'`, `edit: 'none'`, `rowTone`: `DISPONIBILIDADE='ANU' || ATRIBUTO9='A'` → anulado, `DISPONIBILIDADE='OFF'` → offline.
- Column order is the Forms X order (the gutter `▪` is new). Widths:

| Column | Width | Filter | Sort |
|---|---|---|---|
| ☐ select (`SELECCIONAR`) | 32 | — | — |
| ✎ `COMENTARIO` | 32. `MessageSquare` 14 px when comments exist (Forms `***`); aria-label `Comentários`. Click → Comentários tab. | — | — |
| `Spool Id` (ID) | 88, end, mono | number | ADM + USER, default `desc` |
| `Data do pedido` | 132, date-time | date / range | ADM |
| `Modelo` | 96, mono | text | ADM |
| `Estado` | 128, StatusBadge `documento` | text | ADM |
| `Criado por` | 104 | text | ADM |
| `Referência` (N_REFERENCIA) | 128 | text | ADM |
| `Destinatário` | flex, min 200 | text | ADM |
| `FE` (FATURACAO_ELECTRONICA; aria-label/title `Fatura electrónica`) | 40, center | text | ADM |
| `Lote` (LOTE_ID) | 72, end | number | ADM, `Lote / Ordem` header group → `LOTE` alias |
| `Ordem` (LOTE_ORDEM) | 64, end | number | (under `LOTE`) |

- Header labels come from the `ORDENACAO_DOCUMENTOS` buttons (`Spool Id`, `Data do pedido`, `Modelo`, `Estado`, `Criado por`, `Referência`, `Destinatário`, `FE`, `Lote` / `Ordem`).
- Double-click on a row → `Mais Informação`. Enter → focus the tabs.
- Row context menu = the `GENERICO` popup, labels verbatim and in order: `Detalhes`, `Parâmetros`, `Comentários`, `Log`, `Mais Informação`, `Mostrar Grupo`, `Mostrar Documento`, `Clonar`, `Procurar por parâmetros`. The first five switch the tab.
- `Actualizar` (legacy `REFRESH` label): refetches the list and the open tab (#46 guard is moot: the list is read-only).

**Toolbar per role (D-08, A-08)**

| Control | ADM | USER |
|---|---|---|
| Presets, filters, Actualizar, Procurar por parâmetros, selection, context menu, tabs, Mostrar Documento, Mostrar Grupo, Clonar | ✓ | ✓ |
| Sort on columns other than Spool Id | ✓ | — |
| Regerar, Reimprimir, 2ª Via, Cópia, Reenviar, Reenviar Email, Re-Arquivar, Suspender, Retomar, Anular, Cancelar | ✓ | hidden |
| Comentários: insert (`Guardar`) | ✓ | hidden (read-only) |
| Detalhes: row menu `Cancelar` (single request) | ✓ | ✓ |
| Mais Informação extended fields (`*` below) | ✓ | not sent by API |

**Detail tabs** (query key includes the document id; tab in `tab` param)

| Tab (label) | Content |
|---|---|
| `Mais Informação` | Read-only 5-column field grid (label 12 muted above value 13), in Forms canvas column order. Col 1: `Id`, `Modelo Id`, `Estado`, `Impressora Id`, `Report Id`, `Ambiente Id`, `Lote Id`, `Lote Ordem`, `N Referência` FIX, `Destinatário` FIX, `Morada`, `Código Postal` FIX, `País` FIX, `Registo Edoc`*, `Registo Arquivo`*. Col 2: `Tipo Output`, `Nome Output`, `Criado Por`, `Data Pedido`, `Executado Por`, `Data Execução` FIX, `Impresso Por`, `Data Impressão` FIX. Col 3: `Versão` FIX, `N Impressões` FIX, `N Anexos`, `N Cópias` FIX, `N Capas`, `Última Via Por` FIX, `N Vias`, `Tamanho ficheiro`, `Disponibilidade` (StatusBadge offline/anulado, else text). Col 4: `Tipo Edoc Id`*, `Atributo1`–`Atributo4`, `Atributo5`–`Atributo8`*, `Atributo9`, `Atributo10`–`Atributo25`*. Col 5 (ADM only): `Tipo Arquivo Id`*, `Atrib. Arquivo 1`–`20`*, `Data Arquivo`*. (`*` = ADM only; USER payload omits them, so the field is not rendered.) |
| `Parâmetros` | DataBlock, read-only: `Nome` (FIX), `Valor`. `_USER` and `P_ID` are filtered by the API. |
| `Comentários` | DataBlock read-only: `Data` (132), `Utilizador` (104), `Comentário` (flex, wraps up to 3 lines). ADM: under the grid, a `Comentário` textarea (3 rows, max 2000) + `Guardar` → POST → toast `Guardado.`, refetch. |
| `Anexos` (NEW) | DataBlock read-only: `Spool Id`, `Modelo`, `Estado`, `Data do pedido`. Double-click → navigate the list to that document (`doc` param). |
| `Detalhes` | Queue DataBlock, read-only: `Detalhe` (TIPO_QUEUE_RF, 88), `Data Pedido`, `Criado Por`, `Data Execução` FIX, `Data Finalização` FIX, `Estado` (StatusBadge `fila`), `Impressora` (BR-DOC-24 text), `Resultado` (flex, one line). Enter/double-click on `Resultado` → Dialog `Resultado` (lg, pre-wrap mono, `OK`). Row menu `Cancelar` only when ESTADO ∈ {ESPERA, TERMINADO} → #25 → `POST …/fila/:queueId/cancelar` → toast `Cancelar: 1 documento(s) processado(s).`. |
| `Log` | DataBlock read-only: `Data Log` (132), `Descrição` (flex). |

**Dialogs**

| Trigger | Flow |
|---|---|
| Regerar | #30 if none → #12 → POST `regerar` → 428 → Dialog `Regerar` (sm): PasswordInput labelled #14, `Cancelar` / `OK`; 403 → #15 field error; success → result (#13 list or success toast). |
| Reimprimir / 2ª Via / Cópia | #30 → #7 → Dialog titled with the button label (sm): RadioGroup #8 (`Imprimir documentos para a impressora associada` default, `Outra impressora:`); LOV field `Impressoras` (Id, Descrição, Endereço; `impressoras-validas`) under option 2. Focusing the LOV field selects option 2 (BR-DOC-10). Option 2 without a printer → `Campo obrigatório não preenchido.`. `Cancelar` / `OK`. Result #9 (and #10 group for 2ª Via). |
| Anular | #30 → #16 (destructive) → result: skipped listed with `motivo` under title `Anular`. |
| Cancelar | #30 → ConfirmDialog #17 (destructive) with a Checkbox `Cancelar em todos os estados` (D-12, off by default) above the buttons. |
| Suspender / Retomar | Dialog titled with the button label (sm): RadioGroup #23 / #24. Option "seleccionados" + no selection → #30. Option "todos" → `GET /fila/contagem?estado=ESPERA|SUSPENSO` → ConfirmDialog `Vão ser suspensos {n} pedidos em espera. Continuar?` / `Vão ser retomados {n} pedidos suspensos. Continuar?` (D-28). `Cancelar` / `OK`. |
| Reenviar / Reenviar Email / Re-Arquivar | #30 → #18 / #18 / #21 → result #19 / #20 / #22. |
| Procurar por parâmetros | Dialog #27 (md): LOV field `Procurar apenas no modelo:` (`modelos`); a grid of the current document's parameter names (`Nome` ro, `Valor` editable, `%`/`_` allowed); `Procurar` → sets `param[…]`, `paramModelo` in the URL and executes; empty result → inline alert #26 in the dialog (the dialog stays open). With no current document the grid starts empty and `Nome` is a text input. |
| Conversão de Parametros (#28) | On `Valor` of `P_NMRECIBO` or `P_CDPERSON` (in Procurar and Clonar): double-click or Alt+ArrowDown → Dialog (sm) with one input labelled `NMRECINUE` / `CDIDEPER` → `OK` → `GET /conversoes/recibo|pessoa` → writes the converted value back into the cell. Not found → field error `Registo não encontrado.`. |
| Clonar | Dialog `Clonar` (md), subtitle `Documento {id}`: DataBlock `Nome` ro / `Valor` editable (pre-filled). `Cancelar` / `Clonar`. Success → toast `Documento clonado. Novo Spool Id: {id}.`, list refetch. |
| Mostrar Documento | Synchronously `const w = window.open('', '_blank')`, then `fetch …/pdf` → blob → `w.location = URL.createObjectURL(blob)` (revoke after 60 s). Error → `w.close()` + toast `Documento não disponível` + reason. |
| Mostrar Grupo | Sets `grupo=<id>` → chip `Grupo do documento {id}`. |

States: list loading/empty (#26)/error per §3.12; detail tabs without a current row → `Seleccione um registo.`; `totalCapped` counter shows `mais de 10 000`.

### 4.3 Modelos (`/configuracao/modelos`)

```
Configuração › Modelos
Modelos                                                                                                    [Actualizar]
[Todos]                                                         [Alterar Modelo] [Código Barras] [Clonar]   [?]
┌──┬────────┬──────────────────────────┬─────────┬──────────┬───────────┬──────────┬───────────────┬─────────────┬──────────────────┬──────────────┬──────────────┐
│▪ │Id ↑    │Descrição                 │Nº Cópias│Unicidade │Data Início│Data Fim  │Modo Expedição │Código Barras│Modo Certificado  │Tipo Genérico │Modo Proteção │
│  │[      ]│[                        ]│[       ]│[        ]│[         ]│[        ]│[             ]│[           ]│[                ]│[            ]│[            ]│
│  │R3.D25  │Aviso de recibo           │       2 │[C ▾]     │01-01-2020 │          │[I impresso ▾] │[Não ▾]      │[0 isento ▾]      │[DOC. NÃO GEN▾│[0 sem prot ▾]│
└──┴────────┴──────────────────────────┴─────────┴──────────┴───────────┴──────────┴───────────────┴─────────────┴──────────────────┴──────────────┴──────────────┘
═══════════════════════════════════════════ splitter ═══════════════════════════════════════════════════════════════════
Modelo R3.D25
[Secções] [Parâmetros] [Atributos] [Atributos Arquivo]
┌ Secções ─────────────────────────────────────────────────────────────────────────┬ Assinatura ─────────────────────┐
│ ▪ │Id Secção│Alínea│Tipo conteúdo▾│Título            │Texto                     │ ┌───────────────────────────┐   │
│   │ 10      │ 1    │[3 ▾]         │Condições gerais  │…                         │ │   (image preview 240×120) │   │
│   │ 10      │ 2    │[3 ▾]         │…                 │…                         │ └───────────────────────────┘   │
│                                                   [Novo][Apagar]              │ PNG · [Abrir Ficheiro ...]       │
├ Condições (alínea 10.1) ─────────────────────────────────────────────────────────┤ [Guardar imagem na BD] [Limpar] │
│ ▪ │Contexto▾│Data Início│Data Fim│U.E.│Ramo│Atributo1│…│Atributo8│   [Novo][Apagar]└─────────────────────────────────┘
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Master** `DOC_MODELOS_DOCUMENTO`: inline edit of the list columns only (`Unicidade` = FORMA_CONTROLO_RF values `C, V, U, UV`; `Modo Expedição`, `Modo Certificado`, `Modo Proteção`, `Código Barras` = STAMP (BINARIO), `Tipo Genérico` = `modelos-genericos` select with `DOC. NÃO GENERICO` = null). No insert or delete (Forms I/U/D false/true/false).
- Headers verbatim from `CONSULTA`. `Todos` = `clearFiltersLabel`. Select display: `DESIGNACAO`; stored `CHAVE`.
- Row context menu = popup `MODELO`: `Parametros` (→ Parâmetros tab), `Código Barras`, `Clonar`, `Secções`, `Atributos`, `Atributos Arquivo`. Double-click → `Alterar Modelo`.
- **Alterar Modelo** dialog (md): `Modelo` (ro), `Descrição`, `Nº de Cópias`, `Unicidade`, `Validade` (DATA_INICIO), `Data Fim`; `Cancelar` / `OK` → `PUT` subset → toast `Guardado.`.
- **Clonar Modelo** dialog: same fields, `Modelo` editable and required. `OK` → #38 confirm → POST; 422 `MODELO_EXISTENTE` → #37 on `Modelo`.
- **Código Barras** dialog (md): `Modelo` (ro), `Tipo de código de barras` (select `CODIGOS BARRAS`), `Altura (cm)`, `Largura (cm)`, `Posição X`, `Posição Y`, `Formato` (NEW label, BARCODE_FORMAT had no prompt), hint #47; `Cancelar` / `OK`.
- **Secções** tab: side-by-side inside the tab (grid + 320 px image pane).
  - Grid inline: `Id Secção`, `Alínea`, `Tipo conteúdo` (FIX label from `Tipocntd Id`, select `tipos-conteudo`, pre-selected, required, D-28), `Título`, `Texto` (one line; Enter/F2 → Dialog `Texto` with textarea, `Cancelar` / `OK`).
  - Row menu = popup `SECCAO` `Clonar` (#39) + `APAGAR` `Apagar`.
  - Image pane `Assinatura`: preview, `TIPO_IMAGEM`, `Abrir Ficheiro ...` (file input, `accept="image/jpeg,image/png,image/gif,image/bmp"`), `Guardar imagem na BD` (PUT; enabled after a file is chosen), `Limpar` (popup `ASSINATURA` label) → `Remover a imagem desta alínea?` → DELETE.
  - Below: **Condições** DataBlock for the current section, inline: `Contexto` (FIX from `Contexto Id`, select `contextos-apr`, required, D-28), `Data Início`, `Data Fim`, `U.E.`, `Ramo`, `Atributo1`–`Atributo8`; row menu `Apagar`. One dirty bar for the tab (sections + conditions, §3.10 order); deleting a section with conditions → #42 row error.
- **Parâmetros** tab (title in Forms: `Parâmetros por Omissão do Modelo`, shown as the tab's heading line):
  - Grid: `Nome` (ro), `Nome Consulta`, `Obrigatório` FIX (ro check), `Válido` FIX (ro check), `Unicidade` (ro check), `Consulta` (check), `Valor por Omissão`, `Inicio Vigência`, `Fim Vigência`, `Histórico` (icon button `History` when history exists, aria-label `Histórico`).
  - Guardar → one `PUT …/omissao` per dirty row; #43/#44/#45 errors.
  - `Histórico` → Dialog `Valor por Omissão` (lg) with an inline DataBlock `Valor`, `Data Início`, `Data Fim`, `Nome Consulta`, `Consulta`, `Criado Por`, `Data Criação`, `Actualizado Por`, `Data Actualização` (popup `Inserir` / `Actualizar` → `Novo` / `Guardar`).
- **Atributos** / **Atributos Arquivo** tabs: grid `Edoc_id` / `Arq Id`, `Modelo`, `UE`, `Ramo` (the only editable column), `Descrição` FIX, `Nome Parâmetro` FIX, `Ordem`, `Valor Omissão` FIX, `Tipo de Parâmetro`, `Data Início`, `Data Fim`, `Criado Por`, `Data Criação`.
- States: master empty/error; tabs without a current model → `Seleccione um registo.`; image upload 413/415 → field errors in the pane.

### 4.4 Permissões (`/configuracao/permissoes`)

Tabs (verbatim, sentence case per UI-11): `Geral` · `Utilizador` · `Modelos`.

```
Configuração › Permissões
Permissões                                                                                                  [Actualizar]
[Geral] [Utilizador] [Modelos]
── Geral ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
[Todos]   [Adicionar Permissão] [Alterar Validade] [Retirar Permissão] [Copiar do modelo...] [Copiar do utilizador...]
│▪│Modelo↑ │Utilizador│Depart.│Tipo Permissão↑│Início Validade│Fim Validade│Data Criação│Actualizado Por│Data Actualização│
│ │[     ] │[       ] │[    ] │[            ] │[            ] │[         ] │[         ] │[            ] │[              ] │

── Utilizador ─────────────────────────────────────────────────────────────────────────────────────────────────────────
Departamento [DSI – Sistemas de Informação ▾]   Utilizador [MSILVA  …]   Permissão [Impressão ▾]
┌ Sem Permissão ─────────────────────┐        ┌ Com Permissão ─────────────────────────────────────────────────┐
│ ☐ R3.D25                           │  [ >> ]│ ☐ Modelo      │ Data Inicio  │ Data Fim                          │
│ ☑ R3.D27                           │  [ >  ]│ ☐ D1.A7       │ 01-01-2024   │ 31-12-2200                        │
│ ☐ D1.A5                            │  [ <  ]│ ☐ R3.D28      │ 15-09-2026   │ 31-12-2200                        │
│ 124 registos                       │  [ << ]│ 2 registos                                                     │
└────────────────────────────────────┘        └────────────────────────────────────────────────────────────────┘
```

- **Geral**: DataBlock over `permissoes`; the `Todos` toggle button (`aria-pressed`) switches preset `validas` (default, off) ↔ `todas` (on).
  - Headers verbatim from `ORDENAR_PERMISSOES`. `selection: 'none'`, read-only grid.
  - Toolbar = popup `MENU` labels: `Adicionar Permissão`, `Alterar Validade`, `Retirar Permissão`, `Copiar do modelo...`, `Copiar do utilizador...`. The same entries are the row context menu. The row-based ones need a current row (disabled otherwise).
- **Adicionar Permissão** dialog (md):
  - `Modelo` (LOV `modelos-validos`); `Utilizador` (LOV `utilizadores-vw`, columns `CDEMPLEA`, `Depart.`, `CODIGO`; fills `Depart.` ro); `Tipo Permissão` (select `TIPO_PERMISSAO`); `Início Validade` (required); `Fim Validade`.
  - `Cancelar` / `OK`. Errors #31 / #32 as form alerts.
- **Alterar Validade** dialog (md): `Modelo`, `Utilizador`, `Depart.`, `Tipo Permissão` read-only; `Início Validade` (#33), `Fim Validade`; errors #34 / #35.
- **Retirar Permissão**: #36 (destructive) → action `anular`.
- **Copiar do modelo...** dialog (sm): `Modelo` (target LOV) and `Copiar do modelo` (source LOV) · **Copiar do utilizador...** (md): `Utilizador` + `Depart.` (target LOV), `Copiar do utilizador` + `Depart.` (source LOV); `Cancelar` / `OK` → toast `Guardado.`.
- **Utilizador** tab (TransferList, §6.8):
  - Controls: `Departamento` (select `UNIDADE_NEGOCIO`), `Utilizador` (LOV `utilizadores-vw?un=`, columns Nome, Username), `Permissão` (select `TIPO_PERMISSAO`). Changing any of them reloads both lists (`por-utilizador`).
  - Left list `Sem Permissão` (Modelo); right list `Com Permissão` (Modelo, Data Inicio, Data Fim).
  - Buttons (legacy glyph labels, aria-labels NEW): `>>` `Adicionar todos`, `>` `Adicionar seleccionados`, `<` `Retirar seleccionados`, `<<` `Retirar todos` → confirm `Retirar as {n} permissões?`. The buttons are disabled until all three controls are set.
- **Modelos** tab: the mirror — `Departamento`, `Modelo` (LOV `modelos-validos`), `Permissão`; lists of `Username` (`Sem Permissão`) and `Username`, `Data Inicio`, `Data Fim` (`Com Permissão`).
- States: lists loading (skeleton 6 rows), empty `Não existem registos.`, error per §3.12. Success toast `Guardado.` after each transfer.

### 4.5 Novo backup wizard (`/gestao/backups/novo`)

Steps (WizardStepper): **1 `Criação de backups SIID`** → **2 `Documentos a salvaguardar`** (the two Forms window titles, sentence case).

```
Gestão › Backups › Novo
Novo                                                                            (1)─── Criação de backups SIID ─── (2) Documentos a salvaguardar
┌ Passo 1 de 2 ────────────────────────────────────────────────────────────┐
│ Mês          [2026-08 …]      (LOV "Meses para Backup")                  │
│ Nome         Gerado ao criar o backup.            (read-only, muted)     │
│ Destino      Gerado ao criar o backup.            (read-only, muted)     │
│ Observações  [                                                        ]  │
│              [                                                        ]  │
│                                                          [Documentos]   │
└──────────────────────────────────────────────────────────────────────────┘

┌ Passo 2 de 2 ─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Tipos Mídia [DVD4.7 …]   Gbytes 4,7                                                                           │
│ │▪│☐│Id↓    │Modelo │Referência │Impresso a │Pedido a   │Autor    │Pág.│Bytes      │                           │
│ │ │☑│498 001│R3.D27 │00012000   │02-08-2026 │01-08-2026 │MSILVA   │  2 │  182 400  │                           │
│ Registo 1 de 3 420 · 12 seleccionado(s)                                  |« ‹ Página [1] de 69 › »|         │
│ Total Bytes 612 334 100 (all candidates)      Total Backup 2 188 800 (selected)                              │
│ ┌ O tamanho do Mídia não suporta todos os documentos que seleccionou. ┐   (#50, when it applies)             │
│                                                                              [Voltar]  [Backup]              │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- Step 1: `Mês` required (LOV `meses`, display `AAAA-MM`). `Documentos` (legacy `DOCUMENTOS`) validates and goes to step 2.
- Step 2 DataBlock `candidatos?mes=`: `selection: 'multi'`, read-only. Columns from `CONTROL_BLOCK` headers (UI-11 b): `Id`, `Modelo`, `Referência` FIX, `Impresso a`, `Pedido a`, `Autor`, `Pág.`, `Bytes`. Sort on `Id`, `Data impressão`, `Bytes`.
- Header checkbox = `todos: true` (consulta mode). `Total Backup` = the sum of the ticked rows' `TAMANHO_BYTES` (the screen keeps an id → bytes map from `onSelectionChange`), or `totalBytes` in consulta mode.
- `Tipos Mídia` LOV `tipos-midia` (title `Tipos de Mídia de BACKUP`; Id, Designação, Gbytes) → `Gbytes` read-only.
- `Backup` (legacy `BACKUP >`):
  - Client checks: #49 on `Tipos Mídia`; no documents → inline alert #30; `Total Backup` > media bytes → inline alert #50.
  - Then ConfirmDialog `Criar o backup de {mês} com {n} documentos ({tamanho})?` → POST.
  - Success → toast `Backup {NOME} criado.` and the wizard resets to step 1.
  - 409 `REGISTO_ALTERADO` → toast, candidates refetch, selection cleared.
- `Voltar` (legacy `< VOLTAR`) keeps the step 1 values. No navigation guard: nothing is written until `Backup`.
- States: month list empty → step 1 empty state `Não existem registos.`; candidates empty → `A consulta não obteve documentos.`.

### 4.6 Backups Online (`/gestao/backups/online`)

```
Gestão › Backups › Backups Online
Backups Online                                                                                             [Actualizar]
Offline
│▪│☐│Nome              │Mês      │Mídia │MB        │
│ │☐│COSEC_202607_01   │2026-07  │DVD4.7│ 3 912,40 │
│ │☑│COSEC_202608_01   │2026-08  │DVD4.7│ 2 188,80 │
                               [↓ Colocar online]  [↑ Colocar offline]
Online
│▪│☐│Nome              │Mês      │Mídia │Drive │
│ │☐│COSEC_202601_01   │2026-01  │BD25  │E:\   │
```

- Two stacked DataBlocks over `backups`, fixed filters `f[MEDIA_ONLINE]=N` / `S`, `selection: 'multi'` (ids only, header checkbox hidden). Column labels verbatim from the Forms prompts (`Nome`, `Mês`, `Midia` → `Mídia` FIX, `MB`; `Drive`).
- The two Forms buttons had glyph labels (`\/`, `/\`); here they are `Colocar online` / `Colocar offline` (NEW, from the menu item name `COLOCAR_ONLINE`) with `ArrowDown` / `ArrowUp` icons.
- No selection → toast `Não existem backups seleccionados.`. Otherwise POST `online` → toast `Backups actualizados.`, both lists refetch.
- States: each list has its own empty state `Não existem registos.`.

### 4.7 Generic single-table CRUD: Impressoras (`/configuracao/impressoras`)

```
Configuração › Impressoras
Impressoras                                                                                                [Actualizar]
[Limpar filtros]                                                                               [?] [Novo] [Apagar]
┌──┬──────┬──────────────────┬────────────────────────────────────┬─────────────┬───────┬──────────────────────────────┐
│▪ │Id ↑  │Servidor          │Endereço                            │GS Device    │Válida │Descrição                     │
│  │[    ]│[                ]│[                                  ]│[           ]│[    ] │[                            ]│
│  │    12│PRTSRV01          │\\PRTSRV01\HP-LJ-4250-3P            │[pxlcolor ▾] │ ☑     │HP piso 3                     │
│+ │      │[               ]*│[                                 ]*│[pxlcolor ▾]*│ ☑     │[                            ]│
└──┴──────┴──────────────────┴────────────────────────────────────┴─────────────┴───────┴──────────────────────────────┘
│● 1 novo                                                                                           [Cancelar][Guardar]│
Registo 2 de 38                                                                  Por página [50▾]  |« ‹ Página [1] de 1 › »|
```

- `edit: 'inline'`. Columns and labels verbatim: `Id` (ro, sequence), `Servidor`, `Endereço` (required), `GS Device` (select `GSDEVICES`, default `PXLCOLOR`), `Válida` (checkbox, default `S`), `Descrição`. Default sort `to_number(ID)`.
- Insert, update and delete are allowed (XML true/true/true). The audit columns are set by hooks and not shown.
- States: §3.12; dirty bar §3.10; required cells marked `*` (aria-required).

**Screens that reuse a pattern**

| Screen | Pattern | Differences |
|---|---|---|
| Unidades Medida | 4.7 inline | `Unidade` (ID), `Nome`, `Factor` (number), `Unidade Base` (select `unidades-base`) |
| Tipos Mídia | 4.7 inline | `Id`, `Designação`, `U.M.` (select `unidades-medida?gen=DIGITAL`), `Tamanho`, `Bytes` (ro, computed, D-24), `Descrição` |
| Variáveis SIID | 4.7 inline | `Tipo` (select `TIPO_VARIAVEL`; the PASSWORD types never listed), `Valor`; #58 row error |
| Utilizadores | 4.7 grid (read-only: `Username`, `Nome`, `Tipo Utilizador`, `Unidade Negócio`, `Data Início`, `Data Fim`) + **panel** | Panel fields: `Nome`, `Username` (insertOnly, uppercase), `Password` (write-only, empty, help `Deixe em branco para manter a password actual.`; required on insert), `Ambiente` (read-only value, hook-fixed), `Data Início`, `Data Fim` (#43), `Tipo Utilizador`, `Unidade Negócio` (selects) |
| Equipa de Gestão (OD68) | 4.7 grid + **panel** (720 px) | Panel: `Utilizador` (CDEMPLEA, LOV `Empregados`), `Depart.` (ro), `Codigo` → `Código` FIX (LOV `ttapvaat-codigos`), `Perfil` (LOV `Perfis` = `funcoes-departamento`), `Nome`, `Email`, `Telefone`, `Fax`, `Telemóvel` FIX, `Data Início`, `Data Fim`, `Assinatura` (ImageField). Picking `Utilizador` calls `sugestao` and fills empty `Código`/`Perfil`/`Nome` (BR-ADM-04). `Apagar` only on unsaved rows (no DELETE route). |
| Impressoras Associadas › Documento | 4.7 read-only grid + action dialogs | Columns: `Modelo`, `Impressora` (`id - descrição - endereço`), `Início Validade`, `Fim Validade`, `Criado Por`, `Data Criação`, `Actualizado Por`, `Data Actualização`; `Todos` = clear filters. Toolbar and row menu = popup `GENERICO`: `Definir Nova Impressora` (dialog: `Modelo` LOV, `Impressora` LOV, `Início Validade`, `Fim Validade`; #51), `Alterar Validade` (dates; #51), `Anular Impressora` (#52). Help line with the D-22 printer order. ADM only (A-09). |
| Impressoras Associadas › Utilizador | same | Adds column `Utilizador` (after Modelo). Dialogs: `Definir Novo Utilizador` (`Modelo`, `Utilizador` LOV `usuarios`, `Impressora`, dates), `Alterar Validade`, `Anular Impressora` (#53), `Copiar do modelo...`, `Copiar do utilizador...` |
| Reports | Master form + detail grid, stacked, **atomic save** | Top: read-only master list (`Descrição`, `N.º Parâmetros`, `Válido`) as a 200 px grid; the current report is edited in a form below it (`Descrição`, `Nome de Ficheiro`, `Observações`, `N.º Parâmetros`, `Válido`, `Directoria Base`, `Directoria Destino`) plus a parameters grid (`Nome do Parâmetro`, `Tipo de Parâmetro`, `Obrigatório`, `Único`, `Válido`). A new report pre-fills rows `_USER`/`P_USUARIO`/`P_DATAACTUAL` (names ro). One dirty bar; Guardar = one `POST /api/reports/guardar`; errors #54–#57 mapped to rows or fields. |
| Alterar password | Single form (no DataBlock), 400 px card | `Password actual` (NEW, #15), `Nova Password`, `Confirmação` (#6); `Cancelar` / `OK` → toast `Password alterada.`, form cleared |

### 4.8 Master-detail: Domínios (`/administracao/dominios`)

```
Administração › Domínios
Domínios                                                                                                   [Actualizar]
┌ master 400 px ─────────────────────────┬─ Domínio TIPO_PERMISSAO ──────────────────────────────────────────────────────┐
│[Novo][Apagar]                          │ Id [TIPO_PERMISSAO   ]  Sistema ? ☐   Data Estado 01-01-2020                    │
│▪│Id ↑             │Descrição          │ Descrição [Tipos de permissão de impressão                    ]                │
│ │[              ] │[                 ]│ Tipo Domínio [L – Lista ▾]                                                       │
│ │MODO_EXPEDICAO   │Modo de expedição  │ [Dados] [Observações] [Lista]                                                    │
│ │▌TIPO_PERMISSAO  │Tipos de permissão │ ┌ Lista ─────────────────────────────────────────────────────────────────────┐ │
│ │UNIDADE_NEGOCIO  │Unidades de negócio│ │▪│Chave   │Designação       │Descrição          │Data Início│Data Fim │Ordem│ │
│                                        │ │ │IMP     │Impressão        │                   │01-01-2020 │         │   0 │ │
│ Registo 2 de 16                        │ │+│[     ]*│[             ]* │[                 ]│15-09-2026 │[       ]│   0 │ │
│                                        │ └─────────────────────────────────────── [Novo][Apagar] ───────────────────┘ │
├────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────┤
│● 1 alterado · 1 novo                                                                                [Cancelar][Guardar] │
```

- Side-by-side (master ≤ 4 columns, one detail; UI-18). The master grid is read-only (`Id`, `Descrição`) with `Novo` / `Apagar`. `Apagar` is immediate: destructive ConfirmDialog `Apagar o registo {Id}?` (`db.apagarConfirm`) → DELETE; 409 → toast #42.
- The right pane edits the current domain in place (panel mode, rendered inline, not a Sheet):
  - Header: `Id` (insertOnly), `Sistema ?`, `Data Estado` (ro), `Descrição`, `Tipo Domínio`.
  - Tabs `Dados` / `Observações` / `Lista` (UI-11 b):
    - `Dados`: `Tipo` (TIPO_INFORMACAO), `Default`, `Tamanho` + `,` (precision); when `TIPO_INFORMACAO_RF='STRING'`: `Tipo` (TIPO_STRING) and `Formatação String` FIX radio `Maiúsculas` / `Minúsculas` / `Misto`; when `TIPO_DOMINIO_RF='I'`: `Mínimo` FIX, `Máximo`.
    - `Observações`: textarea.
    - `Lista`: values DataBlock inline: `Chave`, `Designação`, `Descrição`, `Data Início` (default today), `Data Fim`, `Ordem` (PRIORIDADE, default 0).
  - The show/hide conditions (`ENABLE_STRINGS`, `ENABLE_VALORES`, BR-ADM-01) are copied from `FD_DOMINIOS_SIID_fmb.xml` by the building step.
- One page dirty bar: order per §3.10 (values deletes → domain update/insert → values updates → values inserts). A new domain → `Lista` `Novo` disabled with `Guarde o registo principal antes de adicionar detalhes.`.
- Changing the master row while dirty → #46.
- States: no domain selected → right pane `Seleccione um registo.`; §3.12 for both grids.

---

## 5. Accessibility (WCAG 2.2 AA)

| Topic | Rule |
|---|---|
| Contrast | §1.4, all pairs pass in both themes. |
| Language | `<html lang="pt-PT">`. Codes stay in their original form. |
| Grid role | `role="grid"` (UI-08), `aria-labelledby` = page h1 or `heading`, `aria-multiselectable="true"` when `selection: 'multi'`, `aria-readonly="true"` when `edit: 'none'`. |
| Row counts | `aria-rowcount` = `total + 2` (header row + filter row); `-1` when `totalCapped`. Each body row has `aria-rowindex = offset + i + 3`; header rows 1 and 2. `aria-colcount` on the grid, `aria-colindex` on cells. |
| Sort | `aria-sort="ascending|descending"` on the first sort key's `columnheader` only; others `none` if sortable. |
| Selection | `aria-selected` on rows. The row checkbox has aria-label `Seleccionar registo`; the header checkbox `Seleccionar todos` (`aria-checked="mixed"` when indeterminate). In consulta mode row checkboxes are `aria-disabled="true"` and the banner is `role="status"`. |
| Focus in grid | Roving tabindex: exactly one cell has `tabIndex=0`. Tab leaves the grid (to the dirty bar, then the footer). The focused cell shows the 2 px inset ring. Editors live inside the `gridcell`. |
| Row state | The gutter icon has `role="img"` + `aria-label` (`Novo`, `Alterado`, `Apagado`, `A guardar`, `Erro`, `Bloqueado`, `Offline`, `Anulado`). The row error line id is in the row's `aria-describedby`. Cells with errors are `aria-invalid="true"`. |
| Live regions | Counter total changes → polite. Dirty bar error → `role="alert"` (once per Guardar run). Consulta banner → `role="status"`. Loading → `aria-busy` on the grid. |
| Dialogs | Radix Dialog / AlertDialog: focus trap, focus returns to the trigger, `aria-labelledby` = title, `aria-describedby` = body text. AlertDialog initial focus per §2.3. No dialog closes on outside click when it holds a dirty form. |
| Sheets | Same as dialogs; title = block label + key. |
| Toasts | sonner region `aria-label="Notificações"` (polite). Error toasts are never the only place a blocking error appears (forms show it inline too). Errors persist (UI-26). |
| Menus | Radix DropdownMenu / ContextMenu (`role="menu"`, arrow keys, typeahead). Every row-context-menu action is also reachable from a toolbar button or a key. |
| Tabs | Radix Tabs (`tablist`, `tab`, `tabpanel`), arrow keys. |
| Forms | Visible labels always (no placeholder-only). Required: `*` after the label + `aria-required`. Errors: `aria-invalid` + `aria-describedby`; focus moves to the first invalid field on submit. |
| Focus ring | 2 px solid `--ring`, offset 2 px (grid cells −2 px), via `:focus-visible`. Never removed; shadcn `ring/50` classes are replaced (OP-5). |
| Target size | Minimum 24 × 24 (2.5.8): buttons 28/32, checkboxes 16 inside a 28 px cell hit area, icon buttons 28. |
| Route change | Focus the h1 (`tabIndex=-1`); `document.title` updates. |
| Reduced motion | §1.1 motion; media query in §1.2. |
| Colour not the only cue | Status badges have text; offline/anulado and row states have gutter icons; sort has arrows + `aria-sort`; pending filters have a dashed border + counter text. |
| Zoom | 200 % zoom keeps function. Grids scroll horizontally (data tables are exempt from 1.4.10 reflow); the shell switches to the Sheet menu. |
| Keyboard | §3.14; no keyboard trap outside modal dialogs; the skip link is first. |

---

## 6. Component inventory

### 6.1 shadcn primitives (`app/apps/web/src/components/ui/`, `npx shadcn@4.21 add <id>`)

| Need | shadcn id | File | Notes |
|---|---|---|---|
| Buttons | `button` | `ui/button.tsx` | Variants: `default` (primary), `secondary`, `outline`, `ghost`, `destructive`, `link`. Sizes `sm` 28, `default` 32, `icon` 28. |
| Inputs | `input`, `textarea`, `label` | `ui/input.tsx`, `ui/textarea.tsx`, `ui/label.tsx` | Filter inputs use `h-7` (28). |
| Field layout / errors | `field` | `ui/field.tsx` | Label, description, error slot. |
| Checkbox, radio, switch | `checkbox`, `radio-group`, `switch` | `ui/checkbox.tsx`, … | |
| Select (domain values) | `select` | `ui/select.tsx` | |
| Presets | `toggle-group`, `toggle` | `ui/toggle-group.tsx` | |
| Tabs | `tabs` | `ui/tabs.tsx` | |
| Dialogs | `dialog`, `alert-dialog`, `sheet` | `ui/dialog.tsx`, `ui/alert-dialog.tsx`, `ui/sheet.tsx` | Overlay class `bg-overlay`. |
| Menus | `dropdown-menu`, `context-menu` | `ui/dropdown-menu.tsx`, `ui/context-menu.tsx` | |
| LOV search | `command`, `popover` | `ui/command.tsx`, `ui/popover.tsx` | `cmdk`. |
| Tooltip | `tooltip` | `ui/tooltip.tsx` | 500 ms delay. |
| Toasts | `sonner` | `ui/sonner.tsx` | Remove the `next-themes` import; pass `theme` from the html class. |
| Shell | `sidebar`, `breadcrumb`, `separator`, `scroll-area`, `collapsible` | `ui/sidebar.tsx`, … | Set `SIDEBAR_KEYBOARD_SHORTCUT` to none (Ctrl+B = Firefox bookmarks); width constants 240 / 48. |
| Splitter | `resizable` | `ui/resizable.tsx` | `react-resizable-panels`; keyboard-resizable separator. |
| Badge base | `badge` | `ui/badge.tsx` | Base for StatusBadge / EnvironmentBadge. |
| Loading / empty | `skeleton`, `spinner`, `empty` | `ui/skeleton.tsx`, `ui/spinner.tsx`, `ui/empty.tsx` | |
| Inline alerts | `alert` | `ui/alert.tsx` | `destructive` and default variants. |
| Key hints | `kbd` | `ui/kbd.tsx` | `Ctrl S` in the dirty bar; help popover. |

Not used: `table` (DataBlock renders its own grid markup), `calendar` / `date-picker` (UI-09), `pagination` (DataBlock footer), `form` (react-hook-form used directly with `field`).

### 6.2 Custom components

| Component | File(s) | Spec |
|---|---|---|
| **DataBlock** | `components/datablock/DataBlock.tsx`, `Toolbar.tsx`, `HeaderCell.tsx`, `FilterRow.tsx`, `Row.tsx`, `RowGutter.tsx`, `CellEditor.tsx`, `DirtyBar.tsx`, `Footer.tsx`, `SelectionBanner.tsx`, `useDataBlockQuery.ts`, `useDirtyRows.ts`, `useGridKeyboard.ts`, `qbe.ts` (filter text ↔ params, pure), `format.ts` (UI-10), `DataBlock.test.tsx`, `qbe.test.ts` | §3 in full. `qbe.ts` and `useDirtyRows.ts` (save order, stop at first error) get unit tests; a keyboard map test runs on `/dev/datablock`. |
| **ConfirmDialog** | `components/dialogs/ConfirmDialog.tsx` | `confirm({ title?, text: string \| string[], destructive?, extra?: ReactNode }) → Promise<boolean>`. Buttons `Sim` / `Não`. |
| **AskCommitDialog** | `components/dialogs/AskCommitDialog.tsx` | #46; returns `'sim' \| 'nao' \| 'cancelar'`. |
| **ResultListDialog** | `components/dialogs/ResultListDialog.tsx` | `{ title, groups: { text, ids: number[] }[] }`; mono list, `Copiar` (copies ids joined by `, `), `OK`. |
| **SessionExpiredDialog** | `components/dialogs/SessionExpiredDialog.tsx` | UI-27, §2.5. |
| **LovDialog / LovField** | `components/dialogs/LovDialog.tsx`, `components/LovField.tsx` | §6.6. |
| **StatusBadge** | `components/StatusBadge.tsx` | §6.3. |
| **EnvironmentBadge** | `components/EnvironmentBadge.tsx` | §6.4. |
| **DateInput / DateRangeFilter** | `components/DateInput.tsx`, `components/datablock/DateRangeFilter.tsx` | §6.5. |
| **WizardStepper** | `components/WizardStepper.tsx` | §6.7. |
| **TransferList** | `components/TransferList.tsx` | §6.8. |
| **ImageField** | `components/ImageField.tsx` | Preview (object-fit contain, 240 × 120 on a checkerboard `bg-muted`), type label, file input button, upload button, remove (confirm), 413/415 field errors. Used in Secções and Equipa de Gestão. |
| **PageHeader, TopBar, NavMenu, Breadcrumbs** | `components/shell/*.tsx`, used by `routes/_app.tsx` | §2.1. `components/shell/` and the root component files extend the ARCHITECTURE §9 folder list; they do not replace it. |

### 6.3 StatusBadge

`<StatusBadge value={string | null} domain="documento" | "fila" />`: 20 px, `rounded-sm`, 12/600, text = raw value verbatim; null in `documento` → `—` muted with sr text `Não executado`.

Tone resolution: (1) exact table, (2) first-word rule, (3) neutral.

| Domain | Tone | Exact values (from `SVR_DOCUMENTOS_VW` / `SVR_QUEUE.ESTADO`) |
|---|---|---|
| documento | pending | `WAIT`, `EXECUCAO`, `WAIT REENV`, `WAIT 2.VIA`, `WAIT EMAIL`, `WAIT ENVIO`, `WAIT COPIA`, `WAIT IMP`, `WAIT XML`, `WAIT ARQUIVO`, `REENVIO`, `2.VIA`, `EMAIL`, `ENVIO`, `COPIA`, `IMPRESSAO`, `Preparar XML`, `ARQUIVO` |
| documento | running | `A EXECUTAR`, `A REENVIAR`, `A IMPRIMIR`, `SENDING`, `A ENVIAR`, `A COPIAR`, `A criar XML`, `A ARQUIVAR` |
| documento | success | `GERADO`, `REENVIADO`, `IMPRESSO`, `EMAIL SENT`, `ENVIADO`, `COPIADO`, `XML CRIADO`, `ARQUIVADO` |
| documento | danger | `ERRO` |
| fila | pending | `ESPERA`, `ENQUEUED` |
| fila | running | `EXECUCAO`, `EM EXECUCAO` |
| fila | success | `TERMINADO` |
| fila | danger | `ERRO` |
| fila | neutral | `CANCELLED`, `SUSPENSO` |
| both | first-word rule (composite `<ESTADO> <TIPO>`) | `ESPERA`/`ENQUEUED`/`ENQUEED` → pending · `EXECUCAO`/`EM` → running · `TERMINADO` → success · `ERRO` → danger · `CANCELLED`/`SUSPENSO` → neutral |
| Disponibilidade | offline / anulado / neutral | `OFF` → offline, text `Offline` · `ANU` → anulado, text `Anulado` · `EDC` → neutral `EDC` · `ONL`/`ONLINE` → no badge, plain text |

Note: document `EXECUCAO` means enqueued (pending) and document `A EXECUTAR` means executing (running), per the D-16 view mapping. The queue domain uses the raw states.

### 6.4 EnvironmentBadge

`<EnvironmentBadge ambiente={string | undefined} />`. `ambiente.includes('TESTE')` → `bg-env-test-bg text-env-test-fg` (solid); else `bg-env-prod-bg text-env-prod-fg border border-env-prod-border`. Text = `ambiente` verbatim, mono 12/600, 20 px, `rounded-sm`, `title="Ambiente"`. Undefined → renders nothing.

### 6.5 DateInput and DateRangeFilter

- `DateInput`: text input, `inputMode="numeric"`, mask `DD-MM-AAAA`. Hyphens are inserted as the user types; `DDMMAAAA` and `D-M-AAAA` are accepted and normalised on blur. Invalid → `Data inválida. Use DD-MM-AAAA.`. Value out: `YYYY-MM-DD` (+ `T00:00:00` when sent to the API, ARCHITECTURE §3). Placeholder `DD-MM-AAAA`.
- `DateRangeFilter` (filter row): one 28 px input accepting the §3.3 syntax, plus a `CalendarRange` icon button (aria-label `Intervalo de datas`, NEW) / Alt+ArrowDown opening a Popover with two DateInputs `De` / `Até` (NEW) and `Aplicar` (NEW) — Enter applies and executes.

### 6.6 LOV picker (replaces Forms LOVs)

- **LovField**: input (typed key) + `…` icon button (aria-label `Abrir lista`). Alt+ArrowDown, F9 or the button opens LovDialog pre-filtered with the typed text.
- On blur, a typed value is matched case-insensitively against the key column of the loaded list: a match is accepted (and fills linked fields, e.g. `Depart.`); no match → field error `Valor não existe na tabela de referência.`.
- **LovDialog** (md 560): title = LOV title (below) or the field label. `Command` search input (placeholder `Procurar`); a table of options (header row, first column mono); client-side filter over all columns, case- and accent-insensitive. ArrowUp/Down moves, Enter selects, closes and returns focus to the field; Esc closes without change. More than 500 matches → only the first 500 are rendered, with the note `Mais de 500 resultados. Refine a pesquisa.`.
- Data: `GET /api/lov/:name` (query key `['lov', name, params]`, `staleTime: 60_000`, loaded when the dialog first opens or the field blurs).

| Screen | Field | LOV name (API) | Dialog title (legacy) | Columns |
|---|---|---|---|---|
| Documentos › Reimprimir/2ª Via/Cópia | Outra impressora | `impressoras-validas` | `Impressoras` | Id, Descrição, Endereço |
| Documentos › Procurar por parâmetros | Procurar apenas no modelo | `modelos` | (field label) | Id |
| Impressoras Associadas › Documento | Modelo · Impressora | `modelos` · `impressoras-validas` | — · `Impressoras` | Id · Id, Descrição, Endereço |
| Impressoras Associadas › Utilizador | Modelo · Utilizador · Impressora · Copiar do modelo · Copiar do utilizador | `modelos` · `usuarios` · `impressoras-validas` · `modelos` · `usuarios` | — · — · `Impressoras` | Id · CDIDUSR · Id, Descrição, Endereço |
| Permissões › Geral dialogs | Modelo · Utilizador · Copiar do modelo · Copiar do utilizador | `modelos-validos` · `utilizadores-vw` | — | Id · CDEMPLEA, Depart., CODIGO |
| Permissões › Utilizador / Modelos | Utilizador · Modelo | `utilizadores-vw?un=` · `modelos-validos` | `Utilizadores` · `Modelos` | Nome, Username · Id |
| Novo backup | Mês · Tipos Mídia | `/api/backups/meses` · `tipos-midia` | `Meses para Backup` · `Tipos de Mídia de BACKUP` | Mês · Id, Designação, Gbytes |
| Equipa de Gestão (OD68) | Utilizador · Código · Perfil | `empregados` · `ttapvaat-codigos` · `funcoes-departamento` | `Empregados` · — · `Perfis` | Cdemplea, Cddeparta · Código · Função, Id |

Selects (not LOV): every `CFG_VALORES_DOMINIO` list via `GET /api/dominios/:id/valores` (`GSDEVICES`, `TIPO_UTILIZADOR`, `UNIDADE_NEGOCIO`, `TIPO_PERMISSAO`, `TIPO_VARIAVEL`, `TIPO_PARAMETRO`, `MODO_EXPEDICAO`, `MODO_CERTIFICADO`, `MODO_PROTECAO`, `BINARIO`, `CODIGOS BARRAS`, `TIPO_INFORMACAO`, `TIPO_DOMINIO`, `TIPO_STRING`, `FORMATACAO_STRING`) and the lookups `modelos-genericos`, `tipos-conteudo`, `contextos-apr` (honour `preSelected`), `unidades-medida?gen=`, `unidades-base`. Display `DESIGNACAO`, store `CHAVE`.

### 6.7 WizardStepper

`<WizardStepper steps={[{ id, label }]} current={index} onBack? />`: `<ol aria-label="Passos">` (`wiz.passos`, NEW) horizontal. Each step: a 20 px circle (number 12/600; current `bg-primary text-primary-foreground`; done `Check` icon on `bg-secondary`; future `border-input`) + label 13 px; a 1 px connector `--border`. The current step has `aria-current="step"`. Completed steps are buttons (go back); future steps are not interactive. The step panel heading is `Passo n de N` (`wiz.passo`).

### 6.8 TransferList (Permissões)

`<TransferList left={{ title: 'Sem Permissão', columns, rows }} right={{ title: 'Com Permissão', columns, rows }} onAdd(ids|'todos') onRemove(ids|'todos') disabled />`:
- Each side is a 320 px-tall bordered list with a sticky header; rows 28 px with a checkbox, `role="listbox" aria-multiselectable="true"`, rows `role="option" aria-selected`.
- Keys: ArrowUp/Down, Space toggles, Shift+Arrow extends, Enter = `>` (left) / `<` (right).
- Between the lists sits a vertical button stack (`>>`, `>`, `<`, `<<`; 28 × 40, aria-labels from §2.8). Each list has a count below it (`db.registos`).
