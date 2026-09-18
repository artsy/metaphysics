import * as Sentry from "@sentry/node"
import { info, warn } from "lib/loggers"
import { ResolverContext } from "types/graphql"
import { AIAgentResponseSectionPayload, AIAgentSectionType } from "./types"

// Gravity's batch endpoints match on internalID only -- a slug comes back
// empty -- so that's the only citation shape worth sending.
export const INTERNAL_ID = /^[0-9a-f]{24}$/i

// One page of cards, and the cap on what a client may replay as history.
export const MAX_SECTION_IDS = 20

interface NormalizedIDs {
  /** How many citations were considered, i.e. after the cap. */
  requested: number
  valid: string[]
  dropped: string[]
}

/**
 * Cap first, so a long list can't make us do more work, then drop what no
 * endpoint could match, then deduplicate -- keeping first-occurrence order,
 * which is the only relevance signal the cards carry.
 */
export function normalizeCitedIDs(ids: readonly string[]): NormalizedIDs {
  const requested = ids.slice(0, MAX_SECTION_IDS)
  const valid: string[] = []
  const dropped: string[] = []
  const seen = new Set<string>()

  requested.forEach((id) => {
    if (!INTERNAL_ID.test(id)) {
      dropped.push(id)
      return
    }
    if (seen.has(id)) return
    seen.add(id)
    valid.push(id)
  })

  return { requested: requested.length, valid, dropped }
}

/**
 * Gravity's batch endpoints neither promise response order nor return a
 * placeholder for an id they can't resolve, so restore the model's ordering
 * and let unresolved ids fall out -- see recentlySoldArtworks, which re-joins
 * on `_id` for the same reason.
 */
export function orderByCitedIDs<T extends { _id?: string }>(
  records: readonly T[],
  citedIDs: readonly string[]
): T[] {
  const byInternalID = new Map<string, T>()
  records.forEach((record) => {
    if (record?._id) byInternalID.set(record._id, record)
  })

  return citedIDs
    .map((id) => byInternalID.get(id))
    .filter((record): record is T => record !== undefined)
}

/**
 * One batch call per section, then re-joined -- never one call per card. A
 * section is the optional half of an answer, so a failure costs the cards
 * rather than the prose. The ids stay out of Sentry; the counts are what tell
 * us whether the prompt is holding.
 */
async function loadSection<T extends { _id?: string }>(
  sectionType: string,
  ids: string[],
  load: () => Promise<readonly T[]>
): Promise<T[]> {
  try {
    return orderByCitedIDs(await load(), ids)
  } catch (error) {
    Sentry.captureException(error, {
      tags: { ai_agent_section: sectionType },
      contexts: { aiAgentSection: { sectionType, requestedIDs: ids.length } },
    })
    return []
  }
}

function logSectionResult(
  sectionType: string,
  requested: number,
  valid: number,
  rendered: number
): void {
  info(
    `[aiAgentTurn] ${sectionType} section: ${requested} cited, ` +
      `${valid} usable, ${rendered} rendered`
  )
}

export type AIAgentModelSection = { type: "ARTWORKS"; internalIDs: string[] }

/**
 * What this server can actually turn into cards. A total Record so a new
 * member of AIAgentSectionType has to be answered for here, and a type a
 * client declares but this server can't load is dropped rather than offered to
 * the model -- which is what makes a new client safe against an old server.
 */
const HYDRATABLE_SECTIONS: Record<AIAgentSectionType, true> = {
  ARTWORKS: true,
}

// A client that predates `sections` reads the legacy `artworks` field, which
// an artworks section is mirrored into, so this keeps it working unchanged.
export const DEFAULT_SUPPORTED_SECTIONS: AIAgentSectionType[] = ["ARTWORKS"]

/**
 * What the model may produce this turn, resolved before the prompt is
 * assembled rather than after the answer is generated: the prose is written
 * expecting the cards it asked for, so dropping a section afterwards leaves
 * text promising cards that never arrive.
 */
export function resolveSupportedSections(
  supportedSections: readonly AIAgentSectionType[] | null | undefined
): AIAgentSectionType[] {
  const declared = supportedSections ?? DEFAULT_SUPPORTED_SECTIONS
  const resolved = [...new Set(declared)].filter(
    (sectionType) => HYDRATABLE_SECTIONS[sectionType]
  )

  // Deliberately not substituted with the default: a client asking only for
  // types this server doesn't have is out of sync, and it gets a text-only
  // turn rather than an answer to a question it didn't ask.
  if (resolved.length === 0 && declared.length > 0) {
    warn(
      "[aiAgentTurn] no renderable sections: client declared " +
        `${JSON.stringify([...new Set(declared)])}, this server can hydrate ` +
        `${JSON.stringify(Object.keys(HYDRATABLE_SECTIONS))}`
    )
  }

  return resolved
}

/**
 * Turns the ids the model chose into a section of loader-verified entities, or
 * null when nothing survives -- an empty section would render as a rail with a
 * header and no cards.
 */
export async function hydrateSection(
  section: AIAgentModelSection,
  context: ResolverContext,
  supportedSections: readonly AIAgentSectionType[]
): Promise<AIAgentResponseSectionPayload | null> {
  // Defensive: the output schema is built from the same list, so the model
  // can't name a type that isn't allowed.
  if (!supportedSections.includes(section.type)) {
    warn(
      `[aiAgentTurn] dropped a ${section.type} section the client did not ask for`
    )
    return null
  }

  const { requested, valid, dropped } = normalizeCitedIDs(section.internalIDs)

  // A card that never renders is invisible from the outside, which is how a
  // slug-citing answer reads as a working turn. If this stays quiet, the
  // prompt is holding.
  if (dropped.length > 0) {
    warn(
      `[aiAgentTurn] dropped ${dropped.length} of ${requested} ` +
        `${section.type} citation(s), not internalIDs: ` +
        JSON.stringify(dropped.slice(0, 3))
    )
  }
  if (valid.length === 0) return null

  switch (section.type) {
    case "ARTWORKS": {
      const artworks = await loadSection(section.type, valid, () =>
        context.artworksLoader({ ids: valid, size: valid.length })
      )
      logSectionResult(section.type, requested, valid.length, artworks.length)
      return artworks.length > 0
        ? { __typename: "AIAgentArtworksSection", artworks }
        : null
    }
  }
}
