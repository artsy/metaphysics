import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

interface Input {
  id: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  requireBidderApproval?: boolean
}

interface GravityInput {
  id: string
  address_1?: string
  address_2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  require_bidder_approval?: boolean
}

interface GravityError {
  statusCode: number
  body: { error?: string; text?: string; message?: string }
}

export const updateUserSaleProfileMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "UpdateUserSaleProfileMutation",
  description: "Update the user sale profile",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    addressLine1: { type: GraphQLString },
    addressLine2: { type: GraphQLString },
    city: { type: GraphQLString },
    state: { type: GraphQLString },
    zip: { type: GraphQLString },
    country: { type: GraphQLString },
    requireBidderApproval: { type: GraphQLBoolean },
  },
  outputFields: {},
  mutateAndGetPayload: async (args, { updateUserSaleProfileLoader }) => {
    if (!updateUserSaleProfileLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const gravityOptions: GravityInput = {
      address_1: args.addressLine1,
      address_2: args.addressLine2,
      city: args.city,
      country: args.country,
      id: args.id,
      state: args.state,
      zip: args.zip,
      require_bidder_approval: args.requireBidderApproval,
    }

    try {
      return await updateUserSaleProfileLoader?.(args.id, gravityOptions)
    } catch (err) {
      if ("body" in (err as any)) {
        const e = err as GravityError
        throw new Error(e.body.text ?? e.body.error ?? e.body.message)
      }

      throw err
    }
  },
})
