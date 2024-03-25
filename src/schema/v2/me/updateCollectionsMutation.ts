import {
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { CollectionType } from "./collection"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { snakeCase } from "lodash"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCollectionsSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    collection: {
      type: CollectionType,
      resolve: (response) => response,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCollectionsFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateCollectionsResponseOrError",
  types: [SuccessType, FailureType],
})

export const CollectionsInputType = new GraphQLInputObjectType({
  name: "CollectionsInput",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    shareableWithPartners: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  },
})

export const updateCollectionsMutation = mutationWithClientMutationId<
  any,
  any | null,
  ResolverContext
>({
  name: "updateCollectionsMutation",
  description: "Updates the user's collections in batch.",
  inputFields: {
    attributes: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CollectionsInputType))
      ),
    },
  },
  outputFields: {
    collectionsOrErrors: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ResponseOrErrorType))
      ),
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { meUpdateCollectionsLoader }) => {
    if (!meUpdateCollectionsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const gravityPayload = args.attributes.map((collection) => {
      return Object.keys(collection).reduce(
        (acc, key) => ({ ...acc, [snakeCase(key)]: collection[key] }),
        {}
      )
    })

    try {
      return await meUpdateCollectionsLoader({
        attributes: JSON.stringify(gravityPayload),
      })
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return [{ ...formattedErr, _type: "GravityMutationError" }]
      } else {
        return [{ message: error.message, _type: "GravityMutationError" }]
      }
    }
  },
})
