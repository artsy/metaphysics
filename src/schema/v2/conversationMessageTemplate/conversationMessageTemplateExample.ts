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
    internalID: "re-engage-collector", // for internal use
    title: "Re-Engage Collector",
    body: `Hi there, just wanted to check in to see if you had a chance to consider the work. Happy to hold it for you while you decide or share additional images if helpful. If you’re looking for something in a different price range or style, I can suggest a few options. Looking forward to hearing from you!`,
  },
  {
    internalID: "unavailable", // for internal use
    title: "Work Not Available",
    body: `Thanks for your interest in this artwork! Unfortunately it is no longer available.

Do you have a price range in mind or anything else specific that you’re looking for? I’d be happy to review other artworks currently available and share any that match your preferences. Looking forward to hearing from you!`,
  },
]
