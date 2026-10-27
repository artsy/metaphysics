import { HomeViewSection } from "schema/v2/homeView/sections"

// Import the real instances so recipes use their `.id` (no stringly-typed drift).
import { QuickLinks } from "../../sections/QuickLinks"
import { Tasks } from "../../sections/Tasks"
import { HeroUnits } from "../../sections/HeroUnits"
import { NewWorksForYou } from "../../sections/NewWorksForYou"
import { RecentlyViewedArtworks } from "../../sections/RecentlyViewedArtworks"
import { CuratedGroup } from "../../sections/CuratedGroup"
import { EditorialGroup } from "../../sections/EditorialGroup"
import { Auctions } from "../../sections/Auctions"
import { ViewingRooms } from "../../sections/ViewingRooms"
import { WhatsHappeningGroup } from "../../sections/WhatsHappeningGroup"

// Single source of truth for the `variant.name` strings — must match the Unleash config exactly.
export const ARMS = ["control", "consolidated"] as const

export type Arm = typeof ARMS[number]

export const isArm = (name: string): name is Arm =>
  (ARMS as readonly string[]).includes(name)

// Each arm is an ordered allow-list of section ids: reduce (drop unlisted) + reorder.
// v1 is a 2-arm A/B (control vs consolidated); follow-up arms slot in alongside.
const ARM_ORDER: Record<Exclude<Arm, "control">, string[]> = {
  // Consolidates standalone rails into section groups and reorders.
  consolidated: [
    QuickLinks.id,
    Tasks.id, // "Act Now" pending-action prompts (auth-gated; only shows with tasks)
    HeroUnits.id,
    NewWorksForYou.id,
    RecentlyViewedArtworks.id,
    // Curated discovery block: Curators' Picks rail + artist/collection chips.
    CuratedGroup.id,
    // Editorial block: the editorial rail + News as chips.
    EditorialGroup.id,
    Auctions.id, // "Discover Auctions on Artsy"
    ViewingRooms.id,
    // Events block: Featured Fairs + Shows rails, no chips.
    WhatsHappeningGroup.id,
  ],
}

// Per-arm `component.type` overrides; none today, hook kept for future re-skinning arms.
const ARM_COMPONENT_OVERRIDES: Partial<Record<
  Exclude<Arm, "control">,
  Record<string, string>
>> = {}

// Clone rather than mutate: section instances are module-level singletons shared
// across concurrent requests, so re-skinning one must not touch the shared object.
export function applyComponentOverride(
  section: HomeViewSection,
  type?: string
): HomeViewSection {
  if (!type) return section
  return { ...section, component: { ...section.component, type } }
}

// String literal (not the imported flag constant) to avoid a recipes -> rule -> recipes cycle.
const EXPERIMENT_FLAG = "onyx_home-feed-simplification"

// The flag toggle is ALSO on for a flag-on "control" variant, so on the pass-through
// path experiment-only sections would leak into the baseline feed. Drop them here so
// they surface only via a treatment arm's allow-list.
const withoutExperimentOnly = (sections: HomeViewSection[]) =>
  sections.filter((section) => section.featureFlag !== EXPERIMENT_FLAG)

// Select + order sections per the arm recipe. For control/unknown arms, returns the
// baseline feed (experiment-only sections stripped — see withoutExperimentOnly).
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
