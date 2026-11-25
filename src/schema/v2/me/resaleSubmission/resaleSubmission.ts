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
import { ImageType, normalizeImageData } from "../../image"
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

const STATUS_MESSAGES: Record<string, string> = {
  accepted: "In progress",
  auction_review: "Submitted",
  canceled: "Canceled",
  listed: "Submitted",
  rejected: "Previously rejected",
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
      conditionPhotos: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(ImageType))
        ),
        description:
          "Photos the seller added to show the work’s condition, oldest first.",
        resolve: ({ images }) => normalizeImageData(images ?? []),
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
      notes: {
        type: GraphQLString,
        description:
          "The seller’s free-text notes about the work: condition, history, provenance or anything else. Null until given.",
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
      statusMessage: {
        type: new GraphQLNonNull(GraphQLString),
        description:
          "A simple user-facing message to indicate the status of this submission, derived from current state.",
        resolve: ({ state }) => {
          const message = STATUS_MESSAGES[state]

          if (!message) {
            warn(`Unknown resale submission state: ${state}`)
            return ""
          }

          return message
        },
      },
      submittedArtwork: {
        type: ArtworkType,
        description: "The My Collection artwork being resold.",
        resolve: async ({ submitted_artwork_id }, _args, { artworkLoader }) => {
          try {
            return await artworkLoader(submitted_artwork_id)
          } catch (error) {
            if (error.statusCode === 404) return null
            throw error
          }
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
