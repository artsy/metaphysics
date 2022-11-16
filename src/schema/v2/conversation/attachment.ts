import { GraphQLObjectType, GraphQLString, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/v2/object_identification"

export const AttachmentType = new GraphQLObjectType<any, ResolverContext>({
  name: "Attachment",
  description: "Fields of an attachment (currently from Radiation)",
  fields: {
    ...InternalIDFields,
    contentType: {
      description: "Content type of file.",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ content_type }) => content_type,
    },
    fileName: {
      description: "File name.",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ file_name }) => file_name,
    },
    downloadURL: {
      description: "URL of attachment.",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ download_url }) => download_url,
    },
  },
})
