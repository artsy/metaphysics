import { GraphQLString, GraphQLInt, GraphQLObjectType } from "graphql"

export const GravityMutationErrorType = new GraphQLObjectType({
  name: "GravityMutationError",
  fields: () => ({
    type: {
      type: GraphQLString,
    },
    message: {
      type: GraphQLString,
    },
    detail: {
      type: GraphQLString,
    },
    statusCode: {
      type: GraphQLInt,
    },
    error: {
      type: GraphQLString,
    },
  }),
})

export const formatGravityError = error => {
  const errorSplit = error.message.split(" - ")
  const statusCode = error.statusCode

  if (errorSplit && errorSplit.length > 1) {
    try {
      return { ...JSON.parse(errorSplit[1]), statusCode }
    } catch (e) {
      return { message: errorSplit[1], statusCode }
    }
  } else {
    return null
  }
}
