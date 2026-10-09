import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtnetImportType } from "./artnetImport"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "FinalizeArtnetImportSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    artnetImport: {
      type: ArtnetImportType,
      resolve: (artnetImport) => artnetImport,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "FinalizeArtnetImportFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "FinalizeArtnetImportResponseOrError",
  types: [SuccessType, FailureType],
})

export const finalizeArtnetImportMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "FinalizeArtnetImport",
  description:
    "Finalize a completed Artnet import. Its artworks appear in the partner's inventory once the import reaches the FINALIZED state.",
  inputFields: {
    artnetImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    finalizeArtnetImportOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artnetImportID },
    { updateArtnetImportLoader }
  ) => {
    if (!updateArtnetImportLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      return await updateArtnetImportLoader(artnetImportID, {
        state: "finalized",
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
