import {
  GraphQLNonNull,
  GraphQLString,
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"

const CardType = new GraphQLObjectType<any, ResolverContext>({
  name: "Card",
  fields: {
    type: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The type of payment method.",
      resolve: () => "card",
    },
    displayBrand: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The display brand of the card (e.g., Visa, Mastercard).",
      resolve: ({ card }) => card.display_brand,
    },
    last4: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The last 4 digits of the card.",
      resolve: ({ card }) => card.last4,
    },
  },
})

const UsBankAccountType = new GraphQLObjectType<any, ResolverContext>({
  name: "USBankAccount",
  fields: {
    type: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The type of payment method.",
      resolve: () => "us_bank_account",
    },
    bankName: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The name of the bank.",
      resolve: ({ us_bank_account }) => us_bank_account.bank_name,
    },
    last4: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The last 4 digits of the bank account.",
      resolve: ({ us_bank_account }) => us_bank_account.last4,
    },
  },
})

const SepaType = new GraphQLObjectType<any, ResolverContext>({
  name: "SEPADebit",
  fields: {
    type: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The type of payment method.",
      resolve: () => "sepa_debit",
    },
    last4: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The last 4 digits of the bank account.",
      resolve: ({ sepa_debit }) => sepa_debit.last4,
    },
  },
})

const PaymentMethodPreviewUnion = new GraphQLUnionType({
  name: "PaymentMethodPreview",
  types: [CardType, UsBankAccountType, SepaType],
  resolveType: (obj) => {
    if (obj.type === "card") {
      return CardType
    }
    if (obj.type === "us_bank_account") {
      return UsBankAccountType
    }
    if (obj.type === "sepa_debit") {
      return SepaType
    }
    return null
  },
})

export const ConfirmationTokenType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ConfirmationToken",
  fields: {
    paymentMethodPreview: {
      type: new GraphQLNonNull(PaymentMethodPreviewUnion),
      resolve: ({ payment_method_preview }) => payment_method_preview,
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
