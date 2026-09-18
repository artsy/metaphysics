import * as Sentry from "@sentry/node"
import { info, warn } from "lib/loggers"
import { ResolverContext } from "types/graphql"
import { AIAgentResponseSectionPayload, AIAgentSectionType } from "./types"

/**
 * Gravity's batch endpoints (`/artworks?ids[]=`, `/artists?ids[]=`) match on
 * internalID only -- a slug comes back empty -- so that's the only citation
 * shape worth sending.
 */
export const INTERNAL_ID = /^[0-9a-f]{24}$/i

// One page of cards. Also caps what a client may replay as history: a
// replayed section can't be longer than what one answer could have shown.
export const MAX_SECTION_IDS = 20

interface NormalizedIDs {
  /** How many citations were considered, i.e. after the cap. */
  requested: number
  /** Citations a batch endpoint can actually match, first occurrence only. */
  valid: string[]
  /** Citations that weren't internalIDs at all. */
  dropped: string[]
}

/**
 * The one normalization order, applied before anything reaches a loader or
 * the model: cap first (so a long list can't make us do more work), then drop
 * what no endpoint could match, then deduplicate -- keeping first-occurrence
 * order, which is the only relevance signal the cards carry.
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
    // The model citing the same entity twice is one card, not two.
    if (seen.has(id)) return
    seen.add(id)
    valid.push(id)
  })

  return { requested: requested.length, valid, dropped }
}

/**
 * Gravity's batch endpoints neither promise response order nor return a
 * placeholder for an id they can't resolve, so what comes back is a set, not a
 * sequence -- see recentlySoldArtworks, which re-joins on `_id` for the same
 * reason. Restore the model's ordering.
 *
 * Ids that resolve to nothing (deleted, unpublished, or hallucinated) just
 * don't get a card: the model supplies identifiers and never display data, so
 * a bad one fails as a missing card, never a wrong one.
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
 * One batch call per section, then re-joined -- never one call per card.
 *
 * Every caller passes `size` alongside the ids: fetching by id is still a
 * paginated Gravity request, so without it the default page (10) silently
 * truncates a larger batch -- the cards that fall off look to everyone like
 * ids the model never cited. See searchDropdown, which passes `size` for the
 * same reason.
 *
 * A section is the optional half of an answer, so a loader failure degrades to
 * no cards rather than taking the prose down with it. The ids themselves stay
 * out of Sentry; the counts are what tell us whether the prompt is holding.
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

// One line per hydrated section: enough to tell "the model cited nothing"
// from "it cited ids that don't resolve" from "the cards were dropped by the
// cap or the format filter" while testing a real client.
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
 * The section types this server can actually turn into cards. Written as a
 * total Record so a new member of AIAgentSectionType cannot be added without
 * being answered for here -- and `hydrateSection`'s switch, which has no
 * default branch, stops compiling at the same time. A type a client declares
 * but this server can't load has to be dropped rather than offered to the
 * model, which is what makes a new client safe against a rolled-back server.
 */
const HYDRATABLE_SECTIONS: Record<AIAgentSectionType, true> = {
  ARTWORKS: true,
}

// A client that predates `sections` reads the legacy `artworks` field and
// never selects `sections`, so offering it artworks only keeps it working
// exactly as before: an artworks section is mirrored into that field.
export const DEFAULT_SUPPORTED_SECTIONS: AIAgentSectionType[] = ["ARTWORKS"]

/**
 * What the model may produce this turn. The capability has to be resolved
 * before the prompt is assembled, not after the answer is generated: the prose
 * is written on the assumption that the cards it asked for will be rendered,
 * so dropping a section afterwards leaves text promising cards that never
 * arrive.
 */
export function resolveSupportedSections(
  supportedSections: readonly AIAgentSectionType[] | null | undefined
): AIAgentSectionType[] {
  const declared = supportedSections ?? DEFAULT_SUPPORTED_SECTIONS
  const resolved = [...new Set(declared)].filter(
    (sectionType) => HYDRATABLE_SECTIONS[sectionType]
  )

  // Not substituted with the default: a client asking only for types this
  // server doesn't have is out of sync, and quietly answering a different
  // question than it asked would hide that. It gets a text-only turn.
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
 *
 * Explicitly switched rather than registry-driven: with two entity types the
 * branch reads better than the abstraction would, while the cap/dedupe/order
 * rules every type needs live in the helpers above.
 */
export async function hydrateSection(
  section: AIAgentModelSection,
  context: ResolverContext,
  supportedSections: readonly AIAgentSectionType[]
): Promise<AIAgentResponseSectionPayload | null> {
  // Defensive: the output schema is built from the same list, so the model
  // cannot name a type that isn't allowed. If one arrives anyway, the client
  // can't render it -- loading it would spend Gravity calls on cards nobody
  // will see.
  if (!supportedSections.includes(section.type)) {
    warn(
      `[aiAgentTurn] dropped a ${section.type} section the client did not ask for`
    )
    return null
  }

  const { requested, valid, dropped } = normalizeCitedIDs(section.internalIDs)

  // Logged rather than passed through: a non-internalID citation resolves to
  // nothing, and a card that never renders is invisible from the outside --
  // which is how a slug-citing answer previously read as a working turn with
  // no cards. If this line stays quiet, the prompt is holding.
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
