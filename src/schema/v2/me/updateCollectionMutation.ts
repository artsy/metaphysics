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
  name: "UpdateCollectionSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    collection: {
      type: CollectionType,
      resolve: (response) => {
        return response
      },
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCollectionFailure",
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
  name: "UpdateCollectionResponseOrError",
  types: [SuccessType, ErrorType],
})

interface InputProps {
  id: string
  name: string
  shareableWithPartners: boolean
  private: boolean
}

export const updateCollectionMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "updateCollection",
  description: "Update a collection",
  inputFields: {
    id: {
      description: "The internal ID of the collection",
      type: new GraphQLNonNull(GraphQLString),
    },
    name: { type: new GraphQLNonNull(GraphQLString) },
    shareableWithPartners: { type: GraphQLBoolean },
    private: { type: GraphQLBoolean },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, context) => {
    if (!context.updateCollectionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await context.updateCollectionLoader(args.id, {
        name: args.name,
        user_id: context.userID,
        shareable_with_partners: args.shareableWithPartners,
        private: args.private,
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
