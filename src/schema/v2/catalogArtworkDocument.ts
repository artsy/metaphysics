import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "./object_identification"
import { date } from "./fields/date"

export const CatalogArtworkDocumentType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CatalogArtworkDocument",
  fields: {
    ...InternalIDFields,
    catalogArtworkId: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ catalog_artwork_id }) => catalog_artwork_id,
    },
    filename: {
      type: new GraphQLNonNull(GraphQLString),
    },
    title: {
      type: GraphQLString,
    },
    fileSize: {
      type: GraphQLInt,
      resolve: ({ file_size }) => file_size,
    },
    url: {
      type: new GraphQLNonNull(GraphQLString),
    },
    createdAt: date(),
    updatedAt: date(),
  },
})
