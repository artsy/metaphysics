import {
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLResolveInfo,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { conversationsEligibleForPersonalizedOfferField } from "./conversationsEligibleForPersonalizedOffer"

// Confirmed-buyer inquirers are only counted within the most recent batch
// of unanswered conversations, to bound the cost of the collector-profiles
// lookup. See the `confirmedBuyersWaitingCount` field description below.
const UNANSWERED_CONVERSATIONS_SCAN_LIMIT = 50

// True when the current field is being resolved beneath a list index in the
// response (e.g. `partnersConnection.edges[3].node.inquiryMetrics`). The
// singular `partner(id:)` field never produces a numeric path segment, so
// this reliably distinguishes "resolved for one partner" from "resolved as
// one node of a list/connection of partners" without needing to enumerate
// every field that can return a Partner.
const isUnderListPath = (info: GraphQLResolveInfo): boolean => {
  let path: typeof info.path | undefined = info.path
  while (path) {
    if (typeof path.key === "number") {
      return true
    }
    path = path.prev
  }
  return false
}

interface UnansweredConversations {
  total_count: number
  conversations: { from_id?: string }[]
}

interface InquiryMetricsSource {
  partnerID: string
  unansweredConversations: () => Promise<UnansweredConversations | null>
}

const loadUnansweredConversations = async ({
  loader,
  partnerID,
}: {
  loader: NonNullable<ResolverContext["conversationsLoader"]>
  partnerID: string
}): Promise<UnansweredConversations | null> => {
  try {
    const { total_count, conversations } = await loader({
      page: 1,
      size: UNANSWERED_CONVERSATIONS_SCAN_LIMIT,
      deleted: false,
      intercepted: false,
      to_id: partnerID,
      to_type: "Partner",
      has_message: true,
      has_reply: false,
      dismissed: false,
      to_be_replied: true,
    })

    return { total_count, conversations: conversations ?? [] }
  } catch (error) {
    console.error(
      "[partner/inquiryMetrics] Error fetching conversations:",
      error
    )
    return null
  }
}

const PartnerInquiryMetricsType = new GraphQLObjectType<
  InquiryMetricsSource,
  ResolverContext
>({
  name: "PartnerInquiryMetrics",
  fields: () => {
    return {
      confirmedBuyersWaitingCount: {
        type: GraphQLInt,
        description:
          "Number of confirmed buyers whose inquiries are still awaiting a response from the partner. " +
          `Only scanned within the first ${UNANSWERED_CONVERSATIONS_SCAN_LIMIT} unanswered conversations returned by Impulse, so for partners with more unanswered conversations than that, this is a lower bound rather than an exact count.`,
        resolve: async (
          { partnerID, unansweredConversations },
          _args,
          { partnerCollectorProfilesLoader }
        ) => {
          if (!partnerCollectorProfilesLoader) return null

          const unanswered = await unansweredConversations()
          if (!unanswered) return null

          const userIds = [
            ...new Set(
              unanswered.conversations
                .map((conversation) => conversation.from_id)
                .filter((id): id is string => !!id)
            ),
          ]
          if (userIds.length === 0) return 0

          try {
            const { body } = await partnerCollectorProfilesLoader({
              partner_id: partnerID,
              user_ids: userIds,
              size: userIds.length,
            })
            return body.filter(
              (item) => item.collector_profile?.confirmed_buyer_at
            ).length
          } catch (error) {
            console.error(
              "[partner/inquiryMetrics] Error fetching collector profiles:",
              error
            )
            return null
          }
        },
      },
      unansweredCount: {
        type: GraphQLInt,
        description:
          "Number of inquiries still awaiting a response from the partner",
        resolve: async ({ unansweredConversations }) => {
          const unanswered = await unansweredConversations()

          return unanswered?.total_count ?? null
        },
      },
      conversationsEligibleForPersonalizedOffer: conversationsEligibleForPersonalizedOfferField(),
    }
  },
})

export const inquiryMetricsField: GraphQLFieldConfig<any, ResolverContext> = {
  type: PartnerInquiryMetricsType,
  description:
    "Aggregate metrics for the partner's inquiries, composed from Impulse conversations and Gravity collector profiles and eligibility. " +
    "Only resolvable for a single partner (e.g. `partner(id:)` on that partner's own CMS homepage) — not selectable under any list or connection field, such as partnersConnection.",
  resolve: ({ _id }, _args, { conversationsLoader }, info) => {
    if (!conversationsLoader) return null

    // inquiryMetrics is only meant to be queried for a single partner (their
    // own CMS homepage), never for a page of partners: every child makes
    // per-partner REST calls with no batch variant (the eligibility field up
    // to 10 Gravity checks, each of which calls Impulse and Exchange again),
    // so selecting any of them under a list/connection field would fan out
    // into an N+1 incident (see AGENTS.md). A numeric segment in the resolve
    // path only occurs under a list, never for the singular `partner(id:)`
    // field. Guarding the parent covers every child.
    if (isUnderListPath(info)) {
      throw new Error(
        "[partner/inquiryMetrics] This field cannot be queried under a list or connection " +
          "(e.g. partnersConnection); it is only supported for a single partner via partner(id:)."
      )
    }

    let unanswered: Promise<UnansweredConversations | null> | undefined
    const unansweredConversations = () => {
      if (!unanswered) {
        unanswered = loadUnansweredConversations({
          loader: conversationsLoader,
          partnerID: _id,
        })
      }
      return unanswered
    }

    return { partnerID: _id, unansweredConversations }
  },
}
