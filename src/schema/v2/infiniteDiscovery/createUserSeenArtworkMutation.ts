import { mutationWithClientMutationId } from "graphql-relay"
import {
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
import { snakeCase } from "lodash"

interface Input {
  artworkId: string
}

const inputFields = {
  artworkId: { type: new GraphQLNonNull(GraphQLString) },
}

interface GravityInput {
  artwork_id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateUserSeenArtworkSuccess",
  isTypeOf: (data) => data.artwork_id,
  fields: {
    artworkId: {
      type: GraphQLString,
      resolve: ({ artwork_id }) => artwork_id,
    },
  },
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateUserSeenArtworkFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateUserSeenArtworkSuccessResponseOrError",
  types: [SuccessType, FailureType],
})

export const createUserSeenArtworkMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CreateUserSeenArtwork",
  description:
    "Marks an artwork as seen when a user swipes through Infinite Discovery.",
  inputFields,
  outputFields: {
    userSeenArtworkOrError: {
      type: ResponseOrErrorType,
      description: "On success: the created User Seen Artwork.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createUserSeenArtworkLoader }) => {
    if (!createUserSeenArtworkLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const createUserSeenArtworkLoaderPayload = Object.keys(args)
      .filter((key) => key !== "id")
      .reduce(
        (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
        {} as GravityInput
      )

    try {
      return await createUserSeenArtworkLoader(
        createUserSeenArtworkLoaderPayload
      )
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
