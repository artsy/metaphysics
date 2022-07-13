import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from "graphql"
import { InternalIDFields } from "./object_identification"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "./fields/pagination"

export const PartnerArtistDocumentType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerArtistDocument",
  fields: {
    ...InternalIDFields,
    uri: {
      type: new GraphQLNonNull(GraphQLString),
    },
    filename: {
      type: new GraphQLNonNull(GraphQLString),
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})

export const PartnerArtistDocumentsConnection = connectionWithCursorInfo({
  nodeType: PartnerArtistDocumentType,
})
