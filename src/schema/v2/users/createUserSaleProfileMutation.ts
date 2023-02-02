import {
  GraphQLBoolean,
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
import { UserSaleProfileType } from "../userSaleProfile"

interface Input {
  userId: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  requireBidderApproval?: boolean
}

interface GravityInput {
  user_id: string
  address_1?: string
  address_2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  require_bidder_approval?: boolean
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateUserSaleProfileSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    userSaleProfile: {
      type: UserSaleProfileType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateUserSaleProfileFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateUserSaleProfileResponseOrError",
  types: [SuccessType, FailureType],
})

export const createUserSaleProfileMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "CreateUserSaleProfileMutation",
  description: "Create a sale profile for a user",
  inputFields: {
    userId: { type: new GraphQLNonNull(GraphQLString) },
    addressLine1: { type: GraphQLString },
    addressLine2: { type: GraphQLString },
    city: { type: GraphQLString },
    state: { type: GraphQLString },
    zip: { type: GraphQLString },
    country: { type: GraphQLString },
    requireBidderApproval: { type: GraphQLBoolean },
  },
  outputFields: {
    userSaleProfileOrError: {
      type: ResponseOrErrorType,
      description: "On success: the user sale profile created.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createUserSaleProfileLoader }) => {
    if (!createUserSaleProfileLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const gravityOptions: GravityInput = {
      user_id: args.userId,
      address_1: args.addressLine1,
      address_2: args.addressLine2,
      city: args.city,
      country: args.country,
      state: args.state,
      zip: args.zip,
      require_bidder_approval: args.requireBidderApproval,
    }

    try {
      return await createUserSaleProfileLoader(gravityOptions)
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
