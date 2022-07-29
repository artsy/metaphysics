import {
  GraphQLBoolean,
  GraphQLInt,
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

const PartnerArtworksRequestType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerArtworksRequest",
  fields: () => ({
    ...InternalIDFields,
    success: {
      type: GraphQLInt,
      resolve: (res) => {
        console.log(res)
        return res.success
      },
    },
    // error: {
    //   type: new GraphQLObjectType({
    //     name: "PartnerArtworksRequestError",
    //     fields: {
    //       count: { type: GraphQLInt },
    //       // ids: { type: GraphQLString }, // this is actually wrong, it should be an array of strings
    //     },
    //   }),
    // },
  }),
})

// "success": 0,
// "errors": {
// 	"count": 4,
// 	"ids": [
// 		"5c7ecd5ecb5b32002879ff59",
// 		"5c7ecd5e53241d002c6b30c0",
// 		"5c7ecd5ef5464e269088ff9f",
// 		"5ab3ea0b139b211428d47600"
// 	]
// }

const UpdatePartnerArtworksMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "UpdatePartnerArtworksMutationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerArtworksRequest: {
      type: PartnerArtworksRequestType,
      resolve: (partnerArtworksRequest) => {
        console.log(partnerArtworksRequest)
        return partnerArtworksRequest
      },
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
  any | null,
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
    // test again
    partnerArtworksRequestOrError: {
      type: UpdatePartnerArtworksMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: (
    { id, artsyShippingDomestic, artsyShippingInternational, location },
    { updatePartnerArtworksLoader }
  ) => {
    if (!updatePartnerArtworksMutation) {
      throw new Error(
        "You need to be signed in as an admin to perform this action"
      )
    }

    const gravityOptions = {
      artsy_shipping_domestic: artsyShippingDomestic,
      artsy_shipping_international: artsyShippingInternational,
      location,
    }
    return updatePartnerArtworksLoader?.(id, gravityOptions)
      .then((result) => result)
      .catch((error) => {
        const formattedErr = formatGravityError(error)
        if (formattedErr) {
          return { ...formattedErr, _type: "GravityMutationError" }
        } else {
          throw new Error(error)
        }
      })
  },
})
