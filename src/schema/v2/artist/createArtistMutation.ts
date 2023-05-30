import { GraphQLNonNull, GraphQLString, GraphQLUnionType } from "graphql"
import { GraphQLObjectType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { snakeCase } from "lodash"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "."

interface CreateArtistInput {
  birthday: string
  deathday: string
  displayName: string
  first: string
  isPersonalArtist: boolean
  last: string
  middle: string
  nationality: string
}

const CreateArtistSuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtistSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    artist: {
      type: ArtistType,
      resolve: (artist) => artist,
    },
  }),
})

const CreateArtistFailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtistFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const SuccessOrErrorType = new GraphQLUnionType({
  name: "CreateArtistSuccessOrErrorType",
  types: [CreateArtistSuccessType, CreateArtistFailureType],
})

export const createArtistMutation = mutationWithClientMutationId<
  CreateArtistInput,
  any | null,
  ResolverContext
>({
  name: "CreateArtistMutation",
  description: "Create an artist",
  inputFields: {
    birthday: { type: GraphQLString },
    deathday: { type: GraphQLString },
    displayName: { type: new GraphQLNonNull(GraphQLString) },
    first: { type: GraphQLString },
    last: { type: GraphQLString },
    middle: { type: GraphQLString },
    nationality: { type: GraphQLString },
  },
  outputFields: {
    artistOrError: {
      type: SuccessOrErrorType,
      description: "Success or Error, where on success Artist is returned",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createArtistLoader }) => {
    if (!createArtistLoader) {
      throw new Error("You need to be logged in to perform this action")
    }

    const gravityPayload = Object.keys(args).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
      {} as any
    )

    try {
      return await createArtistLoader(gravityPayload)
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
