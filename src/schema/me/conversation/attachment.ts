import { GraphQLObjectType, GraphQLString, GraphQLNonNull } from "graphql"

export const AttachmentType = new GraphQLObjectType({
  name: "Attachment",
  description: "Fields of an attachment (currently from Radiation)",
  fields: {
    id: {
      description: "Attachment id.",
      type: new GraphQLNonNull(GraphQLString),
    },
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
