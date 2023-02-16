import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { snakeCase } from "lodash"
import { ArtistType } from "./index"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

interface Input {
  displayName: string
  first: string
  id: string
  last: string
  middle: string
}

interface GravityInput {
  display_name: string
  first: string
  id: string
  last: string
  middle: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtistSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    artist: {
      type: ArtistType,
      resolve: (response) => response,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtistFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtistResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateArtistMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "UpdateArtistMutation",
  description: "Update the artist",
  inputFields: {
    displayName: { type: GraphQLString },
    first: { type: GraphQLString },
    id: { type: new GraphQLNonNull(GraphQLString) },
    last: { type: GraphQLString },
    middle: { type: GraphQLString },
  },
  outputFields: {
    artistOrError: {
      type: ResponseOrErrorType,
      description: "On success: the updated artist",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updateArtistLoader }) => {
    if (!updateArtistLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const updateArtistLoaderPayload = Object.keys(args)
      .filter((key) => key !== "id")
      .reduce(
        (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
        {} as GravityInput
      )

    try {
      return await updateArtistLoader(args.id, updateArtistLoaderPayload)
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
