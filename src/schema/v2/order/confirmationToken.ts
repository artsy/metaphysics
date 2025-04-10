import {
  GraphQLNonNull,
  GraphQLString,
  GraphQLObjectType,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const CardType = new GraphQLObjectType<any, ResolverContext>({
  name: "Card",
  fields: {
    display_brand: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The display brand of the card (e.g., Visa, Mastercard).",
    },
    last4: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The last 4 digits of the card.",
    },
  },
})

export const ConfirmationTokenType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ConfirmationToken",
  fields: {
    card: {
      type: CardType,
      resolve: ({ payment_method_preview }) => payment_method_preview.card,
    },
  },
})

export const ConfirmationToken: GraphQLFieldConfig<void, ResolverContext> = {
  type: ConfirmationTokenType,
  description: "Retrieve payment details of a Stripe confirmation token",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Stripe confirmation token",
    },
  },
  resolve: async (_root, { id }, { stripeConfirmationTokenLoader }) => {
    if (!stripeConfirmationTokenLoader) {
      throw new Error("You need to be authenticated to perform this action.")
    }

    try {
      // Use the loader to fetch the confirmation token details
      const result = await stripeConfirmationTokenLoader(id)
      return result
    } catch (error) {
      throw new Error(`Failed to fetch confirmation token: ${error.message}`)
    }
  },
}
