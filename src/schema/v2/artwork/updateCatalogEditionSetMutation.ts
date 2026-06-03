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
import { CatalogEditionSetType } from "schema/v2/catalogEditionSet"
import { ResolverContext } from "types/graphql"

const UpdateCatalogEditionSetInputType = new GraphQLInputObjectType({
  name: "UpdateCatalogEditionSetInput",
  fields: {
    editionSetID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the edition set.",
    },
    availability: {
      type: GraphQLString,
      description: "Availability of the edition set.",
    },
    priceMinor: {
      type: GraphQLInt,
      description: "Price in minor currency units (e.g., cents).",
    },
  },
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCatalogEditionSetSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    catalogEditionSet: {
      type: CatalogEditionSetType,
      resolve: (catalogEditionSet) => catalogEditionSet,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCatalogEditionSetFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateCatalogEditionSetResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateCatalogEditionSetMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateCatalogEditionSet",
  description:
    "Updates a catalog edition set. Requires partner or partner support permissions.",
  inputFields: UpdateCatalogEditionSetInputType.getFields(),
  outputFields: {
    catalogEditionSetOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { editionSetID, availability, priceMinor },
    { updateCatalogEditionSetLoader }
  ) => {
    if (!updateCatalogEditionSetLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const gravityParams = snakeCaseKeys(
        omitBy({ availability, priceMinor }, isUndefined)
      )

      const result = await updateCatalogEditionSetLoader(
        editionSetID,
        gravityParams
      )
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
