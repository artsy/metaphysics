import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
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
      createdAt: date(),
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
      state: {
        type: new GraphQLNonNull(ResaleSubmissionStateEnum),
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
