import {
  GraphQLInputObjectType,
  GraphQLInt,
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
import { snakeCaseKeys } from "lib/helpers"
import { omitBy, isUndefined } from "lodash"
import { CatalogArtworkType } from "schema/v2/catalogArtwork"
import { ResolverContext } from "types/graphql"

const UpdateCatalogArtworkInputType = new GraphQLInputObjectType({
  name: "UpdateCatalogArtworkInput",
  fields: {
    artworkID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID (slug) of the artwork.",
    },
    medium: {
      type: GraphQLString,
      description: "Medium of the artwork.",
    },
    availability: {
      type: GraphQLString,
      description: "Availability of the artwork.",
    },
    priceCurrency: {
      type: GraphQLString,
      description: "Price currency (ISO 4217).",
    },
    priceMinor: {
      type: GraphQLInt,
      description: "Price in minor currency units (e.g., cents).",
    },
    privateNotes: {
      type: GraphQLString,
      description: "Private notes about the artwork.",
    },
  },
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCatalogArtworkSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    catalogArtwork: {
      type: CatalogArtworkType,
      resolve: (catalogArtwork) => catalogArtwork,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCatalogArtworkFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateCatalogArtworkResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateCatalogArtworkMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateCatalogArtwork",
  description:
    "Creates or updates a catalog artwork for a given artwork. Requires partner or partner support permissions.",
  inputFields: UpdateCatalogArtworkInputType.getFields(),
  outputFields: {
    catalogArtworkOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      artworkID,
      medium,
      availability,
      priceCurrency,
      priceMinor,
      privateNotes,
    },
    { updateCatalogArtworkLoader }
  ) => {
    if (!updateCatalogArtworkLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const gravityParams = snakeCaseKeys(
        omitBy(
          { medium, availability, priceCurrency, priceMinor, privateNotes },
          isUndefined
        )
      )

      const result = await updateCatalogArtworkLoader(artworkID, gravityParams)
      return result
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
