import { GraphQLObjectType, GraphQLString, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/object_identification"

export const AttachmentType = new GraphQLObjectType<any, ResolverContext>({
  name: "Attachment",
  description: "Fields of an attachment (currently from Radiation)",
  fields: {
    ...InternalIDFields,
    content_type: {
      description: "Content type of file.",
      type: new GraphQLNonNull(GraphQLString),
    },
    file_name: {
      description: "File name.",
      type: new GraphQLNonNull(GraphQLString),
    },
    download_url: {
      descrpition: "URL of attachment.",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})
