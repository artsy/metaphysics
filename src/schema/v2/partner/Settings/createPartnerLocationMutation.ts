import {
  GraphQLBoolean,
  GraphQLEnumType,
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
import { LocationType } from "../../location"

interface Input {
  partnerId: string
  addressType: string
  country: string
  address: string
  address2?: string
  city: string
  state?: string
  postalCode: string
  email?: string
  phone?: string
  publiclyViewable?: boolean
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerLocationSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    location: {
      type: LocationType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerLocationFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerLocationOrError",
  types: [SuccessType, FailureType],
})

export const CreatePartnerLocationMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CreatePartnerLocation",
  description: "Creates a new location for a partner",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner",
    },
    addressType: {
      type: new GraphQLEnumType({
        name: "locationType",
        values: {
          BUSINESS: { value: "Business" },
          TEMPORARY: { value: "Temporary" },
          OTHER: { value: "Other" },
        },
      }),
    },
    country: {
      type: GraphQLString,
    },
    address: {
      type: GraphQLString,
    },
    address2: {
      type: GraphQLString,
    },
    city: {
      type: GraphQLString,
    },
    state: {
      type: GraphQLString,
    },
    postalCode: {
      type: GraphQLString,
    },
    email: {
      type: GraphQLString,
      description: "Primary email of given location",
    },
    phone: {
      type: GraphQLString,
      description: "Primary phone of given location",
    },
    publiclyViewable: {
      type: GraphQLBoolean,
      description:
        "Boolean flag that denotes whether a location is publicly viewable on Partner's Artsy Profile",
    },
  },
  outputFields: {
    partnerLocationOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      addressType,
      address,
      address2,
      city,
      state,
      country,
      postalCode,
      email,
      phone,
      publiclyViewable,
      partnerId,
    },
    { createPartnerLocationLoader }
  ) => {
    if (!createPartnerLocationLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await createPartnerLocationLoader(partnerId, {
        address,
        address_2: address2,
        address_type: addressType,
        city,
        country,
        email,
        phone,
        postal_code: postalCode,
        publicly_viewable: publiclyViewable,
        state,
      })

      return response
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
