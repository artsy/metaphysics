import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { InternalIDFields } from "../object_identification"
import { ResolverContext } from "types/graphql"
import { date } from "schema/v2/fields/date"

export const ArtnetImportStateType = new GraphQLEnumType({
  name: "ArtnetImportState",
  values: {
    PENDING: { value: "pending" },
    PROCESSING: { value: "processing" },
    COMPLETED: { value: "completed" },
    FAILED: { value: "failed" },
  },
})

const IN_PROGRESS_STATES = ["pending", "processing"]

export const ArtnetImportType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtnetImport",
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
    errorMessage: {
      type: GraphQLString,
      resolve: ({ error_message }) => error_message,
    },
    createdAt: date(),
    completedAt: date(),
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
