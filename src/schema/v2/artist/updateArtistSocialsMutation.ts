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
  id: string
  instagramHandle?: string | null
}

interface GravityInput {
  instagram_handle?: string | null
}

const inputFields = {
  id: { type: new GraphQLNonNull(GraphQLString) },
  instagramHandle: {
    type: GraphQLString,
    description: "Artist's Instagram handle.",
  },
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtistSocialsSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    artist: {
      type: ArtistType,
      resolve: (response) => response,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtistSocialsFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtistSocialsResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateArtistSocialsMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "UpdateArtistSocialsMutation",
  description: "Update an artist's social handles.",
  inputFields,
  outputFields: {
    artistOrError: {
      type: ResponseOrErrorType,
      description: "On success: the updated artist",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updateArtistSocialsLoader }) => {
    if (!updateArtistSocialsLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const updateArtistSocialsLoaderPayload = Object.keys(args)
      .filter((key) => key !== "id")
      .reduce(
        (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] ?? "" }),
        {} as GravityInput
      )

    try {
      return await updateArtistSocialsLoader(
        args.id,
        updateArtistSocialsLoaderPayload
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
