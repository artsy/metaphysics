import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { GraphQLLong } from "lib/customTypes/GraphQLLong"
import { ResaleSubmissionRecord } from "lib/loaders/loaders_with_authentication/resaleSubmissionStubs"
import { ArtworkType } from "schema/v2/artwork"
import { date } from "schema/v2/fields/date"
import {
  Money,
  resolveMinorAndCurrencyFieldsToMoney,
} from "schema/v2/fields/money"
import { InternalIDFields } from "schema/v2/object_identification"
import { ARTSY_FEE_RATE, payoutFromMinor } from "./price"

export const ResaleSubmissionStateEnum = new GraphQLEnumType({
  name: "ResaleSubmissionState",
  values: {
    ACCEPTED: { value: "accepted" },
    LISTED: { value: "listed" },
    AUCTION_REVIEW: { value: "auction_review" },
    CANCELED: { value: "canceled" },
    REJECTED: { value: "rejected" },
  },
})

export const ResaleSubmissionChannelEnum = new GraphQLEnumType({
  name: "ResaleSubmissionChannel",
  values: {
    MARKETPLACE: { value: "marketplace" },
    AUCTION: { value: "auction" },
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

export const ResaleSubmissionPackagingEnum = new GraphQLEnumType({
  name: "ResaleSubmissionPackaging",
  values: {
    FRAMED: { value: "framed" },
    ROLLED: { value: "rolled" },
    NO_PREFERENCE: { value: "no_preference" },
  },
})

export const ResaleSubmissionPackerEnum = new GraphQLEnumType({
  name: "ResaleSubmissionPacker",
  values: {
    SELLER: { value: "seller" },
    COURIER: { value: "courier" },
    NO_PREFERENCE: { value: "no_preference" },
  },
})

export const ResaleSubmissionCourierHandoffEnum = new GraphQLEnumType({
  name: "ResaleSubmissionCourierHandoff",
  values: {
    SELLER_DROPOFF: { value: "seller_dropoff" },
    COURIER_PICKUP: { value: "courier_pickup" },
    NO_PREFERENCE: { value: "no_preference" },
  },
})

type MinorPriceKey =
  | "recommended_price_min_minor"
  | "recommended_price_max_minor"
  | "price_listed_minor"

// moneyMajorResolver turns a null amount into 0, so unset prices are checked here.
const moneyFromMinor = (
  key: MinorPriceKey
): GraphQLFieldConfig<ResaleSubmissionRecord, ResolverContext> => ({
  type: Money,
  resolve: (submission, args, context, info) => {
    const minor = submission[key]
    if (minor == null) return null

    return resolveMinorAndCurrencyFieldsToMoney(
      { minor, currencyCode: submission.price_currency_code },
      args,
      context,
      info
    )
  },
})

type PayoutBreakdown = ReturnType<typeof payoutFromMinor> & {
  price_currency_code: string
}

const payoutMoney = (
  key: "asking_price_minor" | "artsy_fee_minor" | "payout_minor"
): GraphQLFieldConfig<PayoutBreakdown, ResolverContext> => ({
  type: new GraphQLNonNull(Money),
  resolve: (breakdown, args, context, info) =>
    resolveMinorAndCurrencyFieldsToMoney(
      { minor: breakdown[key], currencyCode: breakdown.price_currency_code },
      args,
      context,
      info
    ),
})

const ResaleSubmissionPayoutBreakdownType = new GraphQLObjectType<
  PayoutBreakdown,
  ResolverContext
>({
  name: "ResaleSubmissionPayoutBreakdown",
  fields: {
    askingPrice: payoutMoney("asking_price_minor"),
    artsyFee: payoutMoney("artsy_fee_minor"),
    payout: {
      ...payoutMoney("payout_minor"),
      description: "What the collector receives: the asking price less the fee",
    },
  },
})

const payoutBreakdownField: GraphQLFieldConfig<
  ResaleSubmissionRecord,
  ResolverContext,
  { priceListedMinor?: number | null }
> = {
  type: ResaleSubmissionPayoutBreakdownType,
  description:
    "The payout for the saved asking price, or for priceListedMinor when given. Null when there is no price.",
  args: {
    priceListedMinor: {
      type: GraphQLLong,
      description:
        "Preview the payout for a price that isn't saved yet, in minor units (cents)",
    },
  },
  resolve: (
    { price_listed_minor, price_currency_code },
    { priceListedMinor }
  ) => {
    const minor = priceListedMinor ?? price_listed_minor
    if (minor == null) return null

    return { ...payoutFromMinor(minor), price_currency_code }
  },
}

export const ResaleSubmissionType = new GraphQLObjectType<
  ResaleSubmissionRecord,
  ResolverContext
>({
  name: "ResaleSubmission",
  description:
    "A collector's request to resell a work from their My Collection",
  fields: () => ({
    ...InternalIDFields,
    state: { type: new GraphQLNonNull(ResaleSubmissionStateEnum) },
    channel: {
      type: ResaleSubmissionChannelEnum,
      description: "The recommended sales channel. Null when rejected.",
    },
    rejectionReasons: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ResaleSubmissionRejectionReasonEnum))
      ),
      resolve: ({ rejection_reasons }) => rejection_reasons ?? [],
    },
    recommendedPriceMin: moneyFromMinor("recommended_price_min_minor"),
    recommendedPriceMax: moneyFromMinor("recommended_price_max_minor"),
    priceListed: {
      ...moneyFromMinor("price_listed_minor"),
      description: "The collector's asking price",
    },
    artsyFeeRate: {
      type: new GraphQLNonNull(GraphQLFloat),
      description: "The share of the sale price Artsy keeps, e.g. 0.15",
      resolve: () => ARTSY_FEE_RATE,
    },
    payoutBreakdown: payoutBreakdownField,
    packaging: { type: ResaleSubmissionPackagingEnum },
    packer: { type: ResaleSubmissionPackerEnum },
    courierHandoff: {
      type: ResaleSubmissionCourierHandoffEnum,
      resolve: ({ courier_handoff }) => courier_handoff,
    },
    submittedArtwork: {
      type: ArtworkType,
      resolve: (
        { _submitted_artwork, submitted_artwork_id },
        _args,
        { artworkLoader }
      ) => _submitted_artwork ?? artworkLoader(submitted_artwork_id),
    },
    createdAt: date(),
    updatedAt: date(),
    canceledAt: date(),
  }),
})

export const ResaleSubmissionField: GraphQLFieldConfig<
  void,
  ResolverContext,
  { id: string }
> = {
  type: ResaleSubmissionType,
  description: "One of the current user's resale submissions",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The resale submission's internalID",
    },
  },
  resolve: (_root, { id }, { resaleSubmissionLoader }) => {
    if (!resaleSubmissionLoader) return null

    return resaleSubmissionLoader(id)
  },
}
