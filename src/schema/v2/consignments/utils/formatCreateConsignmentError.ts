import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"

export const ConsignmentInquiryMutationErrorName =
  "ConsignmentInquiryMutationError"

export const ConsignmentInquiryErrorType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: ConsignmentInquiryMutationErrorName,
  fields: () => ({
    type: {
      type: GraphQLString,
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
    },
    error: {
      type: GraphQLString,
    },
    statusCode: {
      type: GraphQLInt,
    },
  }),
})

export const formatCreateConsignmentError = (error) => {
  return formatGravityError(error)
}
