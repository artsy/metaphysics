import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFieldConfig,
  GraphQLBoolean,
  GraphQLList,
} from "graphql"
import { InternalIDFields, NodeInterface } from "../object_identification"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import GraphQLJSON from "graphql-type-json"
import { ArtistType } from "../artist"
import { ArtworkType } from "../artwork"

const ArtworkImportRowErrorType = new GraphQLObjectType({
  name: "ArtworkImportRowError",
  fields: {
    ...InternalIDFields,
    errorType: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ error_type }) => error_type,
    },
    metadata: {
      type: GraphQLJSON,
    },
  },
})

const ArtworkImportRowImageType = new GraphQLObjectType({
  name: "ArtworkImportRowImage",
  fields: {
    ...InternalIDFields,
    fileName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ file_name }) => file_name,
    },
    s3Key: {
      type: GraphQLString,
      resolve: ({ s3_key }) => s3_key,
    },
    s3Bucket: {
      type: GraphQLString,
      resolve: ({ s3_bucket }) => s3_bucket,
    },
  },
})

const ArtworkImportRowType = new GraphQLObjectType({
  name: "ArtworkImportRow",
  fields: {
    ...InternalIDFields,
    artwork: {
      type: ArtworkType,
    },
    artists: {
      type: new GraphQLList(new GraphQLNonNull(ArtistType)),
    },
    rawData: {
      type: new GraphQLNonNull(GraphQLJSON),
      resolve: ({ raw_data }) => raw_data,
    },
    errors: {
      type: new GraphQLNonNull(
        GraphQLList(new GraphQLNonNull(ArtworkImportRowErrorType))
      ),
      resolve: ({ artwork_import_row_errors }) => artwork_import_row_errors,
    },
    images: {
      type: new GraphQLNonNull(
        GraphQLList(new GraphQLNonNull(ArtworkImportRowImageType))
      ),
      resolve: ({ artwork_import_row_images }) => artwork_import_row_images,
    },
  },
})

const ArtworkImportRowConnectionType = connectionWithCursorInfo({
  nodeType: ArtworkImportRowType,
}).connectionType

export const ArtworkImportType = new GraphQLObjectType({
  name: "ArtworkImport",
  interfaces: [NodeInterface],
  fields: {
    ...InternalIDFields,
    fileName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ file_name }) => file_name,
    },
    unmatchedArtistNames: {
      type: new GraphQLNonNull(GraphQLList(new GraphQLNonNull(GraphQLString))),
      resolve: async (
        { id },
        _args,
        { artworkImportUnmatchedArtistNamesLoader }
      ) => {
        if (!artworkImportUnmatchedArtistNamesLoader) return []

        const {
          unmatched_artist_names,
        } = await artworkImportUnmatchedArtistNamesLoader(id)

        return unmatched_artist_names
      },
    },
    rowsConnection: {
      type: ArtworkImportRowConnectionType,
      args: pageable({
        hasErrors: {
          type: GraphQLBoolean,
        },
        errorTypes: {
          type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
        },
      }),
      resolve: async ({ id }, args, { artworkImportRowsLoader }) => {
        const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
        const { body, headers } = await artworkImportRowsLoader(id, {
          size,
          offset,
          has_errors: args.hasErrors,
          error_types: args.errorTypes,
          total_count: true,
        })

        const totalCount = parseInt(headers["x-total-count"] || "0", 10)

        return paginationResolver({
          totalCount,
          offset,
          page,
          size,
          body,
          args,
        })
      },
    },
  },
})

export const ArtworkImport: GraphQLFieldConfig<any, ResolverContext> = {
  type: ArtworkImportType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_parent, { id }, { artworkImportLoader }) => {
    if (!artworkImportLoader) return null

    return artworkImportLoader(id)
  },
}

export const ArtworkImportsConnectionType = connectionWithCursorInfo({
  nodeType: ArtworkImportType,
}).connectionType
