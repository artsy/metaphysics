import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { InternalIDFields, NodeInterface } from "../object_identification"
import { ResolverContext } from "types/graphql"
import { date } from "schema/v2/fields/date"
import { ArtnetImportReviewArtworksConnection } from "./artnetImportReviewArtworks"

export const ArtnetImportStateType = new GraphQLEnumType({
  name: "ArtnetImportState",
  values: {
    PENDING: { value: "pending" },
    PROCESSING: { value: "processing" },
    COMPLETED: { value: "completed" },
    FINALIZING: { value: "finalizing" },
    FINALIZED: { value: "finalized" },
    FAILED: { value: "failed" },
  },
})

const IN_PROGRESS_STATES = ["pending", "processing"]

export const ArtnetImportType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtnetImport",
  interfaces: [NodeInterface],
  fields: () => ({
    ...InternalIDFields,
    state: {
      type: ArtnetImportStateType,
    },
    totalCount: {
      type: GraphQLInt,
      resolve: ({ total_count }) => total_count,
    },
    createdCount: {
      type: GraphQLInt,
      resolve: ({ created_count }) => created_count,
    },
    skippedCount: {
      type: GraphQLInt,
      resolve: ({ skipped_count }) => skipped_count,
    },
    deletedCount: {
      type: GraphQLInt,
      resolve: ({ deleted_count }) => deleted_count,
    },
    errorCount: {
      type: GraphQLInt,
      resolve: ({ error_count }) => error_count,
    },
    linkedCount: {
      type: GraphQLInt,
      description:
        "Artnet works linked to an artwork the partner already had, without creating a new one.",
      resolve: ({ linked_count }) => linked_count,
    },
    reviewCount: {
      type: GraphQLInt,
      description:
        "Created artworks that might duplicate an existing artwork and need the partner's review.",
      resolve: ({ review_count }) => review_count,
    },
    openReviewCount: {
      type: GraphQLInt,
      description:
        "Created artworks that still have at least one possible duplicate waiting for the partner's review.",
      resolve: ({ open_review_count }) => open_review_count,
    },
    awaitingArtistCount: {
      type: GraphQLInt,
      description:
        "Artnet works not yet created because their artist hasn't been assigned.",
      resolve: ({ awaiting_artist_count }) => awaiting_artist_count,
    },
    errorMessage: {
      type: GraphQLString,
      resolve: ({ error_message }) => error_message,
    },
    createdAt: date(),
    completedAt: date(),
    finalizedAt: date(),
    reviewArtworksConnection: ArtnetImportReviewArtworksConnection,
    unmatchedArtistNames: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      resolve: async (
        { id, state },
        _args,
        { artnetImportUnmatchedArtistNamesLoader }
      ) => {
        if (!artnetImportUnmatchedArtistNamesLoader) return []
        if (IN_PROGRESS_STATES.includes(state)) return []

        const {
          unmatched_artist_names,
        } = await artnetImportUnmatchedArtistNamesLoader(id)

        return unmatched_artist_names
      },
    },
  }),
})

export const ArtnetImport: GraphQLFieldConfig<any, ResolverContext> = {
  type: ArtnetImportType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_parent, { id }, { artnetImportLoader }) => {
    if (!artnetImportLoader) return null

    return artnetImportLoader(id)
  },
}
