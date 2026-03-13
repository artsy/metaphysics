import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"

interface Input {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteMailchimpAccountSuccess",
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: ({ success }) => success,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteMailchimpAccountFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteMailchimpAccountResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "DeleteMailchimpAccountFailure"
    }
    return "DeleteMailchimpAccountSuccess"
  },
})

export const deleteMailchimpAccountMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "DeleteMailchimpAccount",
  description: "Disconnect a Mailchimp account from a partner",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the Mailchimp account to delete",
    },
  },
  outputFields: {
    mailchimpAccountOrError: {
      type: ResponseOrErrorType,
      description: "On success: a boolean indicating the account was deleted",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteMailchimpAccountLoader }) => {
    if (!deleteMailchimpAccountLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await deleteMailchimpAccountLoader(id)
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
