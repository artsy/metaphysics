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
  name: "UpdateArtworkImportCurrencySuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    artworkImport: {
      type: ArtworkImportType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportCurrencyFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtworkImportCurrencyResponseOrError",
  types: [SuccessType, FailureType],
})

export const UpdateArtworkImportCurrencyMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateArtworkImportCurrency",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fromCurrency: {
      type: new GraphQLNonNull(GraphQLString),
    },
    toCurrency: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    updateArtworkImportCurrencyOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, fromCurrency, toCurrency },
    { artworkImportUpdateCurrencyLoader }
  ) => {
    if (!artworkImportUpdateCurrencyLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      return await artworkImportUpdateCurrencyLoader(artworkImportID, {
        from_currency: fromCurrency,
        to_currency: toCurrency,
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
