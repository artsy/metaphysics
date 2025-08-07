import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtworkImportType } from "./artworkImport"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    artworkImport: {
      type: ArtworkImportType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtworkImportResponseOrError",
  types: [SuccessType, FailureType],
})

export const UpdateArtworkImportMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateArtworkImport",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    locationID: {
      type: GraphQLString,
    },
  },
  outputFields: {
    updateArtworkImportOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, locationID },
    { artworkImportUpdateLoader }
  ) => {
    if (!artworkImportUpdateLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      return await artworkImportUpdateLoader(artworkImportID, {
        location_id: locationID,
      })
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
