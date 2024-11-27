import { GraphQLID, GraphQLInputObjectType, GraphQLNonNull } from "graphql"

export const ARImageInputType = new GraphQLInputObjectType({
  name: "ARImageInput",
  fields: {
    internalID: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
})
