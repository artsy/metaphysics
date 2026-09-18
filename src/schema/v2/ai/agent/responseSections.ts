import * as Sentry from "@sentry/node"
import { info, warn } from "lib/loggers"
import { ResolverContext } from "types/graphql"
import { AIAgentResponseSectionPayload, AIAgentSectionType } from "./types"

// Gravity's batch endpoints match on internalID only -- a slug comes back
// empty -- so that's the only citation shape worth sending.
const INTERNAL_ID = /^[0-9a-f]{24}$/i

// One page of cards, and the cap on what a client may replay as history.
export const MAX_SECTION_IDS = 20

/**
 * Cap first, so a long list can't make us do more work, then drop what no
 * endpoint could match, then deduplicate -- keeping first-occurrence order,
 * which is the only relevance signal the cards carry.
 */
export function normalizeCitedIDs(ids: readonly string[]) {
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
 * on `_id` for the same reason. Expects deduplicated ids: it maps over the
 * citations, so a repeat would yield the same record twice.
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

export type AIAgentModelSection = { type: "ARTWORKS"; internalIDs: string[] }

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
  // A type this server doesn't have never gets here: it isn't in the enum, so
  // it fails validation at the schema boundary. An explicit empty list is
  // taken at face value and yields a text-only turn.
  return [...new Set(supportedSections ?? DEFAULT_SUPPORTED_SECTIONS)]
}

/**
 * Turns the ids the model chose into a section of loader-verified entities, or
 * null when nothing survives -- an empty section would render as a rail with a
 * header and no cards.
 */
export async function hydrateSection(
  section: AIAgentModelSection,
  context: ResolverContext
): Promise<AIAgentResponseSectionPayload | null> {
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

  // A section is the optional half of an answer, so a failure costs the cards
  // rather than the prose. The ids stay out of Sentry; the counts are what
  // tell us whether the prompt is holding.
  try {
    switch (section.type) {
      case "ARTWORKS": {
        // One batch call, never one per card, and fetching by id still
        // paginates, hence `size`.
        const artworks = orderByCitedIDs(
          await context.artworksLoader({ ids: valid, size: valid.length }),
          valid
        )
        info(
          `[aiAgentTurn] ${section.type} section: ${requested} cited, ` +
            `${valid.length} usable, ${artworks.length} rendered`
        )
        return artworks.length > 0
          ? { __typename: "AIAgentArtworksSection", artworks }
          : null
      }
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: { ai_agent_section: section.type },
      contexts: {
        aiAgentSection: {
          sectionType: section.type,
          requestedIDs: valid.length,
        },
      },
    })
    return null
  }
}
