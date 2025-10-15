import {
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
import { ArtistType } from "./index"

const DeleteArtistSuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteArtistSuccess",
  isTypeOf: (data) => {
    return data.id
  },
  fields: () => ({
    artist: {
      type: ArtistType,
      resolve: (artist) => artist,
    },
  }),
})

const DeleteArtistFailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteArtistFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const SuccessOrErrorType = new GraphQLUnionType({
  name: "DeleteArtistSuccessOrErrorType",
  types: [DeleteArtistSuccessType, DeleteArtistFailureType],
})

export const deleteArtistMutation = mutationWithClientMutationId({
  name: "DeleteArtist",
  description: "Delete an artist",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    artistOrError: {
      type: SuccessOrErrorType,
      description:
        "Success or Error, on success the deleted Artist is returned",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: ({ id }, { deleteArtistLoader }) => {
    if (!deleteArtistLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return deleteArtistLoader(id).catch((error) => {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    })
  },
})
