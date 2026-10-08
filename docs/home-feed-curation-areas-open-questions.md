# Home Feed — Curation Area open questions

Parking lot for unresolved design/modeling questions on the "Curation Area"
section (`HomeViewSectionCurationArea`). Companion to the rail mapping in
[home-feed-curation-areas.md](./home-feed-curation-areas.md). Nothing here is
decided — these are tracked so we can punt without losing them.

---

## Q1. How are chip thumbnails modeled? (the interesting one)

**Idea on the table:** a chip thumbnail (`imageURL` / a `backgroundImageURL`-style
field) that is **lazily calculated, materialized/refreshed at "set update time,"
and overridable** — rather than computed per home-feed request.

**Why it's appealing:** it combines the two options from the mapping doc without
their downsides — a curated override when we want control, a sensible derived
default otherwise, and no per-request fan-out (the earlier N+1 concern) because
the value is precomputed/cached, not resolved live for every chip on every feed.

**Precedent that already does most of this:** `CuratorsPicksEmerging` sources its
`title`/`description`/`backgroundImageURL` from
`context.siteHeroUnitLoader("curators-picks-emerging-app")` — a **CMS-managed
hero unit**, keyed by slug, edited by the content team, fetched through a cached
loader and exposed as a lazily-resolved (`MaybeResolved`) component field. See
`src/schema/v2/homeView/sections/CuratorsPicksEmerging.ts:12-37`. That is already
"editable + overridable + lazy + cached," just for the lead rail's background.

**Shape of the idea, concretely:**

- Precedence: **override (curated/CMS) → derived default → none** (label-only).
- The override lives in an editable entity (a siteHeroUnit slug per curation area?
  a Gravity **Set**? the content team's existing hero-unit tooling?).
- The derived default would come from the target rail's content (first/representative
  item image), computed **once at update time**, not per request.

**Sub-questions to resolve later:**

1. **What entity backs the image + override?** Reuse the siteHeroUnit/CMS hero-unit
   pattern (slug per curation area/chip)? A Gravity Set? Something new?
2. **What is "set update time" / what invalidates the cache?** A Gravity Set/hero-unit
   edit webhook? A cron re-materialization? A loader TTL? (siteHeroUnit today is just
   loader-cached per request lifecycle — "materialize on set change" would be new.)
3. **Per-chip or per-area?** Is the editable image attached to each chip (→ target
   rail), or to the curation area as a whole?
4. **Who computes the derived default,** and where does it live so reads stay O(1)
   (precomputed field vs memcached vs stored on the Set)?
5. Does this generalize beyond chips — i.e. should _any_ section's thumbnail/background
   use the same "override-or-derive, materialized" mechanism?

**Status:** open / punted. Leaning toward reusing the siteHeroUnit (CMS hero-unit)
pattern for the override, since it already exists and is content-editable; the
"derived default, materialized at update time" piece is the net-new part to design.

---

## Q2. What does the "Collections" chip point at?

See [home-feed-curation-areas.md](./home-feed-curation-areas.md#the-collections-problem).
No live, non-deprecated "Collections" rail exists. Marketing-collections rail vs
category-browse vs hub deep-link — needs product/design. Chip is a placeholder
`/collections` href until resolved.

## Q3. Chip set for curation area #1

Is it exactly Curators' Picks (lead) + Recommended Artists + Trending Artists +
Collections, or does it also absorb `RecommendedArtworks` ("We Think You'll Love")
and/or other discovery rails? The JTBD named four, but the overlapping
discovery-artworks rail is a candidate. Needs product.

## Q4. Deprecation overlap

`DiscoverSomethingNew` and `ExploreByCategory` are both version-capped at
`maximumEigenVersion: 8.77.0` (retiring). Confirm the curation area supersedes
them rather than duplicating.

---

_When any of these resolve, fold the decision into the mapping doc + the section
definition (`sections/CurationArea.ts`) and delete the entry here._
