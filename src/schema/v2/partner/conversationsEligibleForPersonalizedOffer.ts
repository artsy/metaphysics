import {
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} from "graphql"
import {
  canSendPersonalizedOffer,
  loadPartnerOfferEligibility,
} from "schema/v2/conversation/partnerOfferEligibility"
import { ResolverContext } from "types/graphql"

const PERSONALIZED_OFFER_SCAN_LIMIT = 10

interface InquiryMetricsSource {
  partnerID: string
}

interface ConversationsEligibleForPersonalizedOfferArguments {
  createdWithinDays: number
}

export const conversationsEligibleForPersonalizedOfferField = (): GraphQLFieldConfig<
  InquiryMetricsSource,
  ResolverContext,
  ConversationsEligibleForPersonalizedOfferArguments
> => {
  const { ConversationType } = require("schema/v2/conversation")

  return {
    type: new GraphQLNonNull(
      new GraphQLList(new GraphQLNonNull(ConversationType))
    ),
    description:
      "The partner's recent inquiries that a personalized offer can still be sent from, newest first. Empty if there are none. " +
      'Powers the "Send offers" card on the partner\'s CMS Home page. ' +
      `Only the ${PERSONALIZED_OFFER_SCAN_LIMIT} most recent inquiries inside the window are checked, so this is capped at that many.`,
    args: {
      createdWithinDays: {
        type: GraphQLInt,
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
        return []
      }

      let conversations: { id: string }[]

      try {
        // Same filters as the CMS inbox.
        ;({ conversations } = await conversationsLoader({
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
        }))
      } catch (error) {
        console.error(
          "[partner/conversationsEligibleForPersonalizedOffer] Error fetching conversations:",
          error
        )
        return []
      }

      const candidates = conversations ?? []

      const eligibilities = await Promise.all(
        candidates.map(async ({ id }) => {
          const eligibility = await loadPartnerOfferEligibility({
            loader: partnerOfferEligibilityLoader,
            conversationId: id,
          })
          return canSendPersonalizedOffer(eligibility)
        })
      )

      return candidates.filter((_conversation, index) => {
        return eligibilities[index]
      })
    },
  }
}
