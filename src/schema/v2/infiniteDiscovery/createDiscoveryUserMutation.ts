import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { mutationWithClientMutationId } from "graphql-relay"
import { generateUuid } from "./discoverArtworks"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DiscoveryUserMutationSuccess",
  isTypeOf: (data) => data.success,
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: (result) => result.success,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DiscoveryUserMutationFailure",
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
  name: "CreateDiscoveryUserResponseOrError",
  types: [SuccessType, FailureType],
})

export const CreateDiscoveryUserMutation = mutationWithClientMutationId<
  { userId: string },
  any,
  ResolverContext
>({
  name: "CreateDiscoveryUserMutation",
  description: "Creates a user object in weaviate",
  inputFields: {
    userId: {
      description: "The user's ID",
      type: GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    createDiscoveryUserReferenceResponseOrError: {
      type: ResponseOrErrorType,
      description: "On success: return boolean. On failure: MutationError.",
      resolve: (result) => {
        return result
      },
    },
  },
  mutateAndGetPayload: async ({ userId }, { weaviateCreateObjectLoader }) => {
    if (!weaviateCreateObjectLoader) {
      new Error("Weaviate loader not available")
    }

    const uuid = generateUuid(userId)

    const body = {
      class: "InfiniteDiscoveryUser",
      id: uuid,
    }

    try {
      await weaviateCreateObjectLoader(null, body)
      return { success: true }
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
