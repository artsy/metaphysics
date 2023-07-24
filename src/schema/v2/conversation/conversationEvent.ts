import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { NodeInterface, InternalIDFields } from "../object_identification"

export const ConversationEventType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ConversationEvent",
  description: "An event (such as a submitted offer) in a conversation.",
  interfaces: [NodeInterface],
  fields: {
    ...InternalIDFields,
    sellerBody: {
      description: "Text for this event, formatted for the seller.",
      type: GraphQLString,
      resolve: ({ seller_body }) => seller_body,
    },
    buyerBody: {
      description: "Text for this event, formatted for the buyer.",
      type: GraphQLString,
      resolve: ({ buyer_body }) => buyer_body,
    },
    eventKey: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ event_key }) => event_key,
    },
  },
})
