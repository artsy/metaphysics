import {
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLInt,
  GraphQLString,
  GraphQLObjectType,
  GraphQLError,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const BankAccountBalanceType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BankAccountBalance",
  description: "The current balance of a bank account",
  fields: () => ({
    balanceCents: {
      type: GraphQLInt,
      description: "The balance in minor units (cents)",
      resolve: ({ balance_cents }) => balance_cents,
    },
    currencyCode: {
      type: GraphQLString,
      description: "The currency code of the balance",
      resolve: ({ currency_code }) => currency_code,
    },
  }),
})

export const MeBankAccountBalance: GraphQLFieldConfig<void, ResolverContext> = {
  description:
    "The current balance of a user's bank account. Requires either a bank account ID or a confirmation token ID.",
  args: {
    bankAccountId: {
      type: GraphQLID,
      description: "The ID of the bank account to query the balance for",
    },
    confirmationTokenId: {
      type: GraphQLID,
      description: "The confirmation token ID to query the balance for",
    },
  },
  type: BankAccountBalanceType,
  resolve: async (
    _root,
    { bankAccountId, confirmationTokenId },
    { meBankAccountBalanceLoader }
  ) => {
    if (!meBankAccountBalanceLoader) return null

    if (!!bankAccountId && !!confirmationTokenId) {
      throw new GraphQLError(
        "Only one of bankAccountId or confirmationTokenId should be provided"
      )
    }

    if (!bankAccountId && !confirmationTokenId) {
      throw new GraphQLError(
        "Either bankAccountId or confirmationTokenId must be provided"
      )
    }

    const params = bankAccountId
      ? { bank_account_id: bankAccountId }
      : { confirmation_token_id: confirmationTokenId }

    return await meBankAccountBalanceLoader(params)
  },
}
