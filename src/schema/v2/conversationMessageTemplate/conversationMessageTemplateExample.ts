import { GraphQLObjectType, GraphQLNonNull, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

export const ConversationMessageTemplateExampleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ConversationMessageTemplateExample",
  description: "A static example template to help users get started",
  fields: () => ({
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
    description: {
      type: GraphQLString,
    },
    body: {
      type: new GraphQLNonNull(GraphQLString),
    },
  }),
})

export const EXAMPLE_TEMPLATES = [
  {
    title: "General Inquiry",
    description: "Use for first-time inquiries",
    body:
      "Thank you for your interest in this piece. I would be happy to share additional information.",
  },
  {
    title: "Availability",
    description: "Respond to availability questions",
    body:
      "Thank you for your interest. While this particular work is no longer available, I would be happy to share similar works.",
  },
  {
    title: "Price",
    description: "Share pricing information",
    body:
      "Thank you for sharing your budget. I believe we can find something wonderful within your range.",
  },
]
