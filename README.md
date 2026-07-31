# 

# Cartografía de la Memoria Antirracista (Anti-Racist Memory Mapping)

📌 **CS50 Web Programming Capstone Project**

## 📖 Overview

Cartografía de la Memoria Antirracista is an interactive, collaborative mapping platform designed to document, geographically track, and preserve the memory of systemic and structural racism, and hate crimes, in Argentina.

The goal of this platform is to visualize historical and contemporary incidents, turning raw data into an educational and activist tool. To ensure the integrity, respect, and journalistic accuracy of the data, the platform uses a crowd-sourced submission model paired with a strict administrative moderation queue before any marker is published publicly.

---

## Distinctiveness and Complexity

This project is distinct from every other project assigned in this course, and from the standard CS50W problem sets, for the following reasons:

**It is not a CRUD clone of a course project.** It is not a social network (Project 4), not a commerce/auction site (Project 2), not a mail client (Project 3), and not a wiki (Project 1). Its core interaction model — a geospatial, map-first interface where the primary unit of content is a *location* rather than a post, listing, or page — has no equivalent among the assigned projects.

**Geospatial complexity.** The application integrates Leaflet.js as a genuine second client-side rendering engine running alongside the DOM, not just an embedded iframe or static image. Every marker on the map is generated dynamically from a Django JSON payload, projected onto a coordinate system, and made interactive (click-to-open-sidebar) without a page reload. This required solving problems not covered anywhere in the course: reconciling Leaflet's internal event system (`click`, `preclick`, DOM `pointerdown`/`pointerup` under touch-emulation) with a custom moderation-and-collaboration workflow, and preventing marker clicks from bubbling into map clicks (and vice versa). The final submission flow is intentionally sequenced in two steps — open the contribution form, then click the map to set the incident's coordinates — which resolves the ambiguity between "browsing an existing pin" and "placing a new one" on the same click surface. The map's default tile provider was also replaced with Argentina's official IGN (Instituto Geográfico Nacional) WMTS/TMS service, so that the map's toponymy — including the Islas Malvinas — reflects Argentina's own cartographic standard rather than a third-party default.

**A real content moderation pipeline.** Unlike course projects where any authenticated user's content is immediately public, this application implements a three-state workflow (`pending → approved / rejected`) enforced at the model and queryset level. Public map queries are filtered server-side to `status='approved'` only; nothing a user submits is visible to anyone else until an admin acts on it. This mirrors how real collaborative journalism/archival platforms (e.g. Ushahidi, HURIDOCS) operate, and required custom Django admin actions (bulk approve/reject) beyond what `admin.site.register()` provides out of the box.

**A relational data model beyond a single table.** The data layer is not one flat model. It is five interrelated models — `Category`, `HistoricalPeriod`, `Incident`, `IncidentSource`, and `IncidentImage` — connected through foreign keys with deliberate `on_delete` strategies (`PROTECT` for categories so historical data can never be silently orphaned; `SET_NULL` for the submitting user so an account deletion never erases the historical record itself). Each incident can carry multiple journalistic sources and multiple images, modeled as their own related tables rather than crammed into a single text field.

**Full bilingual support (ES/EN), implemented from scratch.** Rather than using a translation library, the interface implements its own lightweight i18n system: a `STRINGS` dictionary keyed by language, and a `data-i18n` / `data-i18n-placeholder` attribute convention that lets any DOM element declare its own translation key. Switching language re-renders the *entire* interface — including a currently open incident detail panel — without a page reload.

**Client-side filtering engine operating on server-rendered data.** The map supports simultaneous, composable filters — free-text search, multi-select category toggles, and a year-range slider — all applied in a single pass over the incident dataset injected from Django via `json_script`, with no additional network requests. This is meaningfully more complex than a single Django `GET` query-string filter, since all four filter dimensions must be reconciled together in the browser in real time as the user interacts with any one of them.

**A genuinely three-pane, non-trivial responsive layout.** The interface is a CSS Grid application shell (filters sidebar / map / detail sidebar) with the *map itself as the primary flex/grid item* whose size must be recalculated (`map.invalidateSize()`) every time either sidebar's width changes — a class of layout bug that does not arise in a normal single-column blog/feed-style Bootstrap layout.

---

## Key Features

- **Interactive Geolocation** — Users open the contribution form via "+ Contribute an incident," then click directly on the map to pin the exact location where an incident occurred.
- **Structured Data Collection** — Mandatory fields (title, description, date, category, location, at least one journalistic source) are enforced both client-side (HTML5 `required`) and server-side (Django model constraints), so the dataset stays consistent and analyzable.
- **Advanced Filtering & Search** — Users can filter the map dynamically by category, by a custom timeframe (year-range slider), by free-text search, and by verification status — in any combination.
- **Admin Verification Pipeline** — A secure Django admin dashboard lets administrators review, fact-check, and approve or reject pending submissions with one click (bulk actions), before they ever reach the public map.
- **Source Transparency** — Every published incident links out to the journalistic or institutional sources that verify it.
- **Responsive Three-Pane UI:**
    1. **The Interactive Map** — the central focal point, displaying only verified, approved incidents.
    2. **Search & Filter Sidebar** (left) — query and narrow down what the map displays.
    3. **Information Display Sidebar** (right) — dynamically populates with full incident detail (image, sources, tags, verification badge) the instant a pin is clicked, with no page reload.
- **Bilingual Interface** — Full Spanish/English toggle across every label, placeholder, and dynamically rendered piece of content.

---

## 💻 Tech Stack & Architecture

