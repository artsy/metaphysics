import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ResaleSubmissionRecord } from "lib/loaders/loaders_with_authentication/resaleSubmissionStubs"
import { ArtworkType } from "schema/v2/artwork"
import { date } from "schema/v2/fields/date"
import { InternalIDFields } from "schema/v2/object_identification"

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
