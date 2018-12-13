import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from "graphql"
import { CancelReasonTypeEnum } from "./cancel_reason_type_enum"

export const RejectOfferMutationInputType = new GraphQLInputObjectType({
  name: "OfferMutationInput",
  fields: {
    offerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Offer ID",
    },
    rejectReason: {
      type: CancelReasonTypeEnum,
      description: "Reason for rejecting offer",
    },
  },
})
