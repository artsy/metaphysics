import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import config from "config"
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
    publicURL: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id, filename, catalog_artwork_id }) => {
        const ext = filename.split(".").pop()
        return `${config.GRAVITY_API_BASE}/catalog_artwork_document/${id}.${ext}?catalog_artwork_id=${catalog_artwork_id}`
      },
    },
    createdAt: date(),
    updatedAt: date(),
  },
})
