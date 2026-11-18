import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { warn } from "lib/loggers"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "../../artwork"
import { date } from "../../fields/date"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "../../fields/money"
import { InternalIDFields } from "../../object_identification"

export const ResaleSubmissionChannelEnum = new GraphQLEnumType({
  name: "ResaleSubmissionChannel",
  values: {
    AUCTION: { value: "auction" },
    MARKETPLACE: { value: "marketplace" },
  },
})

export const ResaleSubmissionCourierHandoffEnum = new GraphQLEnumType({
  name: "ResaleSubmissionCourierHandoff",
  values: {
    COURIER_PICKUP: { value: "courier_pickup" },
    NO_PREFERENCE: { value: "no_preference" },
    SELLER_DROPOFF: { value: "seller_dropoff" },
  },
})

export const ResaleSubmissionPackagingEnum = new GraphQLEnumType({
  name: "ResaleSubmissionPackaging",
  values: {
    FRAMED: { value: "framed" },
    NO_PREFERENCE: { value: "no_preference" },
    ROLLED: { value: "rolled" },
  },
})

export const ResaleSubmissionPackerEnum = new GraphQLEnumType({
  name: "ResaleSubmissionPacker",
  values: {
    COURIER: { value: "courier" },
    NO_PREFERENCE: { value: "no_preference" },
    SELLER: { value: "seller" },
  },
})

export const ResaleSubmissionRejectionReasonEnum = new GraphQLEnumType({
  name: "ResaleSubmissionRejectionReason",
  values: {
    MEDIUM_NOT_SUPPORTED: { value: "medium_not_supported" },
    NOT_PURCHASED_ON_ARTSY: { value: "not_purchased_on_artsy" },
    OUTSIDE_US: { value: "outside_us" },
  },
})

export const ResaleSubmissionStateEnum = new GraphQLEnumType({
  name: "ResaleSubmissionState",
  values: {
    ACCEPTED: { value: "accepted" },
    AUCTION_REVIEW: { value: "auction_review" },
    CANCELED: { value: "canceled" },
    LISTED: { value: "listed" },
    REJECTED: { value: "rejected" },
  },
})

export const ArtworkResaleStatusEnum = new GraphQLEnumType({
  name: "ArtworkResaleStatus",
  values: {
    AVAILABLE: {
      value: "available",
      description: "The viewer can submit this work for resale.",
    },
    IN_PROGRESS: {
      value: "in_progress",
      description: "Artsy accepted the work; the seller is completing details.",
    },
    MARKED_FOR_FUTURE_SALE: {
      value: "marked_for_future_sale",
      description: "Artsy rejected the work; the seller may sell it later.",
    },
    SUBMITTED: {
      value: "submitted",
      description: "The work is listed or under auction review.",
    },
  },
})

const RESALE_STATUS_BY_STATE: Record<string, string> = {
  accepted: "in_progress",
  auction_review: "submitted",
  canceled: "available",
  listed: "submitted",
  rejected: "marked_for_future_sale",
}

export const resaleStatusFromLatestSubmission = (
  submission: { state: string } | null
): string | null => {
  if (!submission) return "available"

  const { state } = submission
  const status = RESALE_STATUS_BY_STATE[state]
  if (!status) {
    // Null rather than AVAILABLE, so clients never offer an unknown state for sale.
    warn(`Unknown resale submission state: ${state}`)
    return null
  }
  return status
}

const moneyFromMinorField = (
  minorKey: string
): GraphQLFieldConfig<any, ResolverContext> => ({
  type: Money,
  resolve: (submission, args, context, info) => {
    const minor = submission[minorKey]
    const currencyCode = submission.price_currency_code

    if (minor == null || currencyCode == null) return null

    return resolveMinorAndCurrencyFieldsToMoney(
      { minor, currencyCode },
      args,
      context,
      info
    )
  },
})

export const ResaleSubmissionType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "ResaleSubmission",
    description:
      "A collector’s request to resell a work from their My Collection.",
    fields: () => ({
      ...InternalIDFields,
      canceledAt: date(),
      channel: {
        type: ResaleSubmissionChannelEnum,
        description: "Auction, marketplace, or null if rejected.",
      },
      courierHandoff: {
        type: ResaleSubmissionCourierHandoffEnum,
        description:
          "The seller’s answer to how the work will get to its buyer.",
        resolve: ({ courier_handoff }) => courier_handoff,
      },
      createdAt: date(),
      missingRequirements: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(GraphQLString))
        ),
        description:
          "Answers still needed before the submission can be listed.",
        resolve: ({ missing_requirements }) => missing_requirements ?? [],
      },
      packaging: {
        type: ResaleSubmissionPackagingEnum,
        description: "The seller’s answer to how the work will be packed.",
      },
      packer: {
        type: ResaleSubmissionPackerEnum,
        description: "The seller’s answer to who will pack the work.",
      },
      priceListed: {
        ...moneyFromMinorField("price_listed_minor"),
        description: "The seller’s asking price.",
      },
      recommendedPriceMax: {
        ...moneyFromMinorField("recommended_price_max_minor"),
        description:
          "Upper end of recommended price range, per automated valuation.",
      },
      recommendedPriceMin: {
        ...moneyFromMinorField("recommended_price_min_minor"),
        description:
          "Lower end of recommended price range, per automated valuation.",
      },
      rejectionReasons: {
        type: new GraphQLNonNull(
          new GraphQLList(
            new GraphQLNonNull(ResaleSubmissionRejectionReasonEnum)
          )
        ),
        description: "Why the submission was rejected.",
        resolve: ({ rejection_reasons }) => rejection_reasons ?? [],
      },
      state: {
        type: new GraphQLNonNull(ResaleSubmissionStateEnum),
      },
      submittedArtwork: {
        type: ArtworkType,
        description: "The My Collection artwork being resold.",
        resolve: async (
          { submitted_artwork_id },
          _args,
          { meMyCollectionArtworksLoader }
        ) => {
          if (!meMyCollectionArtworksLoader) return null

          const { body } = await meMyCollectionArtworksLoader({
            artworks: [submitted_artwork_id],
            size: 1,
          })

          return body[0] ?? null
        },
      },
      submittedArtworkID: {
        type: new GraphQLNonNull(GraphQLString),
        description: "ID of the My Collection artwork being resold.",
        resolve: ({ submitted_artwork_id }) => submitted_artwork_id,
      },
      updatedAt: date(),
    }),
  }
)
