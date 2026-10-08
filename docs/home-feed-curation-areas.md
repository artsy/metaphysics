# Home Feed — Curation Area rail mappings

Working reference for the home-feed-simplification "Curation Area" section
(`HomeViewSectionCurationArea`): which **existing** home-view rails each curation
area maps to. A curation area = one **lead rail** (shown inline) + **entry chips**
to other rails it consolidates.

Status: first-pass. Three mappings are obvious; "Collections" and thumbnails are
open (see below).

---

## Curation Area #1 — "Chosen by our curators"

JTBD: _Discover when I don't know what I'm looking for_ → one entry point that
absorbs four rails doing variations of the same job (human-curated + personalized
discovery). Figma: "Lead item with additional entry chips."

| Area label          | Role          | Existing section (id)                       | Section type              | Current title                   | Mapping confidence |
| ------------------- | ------------- | ------------------------------------------- | ------------------------- | ------------------------------- | ------------------ |
| Curators' Picks     | **lead rail** | `home-view-section-curators-picks-emerging` | `HomeViewSectionArtworks` | (CMS-driven, "Curators' Picks") | ✅ Obvious         |
| Recommended Artists | chip          | `home-view-section-recommended-artists`     | `HomeViewSectionArtists`  | "Recommended Artists"           | ✅ Obvious         |
| Trending Artists    | chip          | `home-view-section-trending-artists`        | `HomeViewSectionArtists`  | "Trending Artists"              | ✅ Obvious         |
| Collections         | chip          | **ambiguous — see below**                   | —                         | —                               | ⚠️ Undecided       |

This matches what's built in `src/schema/v2/homeView/sections/CurationArea.ts`
today (lead = Curators' Picks; chips = Recommended Artists, Trending Artists,
Collections), except the Collections chip currently points at a placeholder
`/collections` href.

---

## The "Collections" problem

There is **no existing home-view section literally called "Collections."** The
candidates, none a clean fit:

| Candidate section (id)                     | Type                                        | What it actually is                                                                                                           | Why it's not a clean fit                                                                                                                                        |
| ------------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `home-view-section-discover-something-new` | `HomeViewSectionCards` (renders as "Chips") | A fixed list of 12 **marketing collections** (`most-loved`, `icons`, `best-bids`, …) as cards linking to `/collection/<slug>` | Closest to "Collections" (real marketing collections), **but** it's version-capped `maximumEigenVersion: 8.77.0` — i.e. already being retired on newer clients. |
| `home-view-section-explore-by-category`    | `HomeViewSectionCards`                      | Browse **taxonomy** categories (Medium, Movement, Size, Color, Price, Gallery)                                                | This is "browse by category," not "collections." Also `maximumEigenVersion: 8.77.0` (retiring).                                                                 |
| _(none)_                                   | `HomeViewSectionMarketingCollections`       | A dedicated marketing-collections rail **type exists** in `sectionTypes/` but **no section instance uses it** today           | Would be a net-new rail to instantiate.                                                                                                                         |

**Implication:** "Collections" in the JTBD doesn't map to a live, non-deprecated
rail. Options, needs product/design input:

1. **Point the chip at the collections hub route** (`/collection` or a collections
   landing page) — simplest; the chip is a pure deep-link, not a consolidated rail.
   (This is effectively the current placeholder, pending the real route.)
2. **Resurrect marketing collections as a rail** (instantiate `HomeViewSectionMarketingCollections`
   or lean on `DiscoverSomethingNew`'s slug list) and point the chip at it via the
   section-screen route — but `DiscoverSomethingNew` is being retired, so this likely
   means a new/renamed section.
3. **Drop "Collections"** from this curation area if it's not a distinct destination.

**Recommendation:** confirm with design/product whether "Collections" means
_marketing collections_ (→ needs a real rail or the hub route) vs _browse by
category_. Until then the chip stays a deep-link to the collections landing route.

---

## Thumbnails — where do chip images come from?

Short answer: **not obvious, and not free from the existing rails.** Each target
is a _collection of items_, and none exposes a single canonical "rail thumbnail":

| Target                 | Image available today?                                                                           | Candidate thumbnail source                     |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Curators' Picks (lead) | Yes — `component.backgroundImageURL` (siteHeroUnit CMS)                                          | n/a (it's the lead, not a chip)                |
| Recommended Artists    | No section-level image; each **artist** has an image                                             | derive from first artist, or curated asset     |
| Trending Artists       | No section-level image; each **artist** has an image                                             | derive from first artist, or curated asset     |
| Collections            | If `DiscoverSomethingNew`: each card has `imageURL` (collection thumbnail); no single rail image | derive from first collection, or curated asset |

So the chip thumbnail must be **decided**, three options:

- **(A) Curated static asset per chip** — design ships a thumbnail per curation
  area. Most control, matches the Figma mocks (which show specific imagery).
  Means MP serves a static/CMS image URL per chip. **Recommended.**
- **(B) Derived from the target rail's first item** — dynamic (first artist's
  image, first collection's thumbnail). No design asset needed, but visually
  unpredictable and adds a per-chip resolve (watch N+1 — would need batching).
- **(C) No image** — label-only chips. Simplest; the Eigen component already
  degrades to label-only when `imageURL` is absent.

**Recommendation:** go with (A) — a curated image per chip, sourced from design
(static URL or a small CMS/siteHeroUnit-style lookup), since the mocks imply
intentional imagery and (B) risks ugly/mismatched thumbnails and a fan-out.

---

## Open decisions (owner: product/design + MP)

> Tracked in detail (incl. the thumbnail-modeling idea) in
> [home-feed-curation-areas-open-questions.md](./home-feed-curation-areas-open-questions.md).

1. **"Collections" target** — marketing collections rail vs category browse vs
   hub deep-link. Drives the chip's `href`/target.
2. **Thumbnail source** — curated static (A, recommended) vs derived (B) vs none (C).
3. **`DiscoverSomethingNew` / `ExploreByCategory` deprecation** — both are
   version-capped at 8.77.0; confirm whether the curation area supersedes them.
4. **Chip set per area** — is it exactly these three, or does the area also absorb
   e.g. `RecommendedArtworks` ("We Think You'll Love")?

## Reference

- Section definition: `src/schema/v2/homeView/sections/CurationArea.ts`
- Section type: `src/schema/v2/homeView/sectionTypes/CurationArea.ts`
- Lead/chip targets: `sections/CuratorsPicksEmerging.ts`, `sections/RecommendedArtists.ts`, `sections/TrendingArtists.ts`, `sections/DiscoverSomethingNew.ts`, `sections/ExploreByCategory.ts`
