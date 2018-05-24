import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { OrderType } from "schema/me/order"
import { mutationWithClientMutationId } from "graphql-relay"

export const ShippingAddressInputType = new GraphQLInputObjectType({
  name: "ShippingAddressInput",
  fields: {
    name: {
      type: GraphQLString,
    },
    street: {
      type: GraphQLString,
    },
    city: {
      type: GraphQLString,
    },
    region: {
      type: GraphQLString,
    },
    postal_code: {
      type: GraphQLString,
    },
    country: {
      type: GraphQLString,
    },
    use_id: {
      type: GraphQLString,
    },
  },
})

export const OrderInputType = new GraphQLInputObjectType({
  name: "OrderInput",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Order to be updated",
    },
    email: {
      type: GraphQLString,
      description: "Email address, required of an unauthenticated user",
    },
    notes: {
      type: GraphQLString,
      description: "Additional notes",
    },
    reserve: {
      type: GraphQLBoolean,
      description: "Whether or not to put the order on reserve",
    },
    session_id: {
      type: GraphQLString,
      description: "Session ID necessary if there is no user present",
    },
    shipping_address: {
      type: ShippingAddressInputType,
    },
    telephone: {
      type: GraphQLString,
      description: "Buyer's telephone",
    },
  },
})

export default mutationWithClientMutationId({
  name: "UpdateOrder",
  description: "Update an order",
  inputFields: OrderInputType.getFields(),
  outputFields: {
    order: {
      type: OrderType,
      resolve: order => order,
    },
  },
  mutateAndGetPayload: (
    {
      id,
      email,
      notes,
      reserve,
      session_id,
      shipping_address: {
 name, street, city, region, postal_code, use_id,
},
      telephone,
    },
    request,
    { rootValue: { accessToken, updateOrderLoader } },
  ) => {
    if (!accessToken) {
      if (!session_id) {
        return new Error("This action requires a session_id.")
      }
    }

    return updateOrderLoader(id, {
      email,
      notes,
      reserve,
      session_id,
      shipping_address: {
 name, street, city, region, postal_code, use_id,
},
      telephone,
    })
  },
})
