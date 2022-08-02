import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { GraphQLObjectType } from "graphql"
import { InternalIDFields } from "./object_identification"
import { GraphQLUnionType } from "graphql"
interface Input {
  id: string
  artsyShippingDomestic: boolean | null
  artsyShippingInternational: boolean | null
  location: string | null
}

const UpdatePartnerArtworksMutationSuccessDetails = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "UpdatePartnerArtworksMutationSuccessDetails",
  fields: () => ({
    ...InternalIDFields,
    success: { type: GraphQLInt },
    errors: {
      type: new GraphQLObjectType({
        name: "PartnerArtworksError",
        fields: {
          count: { type: GraphQLInt },
          ids: { type: GraphQLList(GraphQLString) },
        },
      }),
    },
  }),
})

const UpdatePartnerArtworksMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "UpdatePartnerArtworksMutationSuccess",
  isTypeOf: (data) => data.success || data.errors,
  fields: () => ({
    partnerArtworks: {
      type: UpdatePartnerArtworksMutationSuccessDetails,
      resolve: (partnerArtworks) => partnerArtworks,
    },
  }),
})

const UpdatePartnerArtworksMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "UpdatePartnerArtworksMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const UpdatePartnerArtworksMutationType = new GraphQLUnionType({
  name: "UpdatePartnerArtworksMutationType",
  types: [
    UpdatePartnerArtworksMutationSuccessType,
    UpdatePartnerArtworksMutationFailureType,
  ],
})

export const updatePartnerArtworksMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "UpdatePartnerArtworksMutation",
  description: "Update all artworks that belong to the partner",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner",
    },
    artsyShippingDomestic: {
      type: GraphQLBoolean,
      description: "Whether Artsy domestic shipping should be enabled",
    },
    artsyShippingInternational: {
      type: GraphQLBoolean,
      description: "Whether Artsy international shipping should be enabled",
    },
    location: {
      type: GraphQLString,
      description: "The partner location ID to assign",
    },
  },
  outputFields: {
    partnerArtworksOrError: {
      type: UpdatePartnerArtworksMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, artsyShippingDomestic, artsyShippingInternational, location },
    { updatePartnerArtworksLoader }
  ) => {
    const gravityOptions = {
      artsy_shipping_domestic: artsyShippingDomestic,
      artsy_shipping_international: artsyShippingInternational,
      location,
    }

    try {
      return await updatePartnerArtworksLoader?.(id, gravityOptions)
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
