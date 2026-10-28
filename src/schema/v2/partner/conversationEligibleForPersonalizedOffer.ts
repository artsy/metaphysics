import { GraphQLFieldConfig, GraphQLInt, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"

const PERSONALIZED_OFFER_SCAN_LIMIT = 5

export interface InquiryMetricsSource {
  partnerID: string
}

interface ConversationEligibleForPersonalizedOfferArguments {
  createdWithinDays: number
}

export const conversationEligibleForPersonalizedOfferField = (): GraphQLFieldConfig<
  InquiryMetricsSource,
  ResolverContext,
  ConversationEligibleForPersonalizedOfferArguments
> => {
  const { ConversationType } = require("schema/v2/conversation")

  return {
    type: ConversationType,
    description:
      "The newest recent inquiry a personalized offer can still be sent from, or null if there is none. " +
      'Powers the "Send offers" card on the partner\'s CMS Home page. ' +
      `Only the ${PERSONALIZED_OFFER_SCAN_LIMIT} most recent inquiries inside the window are checked, and checking stops at the first eligible one.`,
    args: {
      createdWithinDays: {
        type: new GraphQLNonNull(GraphQLInt),
        defaultValue: 5,
        description: "Only consider inquiries started within this many days.",
      },
    },
    resolve: async (
      { partnerID },
      { createdWithinDays },
      { conversationsLoader, partnerOfferEligibilityLoader }
    ) => {
      if (!conversationsLoader || !partnerOfferEligibilityLoader) {
        return null
      }

      // Impulse ignores the window for an empty value, which would scan every
      // inquiry ever received, and rejects zero and negative values.
      if (createdWithinDays < 1) {
        return null
      }

      let response: { conversations?: { id: string }[] }

      try {
        // Same filters as the CMS inbox.
        response = await conversationsLoader({
          page: 1,
          size: PERSONALIZED_OFFER_SCAN_LIMIT,
          sort: "-created_at",
          deleted: false,
          intercepted: false,
          to_id: partnerID,
          to_type: "Partner",
          has_message: true,
          dismissed: false,
          conversation_type: "inquiry",
          created_within_days: createdWithinDays,
        })
      } catch (error) {
        console.error(
          "[partner/conversationEligibleForPersonalizedOffer] Error fetching conversations:",
          error
        )
        return null
      }

      const candidates = response.conversations ?? []

      // Check newest first and stop at the first eligible inquiry, so the common
      // case costs one eligibility call instead of one per candidate. The checks
      // run one after another, so a rejection or an "unavailable" answer (both
      // mean an outage, and each call can wait out a timeout) ends the scan
      // instead of moving on to the next candidate.
      for (const conversation of candidates) {
        try {
          const eligibility = await partnerOfferEligibilityLoader({
            impulse_conversation_id: conversation.id,
          })
          if (eligibility?.status === "eligible") return conversation

          // Gravity answers 200 with this reason when Impulse or Exchange is
          // down, and the next candidate would wait on the same failed service.
          if (eligibility?.details?.reason === "unavailable") return null
        } catch (error) {
          console.error(
            `[partner/conversationEligibleForPersonalizedOffer] Error checking conversation ${conversation.id}, stopping the scan:`,
            error
          )
          return null
        }
      }

      return null
    },
  }
}
