import {
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CollectionType } from "./collection"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateCollectionSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    collection: {
      type: CollectionType,
      resolve: async (response) => {
        return response
      },
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateCollectionFailure",
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
  name: "CreateCollectionResponseOrError",
  types: [SuccessType, ErrorType],
})

interface InputProps {
  name: string
  shareableWithPartners: boolean
}

export const createCollectionMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "createCollection",
  description: "Create a collection",
  inputFields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    shareableWithPartners: { type: GraphQLBoolean },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, context) => {
    if (!context.createCollectionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await context.createCollectionLoader({
        name: args.name,
        user_id: context.userID,
        saves: true,
        shareable_with_partners: args.shareableWithPartners,
      })

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
