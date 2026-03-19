import { GraphQLList, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { InquiryQuestionType } from "../inquiry_question"
import { LocationType } from "../location"
import { InternalIDFields } from "../object_identification"
import { InquirerCollectorProfileType } from "./partnerInquirerCollectorProfile"
import { getOfferMessage } from "../order/utils/getOfferMessage"

// Note: The parent resolver (conversation/index.ts) injects `_conversation`
// into the resolver data so that `formattedFirstMessage` can lazily fetch
// order data for the offer fallback without an extra API call when not queried.

export const InquiryRequestType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerInquiryRequest",
  fields: () => ({
    ...InternalIDFields,
    shippingLocation: {
      type: LocationType,
      resolve: ({ inquiry_shipping_location }) => inquiry_shipping_location,
    },
    questions: {
      type: new GraphQLList(InquiryQuestionType),
      resolve: ({ inquiry_questions }) => inquiry_questions,
    },
    formattedFirstMessage: {
      type: GraphQLString,
      description:
        "Returns the first message of an inquiry with the addition of any inquiry questions submitted by the user, formatted and if present.",
      resolve: async (
        {
          inquiry_shipping_location,
          inquiry_questions,
          message,
          _conversation,
        },
        _args,
        { partnerOrdersLoader, meOrdersLoader, userID }
      ) => {
        if (inquiry_questions && inquiry_questions.length) {
          const shippingQuote = () => {
            if (!inquiry_shipping_location) return "• Shipping quote"
            const { city, country, state } = inquiry_shipping_location
            const stateOrCountry = country === "United States" ? state : country
            return `• Shipping quote to ${[city, stateOrCountry].join(", ")}`
          }
          const lines = ["I'm interested in information regarding:"]

          inquiry_questions.forEach((question) => {
            lines.push(
              question.id === "shipping_quote"
                ? shippingQuote()
                : `• ${question?.question}`
            )
          })
          if (message) lines.push("", message)
          return lines.join("\n")
        }

        if (message) return message

        // Fallback for auto-created inquiries from offers
        if (_conversation) {
          try {
            const isConversationInitiator = !!(
              userID && _conversation.from_id === userID
            )

            return await getOfferFallbackMessage(_conversation, {
              partnerOrdersLoader,
              meOrdersLoader,
              isConversationInitiator,
            })
          } catch (error) {
            console.error(
              "[partnerInquiryRequest/formattedFirstMessage] Offer fallback error:",
              error
            )
            return null
          }
        }

        return null
      },
    },
    collectorProfile: {
      type: InquirerCollectorProfileType,
      resolve: async (
        { partnerId, inquirer },
        _args,
        { partnerCollectorProfileLoader }
      ) => {
        if (!partnerCollectorProfileLoader) return

        const data = await partnerCollectorProfileLoader({
          partnerId,
          userId: inquirer.id,
        })

        return {
          ...data.collector_profile,
          follows_profile: data.follows_profile,
        }
      },
    },
  }),
})

interface ConversationForOffer {
  items?: Array<{ item_type: string; item_id: string }>
  from_id: string
  to_id: string
  to_type: string
}

interface OrderWithOffer {
  mode: string
  last_submitted_offer: {
    amount_cents: number
    currency_code: string
    note?: string | null
  } | null
}

/**
 * Given a conversation and order loaders, returns a fallback message string
 * like "I sent an offer for US$1,500" if the conversation has an associated
 * offer-mode order, or null otherwise.
 */
const getOfferFallbackMessage = async (
  conversation: ConversationForOffer,
  {
    partnerOrdersLoader,
    meOrdersLoader,
    isConversationInitiator,
  }: Pick<ResolverContext, "partnerOrdersLoader" | "meOrdersLoader"> & {
    isConversationInitiator: boolean
  }
) => {
  const artworkId = conversation.items?.find(
    (item) => item.item_type === "Artwork"
  )?.item_id

  if (!artworkId) return null

  const { from_id: buyerID, to_id: toID, to_type: toType } = conversation
  const partnerID = toType === "Partner" ? toID : null

  let orders: OrderWithOffer[] = []

  // Collectors use meOrdersLoader (Exchange's partners/:id/orders requires
  // partner access). Partners/admins use partnerOrdersLoader.
  if (isConversationInitiator && meOrdersLoader) {
    const result = await meOrdersLoader({
      artwork_id: artworkId,
      page: 1,
      size: 1,
    })
    orders = result?.body || []
  } else if (partnerOrdersLoader && buyerID && partnerID) {
    const result = await partnerOrdersLoader(partnerID, {
      artwork_id: artworkId,
      buyer_id: buyerID,
      page: 1,
      size: 1,
    })
    orders = result?.body || []
  }

  const offerOrder = orders.find(
    (order) => order.mode === "offer" && order.last_submitted_offer
  )

  if (!offerOrder?.last_submitted_offer) return null

  const { amount_cents, currency_code, note } = offerOrder.last_submitted_offer

  return getOfferMessage(note, amount_cents, currency_code)
}
