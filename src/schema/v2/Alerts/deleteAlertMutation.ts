import {
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { AlertType } from "./"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteAlertSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    alert: {
      type: AlertType,
      resolve: async ({ search_criteria, id, ...rest }) => {
        return {
          ...search_criteria,
          id, // Inject the ID from the `UserSearchCriteria` object
          settings: rest,
        }
      },
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteAlertFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteAlertResponseOrError",
  types: [SuccessType, ErrorType],
})

export const deleteAlertMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "deleteAlert",
  description: "Deletes an alert",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { meDeleteAlertLoader }) => {
    if (!meDeleteAlertLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await meDeleteAlertLoader(id)

      return response
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