- **Frontend:** JavaScript (ES6+), HTML5, CSS3 (Flexbox/Grid for the 3-pane layout)
- **Mapping:** Leaflet.js, tiles served by Argentina's Instituto Geográfico Nacional (IGN) TMS service
- **Backend:** Python 3.12 / Django (handles moderation logic, form submission, and the JSON data endpoint consumed by the map)
- **Database:** SQLite (development) — swappable to PostgreSQL for production
- **Data interchange:** Django's `json_script` template filter, used to safely inject server-rendered incident data into the client without a separate REST API layer

---

## 📁 What's Contained in Each File

### `memory_map/models.py`

Defines the five core data models:

- **`Category`** — thematic classification (e.g. Police violence, Hate crime), with a bilingual label and a hex color used consistently for map pins, UI pills, and badges.
- **`HistoricalPeriod`** — optional secondary time classification (e.g. "Military dictatorship") independent of the raw year slider.
- **`Incident`** — the core record: bilingual title/description, coordinates, date, category (FK), moderation `status` (`pending`/`approved`/`rejected`), and contributor metadata. Includes `year` and `is_approved` convenience properties.
- **`IncidentSource`** — one-to-many journalistic sources per incident.
- **`IncidentImage`** — one-to-many images per incident, ordered so the first (`order=0`) acts as the cover image.

### `memory_map/admin.py`

Registers all models with the Django admin. `IncidentAdmin` adds `list_display`, `list_filter` (by status/category), `search_fields`, and two custom bulk actions — `make_approved` and `make_rejected` — that update `status` on the selected queryset in one click, implementing the moderation pipeline.

### `memory_map/views.py`

- **`index(request)`** — queries only `status='approved'` incidents, serializes them (including nested sources and cover image URL) into a plain Python list, and passes it to the template for `json_script` injection.
- **`contribute(request)`** — handles the collaboration form's `POST`, creates a new `Incident` with `status=Incident.PENDING`, its related `IncidentSource`, and an optional `IncidentImage`, then returns a JSON response consumed by the frontend's `fetch()` call.

### `memory_map/urls.py`

Routes `/` to `index` and `/contribute/` to `contribute`.

### `memory_map/templates/memory_map/base.html`

Shared page shell (`<head>`, static asset loading, block structure) extended by `index.html`.

### `memory_map/templates/memory_map/index.html`

The main application template. Contains the three-pane layout markup, the collaboration modal/form, the `{{ incidents|json_script:"incidents-data" }}` data bridge from Django to JavaScript, the `CATEGORIES` constant, the bilingual `STRINGS` dictionary, and the i18n/filter/UI logic that doesn't belong in the map-rendering script.

### `memory_map/static/memory_map/index.js`

All Leaflet-specific logic: map initialization (pointed at the IGN tile service), marker rendering (`displayMarkers`) with category-color icons, the click handlers that open the incident detail sidebar (`openDetail`) versus the ones that start a new incident submission, and the `submitForm` function that sends the collaboration form via `fetch()` to `/contribute/`.

### `memory_map/static/memory_map/style.css`

All layout and component styling for the three-pane grid, category pills, sidebars, modal, and map markers.

---

## How to Run the Application

**Requirements:** Python 3.12 or higher. Docker is optional.

### Option A — Run locally without Docker

```bash
./run.sh
```

This script creates/reuses the `venv/`, installs missing dependencies, applies migrations, and starts the development server at **http://localhost:8000**.

If you'd rather run each step manually:

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Option B — Run with Docker

```bash
docker compose up
```

The app becomes available at **http://localhost:8000**. The database (`db.sqlite3`) and uploaded files (`media/`) are persisted in host volumes, so they survive recreating the container.

- Stop: `Ctrl+C`
- Run in the background: `docker compose up -d`

### Running tests

```bash
source venv/bin/activate      # if not already active
python manage.py test
```

### Main routes

- **`/`** — the public map, showing only approved incidents
- **`/contribute/`** — the contribution form; submissions are created with `status='pending'`
- **`/admin/`** — the moderation dashboard (requires a superuser account)

**To test the full workflow:** submit an incident via the "+ Contribute an incident" button on the map, then log into `/admin/`, find it under Incidents with status "Pending review," and use the "Mark selected incidents as approved" action. Reload the map — the pin will now appear.

---

## Additional Information for Course Staff

- **Data integrity by design:** the public-facing map query (`Incident.objects.filter(status='approved')`) is the *only* way incidents reach the frontend. There is no code path in which an unapproved submission becomes visible on the map, by construction rather than by convention.
- **Map tiles and sovereignty:** the base map layer intentionally uses Argentina's official IGN cartography service rather than a generic third-party tile provider, so that place names (including contested territories) reflect Argentina's own official toponymy, consistent with Ley 22.963.
- **Sample data:** a handful of real, sourced historical incidents (e.g. the 2006 Luis Viale workshop fire, the case of Marcelina Meneses) are seeded via the Django admin to demonstrate the platform with meaningful content rather than placeholder text.
- **Two-step contribution flow by design:** to avoid ambiguity between "browsing the map" and "placing a new incident" — two actions that would otherwise compete for the same click event on the map — submission is intentionally a two-step flow: the user first clicks "+ Contribute an incident" to open the form, then clicks the exact location on the map to set that incident's coordinates. This sequencing choice also resolves a real Leaflet edge case, where a single click handler cannot reliably distinguish "click to add a pin" from "click to open an existing marker's detail" on trackpad/touch-emulated browsers.
