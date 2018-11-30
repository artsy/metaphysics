import { GraphQLString, GraphQLObjectType } from "graphql"

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
    error: {
      type: GraphQLString,
    },
  }),
})

export const formatGravityError = error => {
  const errorSplit = error.message.split(" - ")

  if (errorSplit && errorSplit.length > 1) {
    try {
      const parsedError = JSON.parse(errorSplit[1])
      if (parsedError.error) {
        return {
          type: "error",
          message: parsedError.error,
          detail: parsedError.text,
        }
      } else {
        return { ...parsedError }
      }
    } catch (e) {
      return { message: errorSplit[1] }
    }
  } else {
    return null
  }
}
