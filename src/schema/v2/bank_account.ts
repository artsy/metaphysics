import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFieldConfig,
} from "graphql"
import { InternalIDFields } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"

// fields: https://github.com/artsy/gravity/blob/main/db/schema.rb
export const BankAccountType = new GraphQLObjectType<any, ResolverContext>({
  name: "BankAccount",
  fields: () => ({
    ...InternalIDFields,
    bankName: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Bank name",
      resolve: ({ bank_name }) => bank_name,
    },
    accountHolderName: {
      type: GraphQLString,
      description: "Name on the bank account",
      resolve: ({ account_holder_name }) => account_holder_name,
    },
    last4: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Last four characters of the account identifier",
    },
  }),
})

export const BankAccount: GraphQLFieldConfig<void, ResolverContext> = {
  type: BankAccountType,
  description: "A user's bank account",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the bank account",
    },
  },
  resolve: async (_root, { id }, { bankAccountLoader }) => {
    const account = bankAccountLoader ? await bankAccountLoader(id) : null
    return account
  },
}
