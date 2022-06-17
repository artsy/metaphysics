import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFieldConfig,
  GraphQLUnionType,
} from "graphql"
import {
  connectionDefinitions,
  cursorForObjectInConnection,
} from "graphql-relay"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
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

const BankAccountMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BankAccountMutationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    bankAccount: {
      type: BankAccount.type,
      resolve: (bankAccount) => bankAccount,
    },
    bankAccountEdge: {
      type: BankAccountEdge,
      resolve: (bankAccount) => {
        return {
          cursor: cursorForObjectInConnection([bankAccount], bankAccount),
          node: bankAccount,
        }
      },
    },
  }),
})

const BankAccountMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BankAccountMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

export const BankAccountMutationType = new GraphQLUnionType({
  name: "BankAccountMutationType",
  types: [BankAccountMutationSuccessType, BankAccountMutationFailureType],
})

export const {
  connectionType: BankAccountConnection,
  edgeType: BankAccountEdge,
} = connectionDefinitions({
  nodeType: BankAccountType,
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
