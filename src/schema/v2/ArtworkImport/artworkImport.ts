import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFieldConfig,
} from "graphql"
import { InternalIDFields } from "../object_identification"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import GraphQLJSON from "graphql-type-json"

const ArtworkImportRowType = new GraphQLObjectType({
  name: "ArtworkImportRow",
  fields: {
    ...InternalIDFields,
    rawData: {
      type: new GraphQLNonNull(GraphQLJSON),
      resolve: ({ raw_data }) => raw_data,
    },
  },
})

const ArtworkImportRowConnectionType = connectionWithCursorInfo({
  nodeType: ArtworkImportRowType,
}).connectionType

export const ArtworkImportType = new GraphQLObjectType({
  name: "ArtworkImport",
  fields: {
    ...InternalIDFields,
    fileName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ file_name }) => file_name,
    },
    rowsConnection: {
      type: ArtworkImportRowConnectionType,
      args: pageable(),
      resolve: async ({ id }, args, { artworkImportRowsLoader }) => {
        const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
        const { body, headers } = await artworkImportRowsLoader(id, {
          size,
          offset,
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
