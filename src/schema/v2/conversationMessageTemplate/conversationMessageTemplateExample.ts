import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLID,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const ConversationMessageTemplateExampleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ConversationMessageTemplateExample",
  description: "A static example template to help users get started",
  fields: () => ({
    internalID: {
      type: GraphQLID,
      description:
        "Internal identifier for the example, used for tracking purposes",
    },
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
    internalID: "general", // for internal use
    title: "General Inquiry",
    body: `Thank you so much for reaching out and for your interest in this piece. I'd be happy to share more details with you, including pricing and shipping information.

We'd also love to learn a bit about your collecting journey. What drew you to this work? Do you collect this artist already or own any of their other pieces?

I look forward to hearing from you.`,
  },
  {
    internalID: "unavailable", // for internal use
    title: "Work Not Available",
    body: `Thank you for your interest in this piece! While this particular work is no longer available, I would be happy to source another suitable work for your collection.

Are you focused on works by this artist for now, or considering other artists as well? Any insight you could share regarding your preferences — such as budget, medium, dimensions, subject matter — would be most helpful.

I look forward to hearing from you and would be glad to continue the conversation.`,
  },
]
