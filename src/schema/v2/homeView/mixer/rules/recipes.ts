import { HomeViewSection } from "schema/v2/homeView/sections"

// Existing section instances — arms are composed from these today.
// Import the real instances so recipes use their `.id` and avoid stringly-typed drift.
import { QuickLinks } from "../../sections/QuickLinks"
import { NewWorksForYou } from "../../sections/NewWorksForYou"
import { RecommendedArtworks } from "../../sections/RecommendedArtworks"
import { CuratorsPicksEmerging } from "../../sections/CuratorsPicksEmerging"
import { AuctionLotsForYou } from "../../sections/AuctionLotsForYou"
import { LatestArticles } from "../../sections/LatestArticles"
import { News } from "../../sections/News"
import { ShowsForYou } from "../../sections/ShowsForYou"
import { FeaturedFairs } from "../../sections/FeaturedFairs"
import { CurationArea } from "../../sections/CurationArea"

/**
 * The home-feed-simplification arms. Single source of truth for the
 * `variant.name` strings — these must match the Unleash flag config exactly.
 */
export const ARMS = [
  "control",
  "reduced_current",
  "hierarchy_breadth",
  "merchandising",
] as const

export type Arm = typeof ARMS[number]

export const isArm = (name: string): name is Arm =>
  (ARMS as readonly string[]).includes(name)

/**
 * Each arm is an ordered allow-list of section ids. Composition = reduce
 * (drop ids not listed) + reorder (follow this order). Pass in the already
 * display-filtered sections; ids absent from `sections` are skipped safely.
 *
 * TODO: these are first-pass placeholders built from EXISTING sections.
 * Replace with the agreed reduced-content baseline once design converges.
 * TODO: where a consolidated rail (e.g. Discover tabs, Editorial tabs) is
 * intended, a single new section id will slot in here later.
 */
const ARM_ORDER: Record<Exclude<Arm, "control">, string[]> = {
  // Variant 1: reduced content, current hierarchy (same relative order as prod)
  reduced_current: [
    QuickLinks.id,
    NewWorksForYou.id,
    RecommendedArtworks.id,
    CuratorsPicksEmerging.id,
    AuctionLotsForYou.id,
    LatestArticles.id,
    ShowsForYou.id,
    FeaturedFairs.id,
  ],

  // Variant 2: intentional hierarchy + breadth of content types (reorder)
  hierarchy_breadth: [
    QuickLinks.id,
    NewWorksForYou.id,
    // editorial raised for "breadth" — TODO: likely an Editorial *tabs* section later
    LatestArticles.id,
    News.id,
    ShowsForYou.id,
    FeaturedFairs.id,
    // Consolidated discovery block: one lead rail (Curators' Picks) + entry
    // chips absorbing Recommended/Trending Artists and Collections.
    CurationArea.id,
    RecommendedArtworks.id,
  ],

  // Variant 3: same order as Variant 1; presentation differs via component overrides
  merchandising: [], // mirrors reduced_current, assigned below
}
ARM_ORDER.merchandising = ARM_ORDER.reduced_current

/**
 * Per-arm `component.type` overrides, keyed by section id. Only the
 * merchandising arm re-skins sections today; other arms reorder/reduce only.
 *
 * TODO: fill in the real presentation overrides once design converges, e.g.
 *   [NewWorksForYou.id]: "ArtworksRail",
 */
const ARM_COMPONENT_OVERRIDES: Partial<Record<
  Exclude<Arm, "control">,
  Record<string, string>
>> = {
  merchandising: {},
}

/**
 * Return a section with its `component.type` overridden. Clones rather than
 * mutates: section instances are module-level singletons shared across every
 * concurrent request, so reordering may share references but re-skinning must
 * not. Shallow-clones the section AND its nested `component` object.
 */
export function applyComponentOverride(
  section: HomeViewSection,
  type?: string
): HomeViewSection {
  if (!type) return section
  return { ...section, component: { ...section.component, type } }
}

/**
 * Pure: select + order `sections` according to the arm recipe, applying any
 * per-arm presentation overrides. Returns sections unchanged for `control` /
 * unknown arms.
 */
export function composeForArm(
  arm: Arm | null,
  sections: HomeViewSection[]
): HomeViewSection[] {
  if (!arm || arm === "control") return sections

  const order = ARM_ORDER[arm]
  if (!order) return sections

  const overrides = ARM_COMPONENT_OVERRIDES[arm] ?? {}
  const byId = new Map(sections.map((s) => [s.id, s]))

  return order
    .map((id) => byId.get(id))
    .filter((s): s is HomeViewSection => Boolean(s))
    .map((section) => applyComponentOverride(section, overrides[section.id]))
}
