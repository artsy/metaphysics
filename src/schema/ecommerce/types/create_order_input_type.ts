import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
} from "graphql"

export const CreateOrderInputType = new GraphQLInputObjectType({
  name: "CreateOrderInput",
  fields: {
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "BSON ID of artwork",
    },
    editionSetId: {
      type: GraphQLString,
      description: "ID of artwork's edition set",
    },
    quantity: {
      type: GraphQLInt,
      description: "quantity of artwork",
    },
  },
})

export const CreateOfferOrderInputType = new GraphQLInputObjectType({
  name: "CreateOrderInput",
  fields: {
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "BSON ID of artwork",
    },
    editionSetId: {
      type: GraphQLString,
      description: "ID of artwork's edition set",
    },
    quantity: {
      type: GraphQLInt,
      description: "quantity of artwork",
    },
    find_active_or_create: {
      type: GraphQLBoolean,
      description:
        "When set to true, we will not reuse existing pending/submitted order. Otherwise if current user has pending/submitted orders on same artwork/edition with same quantity, we will return that",
    },
  },
})
