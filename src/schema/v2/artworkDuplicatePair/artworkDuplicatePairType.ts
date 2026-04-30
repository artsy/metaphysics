import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLEnumType,
} from "graphql"
import { IDFields } from "../object_identification"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "../artwork"
import { date } from "../fields/date"
import GraphQLJSON from "graphql-type-json"

export const ArtworkDuplicatePairStatusEnum = new GraphQLEnumType({
  name: "ArtworkDuplicatePairStatus",
  values: {
    OPEN: { value: "open" },
    DISMISSED: { value: "dismissed" },
    MERGED: { value: "merged" },
  },
})

export const ArtworkDuplicatePairType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtworkDuplicatePair",
  fields: () => ({
    ...IDFields,
    artwork1: {
      type: ArtworkType,
      resolve: ({ artwork_1_id }, _args, { artworkLoader }) => {
        return artworkLoader(artwork_1_id)
      },
    },
    artwork2: {
      type: ArtworkType,
      resolve: ({ artwork_2_id }, _args, { artworkLoader }) => {
        return artworkLoader(artwork_2_id)
      },
    },
    status: {
      type: new GraphQLNonNull(ArtworkDuplicatePairStatusEnum),
      resolve: ({ status }) => status,
    },
    similarityScore: {
      type: GraphQLFloat,
      resolve: ({ similarity_score }) => similarity_score,
    },
    detectionVersion: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ detection_version }) => detection_version,
    },
    matchMetadata: {
      type: GraphQLJSON,
      description:
        "Metadata from the duplicate detection process, just typed as JSON (for debugging)",
      resolve: ({ match_metadata }) => match_metadata,
    },
    mergeable: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ mergeable }) => mergeable,
    },
    dismissedAt: date(),
    mergedAt: date(),
    mergedIntoArtwork: {
      type: ArtworkType,
      resolve: ({ merged_into_artwork_id }, _args, { artworkLoader }) => {
        if (!merged_into_artwork_id) return null
        return artworkLoader(merged_into_artwork_id)
      },
    },
    mergeDetails: {
      type: GraphQLJSON,
      description:
        "Details about the merge operation, just typed as JSON (for debugging)",
      resolve: ({ merge_details }) => merge_details,
    },
    createdAt: date(undefined, true),
    updatedAt: date(undefined, true),
  }),
})
