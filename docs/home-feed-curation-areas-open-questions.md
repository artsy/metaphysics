# Home Feed — Section Group open questions

Parking lot for unresolved design/modeling questions on the "Section Group"
section (`HomeViewSectionGroup`). Companion to the rail mapping in
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
- The override lives in an editable entity (a siteHeroUnit slug per section group?
  a Gravity **Set**? the content team's existing hero-unit tooling?).
- The derived default would come from the target rail's content (first/representative
  item image), computed **once at update time**, not per request.

**Sub-questions to resolve later:**

1. **What entity backs the image + override?** Reuse the siteHeroUnit/CMS hero-unit
   pattern (slug per section group/chip)? A Gravity Set? Something new?
2. **What is "set update time" / what invalidates the cache?** A Gravity Set/hero-unit
   edit webhook? A cron re-materialization? A loader TTL? (siteHeroUnit today is just
   loader-cached per request lifecycle — "materialize on set change" would be new.)
3. **Per-chip or per-area?** Is the editable image attached to each chip (→ target
   rail), or to the section group as a whole?
4. **Who computes the derived default,** and where does it live so reads stay O(1)
   (precomputed field vs memcached vs stored on the Set)?
5. Does this generalize beyond chips — i.e. should _any_ section's thumbnail/background
   use the same "override-or-derive, materialized" mechanism?

**Status:** in progress — now load-bearing (design adopted a fanned **3-image
stack** for cards, aggressively). Owned by a Gravity handoff:
`gravity/HOME_FEED_REPRESENTATIVE_IMAGES_HANDOFF.md` (materialized, overridable
`representative_preview_images` per entity).

Per-entity state:

- **Marketing collections** (Curated chips): **done** — Gravity now returns
  `representative_artwork_ids` on the collection payload. MP reads the ids off the
  payload and resolves images in **one batched `artworksLoader` call**
  (`collectionStackImageURLsBySlug` in `sections/CuratedGroup.ts`), and exposes a
  generic `MarketingCollection.representativeArtworks: [Artwork]` field. The
  per-collection `filterArtworks` derive stopgap is **retired**. (Remaining: the
  `CriteriaMarketingCollection` subclass — not in the rail today.)
- **Fairs** (Featured Fairs rail): **already render 3 images today** — but via a
  **client-side per-item N+1**: Eigen's `FairCard` fragment selects
  `filterArtworksConnection` per fair (`followedArtistArtworks` + `otherArtworks`), so
  each fair node fans out ~2 `filterArtworks` calls. It ships (lazy per section, low-N,
  parallel, memcached). So the Gravity field here is **cleanup of an existing N+1 +
  overridability**, not unblocking — it would let us retire the per-fair fragment. No
  MP change is needed just to show 3 fair images.
- **Shows** (Shows rail): **genuinely blocked** — shows render **1 image** (`metaImage`)
  today. A show _has_ an image set (installation shots) but only via a per-show loader
  (`partnerShowImagesLoader`), off the list payload → a _new_ N+1. MP keeps shows
  single-image until Gravity surfaces the set on the shows list response (denormalize,
  not derive).
- **Auctions** (Auctions rail): **already render 3 images today** — same shape as fairs:
  Eigen's sales-item fragment selects `sale.artworksConnection(first:3)` per sale (a
  client-side per-item N+1 that ships). Gravity field = cleanup + overridability, not
  unblocking.
- **Artists** (Recommended/Trending chips): **stopgap in place** — stack = the
  rail's first 3 artists' cover images (`artistChipStackURLs` in
  `sections/CuratedGroup.ts`, via the rail resolver; section-level, not an N+1).
  Crude "first 3" default; the Gravity field is still wanted for a curated
  override and consistency with the other entities.

The standard invariant across all of these: **representative images must be on the
entity's list/connection payload** (O(1) per card, no per-item calls). Source varies
(derive vs. denormalize); the on-the-list guarantee is uniform. Two caveats worth
holding: collections are only "safe" while the chip list is hardcoded-small (a dynamic
list makes them N+1 too); and **fairs/sales already violate this invariant today** via
their client-side per-item fragments — so for them the field is a _cleanup_ that brings
them into compliance, not a new capability. (Measured cost of the existing fan-out is
an open question for the Eigen side — see `eigen/HOME_FEED_3STACK_IMAGE_SOURCING_HANDOFF.md`.)

---

## Q2. What does the "Collections" chip point at?

See [home-feed-curation-areas.md](./home-feed-curation-areas.md#the-collections-problem).
No live, non-deprecated "Collections" rail exists. Marketing-collections rail vs
category-browse vs hub deep-link — needs product/design. Chip is a placeholder
`/collections` href until resolved.

## Q3. Chip set for section group #1

Is it exactly Curators' Picks (lead) + Recommended Artists + Trending Artists +
Collections, or does it also absorb `RecommendedArtworks` ("We Think You'll Love")
and/or other discovery rails? The JTBD named four, but the overlapping
discovery-artworks rail is a candidate. Needs product.

## Q4. Deprecation overlap

`DiscoverSomethingNew` and `ExploreByCategory` are both version-capped at
`maximumEigenVersion: 8.77.0` (retiring). Confirm the section group supersedes
them rather than duplicating.

---

_When any of these resolve, fold the decision into the mapping doc + the section
definition (`sections/CuratedGroup.ts`) and delete the entry here._
