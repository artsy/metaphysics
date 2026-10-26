import { GraphQLEnumType, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

export const PartnerOfferEligibilityStatusEnum = new GraphQLEnumType({
  name: "PartnerOfferEligibilityStatus",
  values: {
    ELIGIBLE: {
      value: "eligible",
      description: "The partner can send a personalized offer.",
    },
    ALREADY_OFFERED: {
      value: "already_offered",
      description:
        "The collector already has an active personalized offer for this artwork.",
    },
    INELIGIBLE: {
      value: "ineligible",
      description: "The partner can't send an offer; see `details.reason`.",
    },
  },
})

export const PartnerOfferIneligibleReasonEnum = new GraphQLEnumType({
  name: "PartnerOfferIneligibleReason",
  values: {
    COLLECTOR_NOT_FOUND: {
      value: "collector_not_found",
      description: "The conversation has no collector user.",
    },
    ARTWORK_NOT_OFFERABLE: {
      value: "artwork_not_offerable",
      description: "The conversation's artwork can't receive partner offers.",
    },
    OFFER_WINDOW_CLOSED: {
      value: "offer_window_closed",
      description: "The conversation is older than the offer window.",
    },
    ACTIVE_BULK_OFFER: {
      value: "active_bulk_offer",
      description: "The artwork has an active bulk offer.",
    },
    PARTNER_VISIBLE_ORDER: {
      value: "partner_visible_order",
      description:
        "The collector already has an order with the partner on this artwork.",
    },
    EXPIRED_PERSONALIZED_OFFER: {
      value: "expired_personalized_offer",
      description:
        "A personalized offer for this collector and artwork already expired.",
    },
    UNAVAILABLE: {
      value: "unavailable",
      description:
        "Eligibility couldn't be determined (a dependent service was unreachable).",
    },
  },
})

const PartnerOfferEligibilityDetailsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerOfferEligibilityDetails",
  fields: {
    reason: {
      type: PartnerOfferIneligibleReasonEnum,
      description: "Why the partner can't send an offer. Set when ineligible.",
      resolve: ({ reason }) => reason,
    },
    partnerOfferID: {
      type: GraphQLString,
      description: "The active personalized offer. Set when already offered.",
      resolve: ({ partner_offer_id }) => partner_offer_id,
    },
  },
})

export const PartnerOfferEligibilityType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerOfferEligibility",
  description:
    "Whether a partner can send a personalized offer from a conversation.",
  fields: {
    status: {
      type: PartnerOfferEligibilityStatusEnum,
      resolve: ({ status }) => status,
    },
    details: {
      type: PartnerOfferEligibilityDetailsType,
      resolve: ({ details }) => details ?? {},
    },
  },
})
