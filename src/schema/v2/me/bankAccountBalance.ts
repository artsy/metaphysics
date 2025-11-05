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
  description: "",
  fields: () => ({
    balanceCents: {
      type: GraphQLInt,
      resolve: ({ balance_cents }) => balance_cents,
    },
    currencyCode: {
      type: GraphQLString,
      resolve: ({ currency_code }) => currency_code,
    },
  }),
})

export const MeBankAccountBalance: GraphQLFieldConfig<void, ResolverContext> = {
  args: {
    bankAccountId: {
      type: GraphQLID,
    },
    confirmationTokenId: {
      type: GraphQLID,
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
