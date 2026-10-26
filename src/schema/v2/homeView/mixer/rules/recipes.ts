import { HomeViewSection } from "schema/v2/homeView/sections"

// Existing section instances — arms are composed from these today.
// Import the real instances so recipes use their `.id` and avoid stringly-typed drift.
import { QuickLinks } from "../../sections/QuickLinks"
import { Tasks } from "../../sections/Tasks"
import { NewWorksForYou } from "../../sections/NewWorksForYou"
import { RecommendedArtworks } from "../../sections/RecommendedArtworks"
import { CuratedGroup } from "../../sections/CuratedGroup"
import { EditorialGroup } from "../../sections/EditorialGroup"
import { WhatsHappeningGroup } from "../../sections/WhatsHappeningGroup"

/**
 * The home-feed-simplification arms. Single source of truth for the
 * `variant.name` strings — these must match the Unleash flag config exactly.
 */
export const ARMS = ["control", "hierarchy_breadth"] as const

export type Arm = typeof ARMS[number]

export const isArm = (name: string): name is Arm =>
  (ARMS as readonly string[]).includes(name)

/**
 * Each arm is an ordered allow-list of section ids. Composition = reduce
 * (drop ids not listed) + reorder (follow this order). Pass in the already
 * display-filtered sections; ids absent from `sections` are skipped safely.
 *
 * v1 is a 2-arm A/B: control vs the shipping treatment (`hierarchy_breadth`).
 * Additional arms for the planned multi-arm follow-up slot in alongside it.
 */
const ARM_ORDER: Record<Exclude<Arm, "control">, string[]> = {
  // The shipping treatment: intentional hierarchy + breadth of content types.
  // Consolidates standalone rails into section groups and reorders.
  hierarchy_breadth: [
    QuickLinks.id,
    Tasks.id, // "Act Now" pending-action prompts (auth-gated; only shows with tasks)
    NewWorksForYou.id,
    // Consolidated editorial block: the editorial rail + News as chips.
    // Replaces the standalone LatestArticles + News rails in this arm.
    EditorialGroup.id,
    // Consolidated events block: Featured Fairs + Shows rails, no chips.
    // Replaces the standalone ShowsForYou + FeaturedFairs rails in this arm.
    WhatsHappeningGroup.id,
    // Consolidated discovery block: Curators' Picks rail + entry chips absorbing
    // Recommended/Trending Artists and Collections.
    CuratedGroup.id,
    RecommendedArtworks.id,
  ],
}

/**
 * Per-arm `component.type` overrides, keyed by section id. No arm re-skins
 * sections today; the hook is retained for future arms (e.g. a merchandising
 * treatment that varies presentation without changing the section set).
 */
const ARM_COMPONENT_OVERRIDES: Partial<Record<
  Exclude<Arm, "control">,
  Record<string, string>
>> = {}

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

// String literal (not the imported HOME_FEED_SIMPLIFICATION_FLAG) to avoid an
// import cycle: recipes -> rule -> recipes. Keep in sync with the rule.
const EXPERIMENT_FLAG = "onyx_home-feed-simplification"

// Experiment-only sections are display-gated by EXPERIMENT_FLAG, whose toggle is
// ALSO on for a flag-on "control" variant — so on the pass-through (control /
// unenrolled) path they'd otherwise leak into the baseline feed in their default
// positions. Drop them here so they surface ONLY via a treatment arm's allow-list.
const withoutExperimentOnly = (sections: HomeViewSection[]) =>
  sections.filter((section) => section.featureFlag !== EXPERIMENT_FLAG)

/**
 * Pure: select + order `sections` according to the arm recipe, applying any
 * per-arm presentation overrides. For `control` / unknown arms, returns the
 * baseline feed — i.e. sections minus the experiment-only ones (see above).
 */
export function composeForArm(
  arm: Arm | null,
  sections: HomeViewSection[]
): HomeViewSection[] {
  if (!arm || arm === "control") return withoutExperimentOnly(sections)

  const order = ARM_ORDER[arm]
  if (!order) return withoutExperimentOnly(sections)

  const overrides = ARM_COMPONENT_OVERRIDES[arm] ?? {}
  const byId = new Map(sections.map((s) => [s.id, s]))

  return order
    .map((id) => byId.get(id))
    .filter((s): s is HomeViewSection => Boolean(s))
    .map((section) => applyComponentOverride(section, overrides[section.id]))
}
