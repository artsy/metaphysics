import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
} from "graphql"
import GraphQLJSON from "graphql-type-json"

const ErrorType = new GraphQLObjectType({
  name: "Error",
  fields: {
    code: {
      type: new GraphQLNonNull(GraphQLString),
    },
    data: {
      type: GraphQLJSON,
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
    },
    path: {
      type: new GraphQLList(GraphQLString),
    },
  },
})

export const ErrorsType = new GraphQLObjectType({
  name: "Errors",
  fields: {
    errors: {
      type: new GraphQLList(ErrorType),
    },
  },
})
