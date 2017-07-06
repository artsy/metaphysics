import date from "schema/fields/date"
import { has } from "lodash"
import { GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLNonNull } from "graphql"
import { GlobalIDField, NodeInterface } from "schema/object_identification"
import { AttachmentType } from "./attachment"

export const MessageType = new GraphQLObjectType({
  name: "Message",
  description: "A message in a conversation.",
  interfaces: [NodeInterface],
  isTypeOf: obj => has(obj, "raw_text") && has(obj, "from_email_address"),
  fields: {
    __id: GlobalIDField,
    id: {
      description: "Impulse message id.",
      type: new GraphQLNonNull(GraphQLString),
    },
    is_from_user: {
      description: "True if message is from the user to the partner.",
      type: GraphQLBoolean,
      resolve: ({ from_email_address, conversation_from_address }) => {
        return from_email_address === conversation_from_address
      },
    },
    from_email_address: {
      type: GraphQLString,
    },
    raw_text: {
      description: "Full unsanitized text.",
      type: new GraphQLNonNull(GraphQLString),
    },
    attachments: {
      type: new GraphQLList(AttachmentType),
    },
    created_at: date,
  },
})
