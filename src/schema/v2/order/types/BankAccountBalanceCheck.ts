import {
  GraphQLEnumType,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { OrderJSON } from "./exchangeJson"

export const BankAccountBalanceCheckResultEnum = new GraphQLEnumType({
  name: "BankAccountBalanceCheckResult",
  description: "The result of a bank account balance check",
  values: {
    SUFFICIENT: {
      value: "SUFFICIENT",
      description: "The bank account has sufficient funds for the order",
    },
    INSUFFICIENT: {
      value: "INSUFFICIENT",
      description: "The bank account does not have sufficient funds",
    },
    PENDING: {
      value: "PENDING",
      description:
        "Balance check is pending, external service has not returned result yet",
    },
    NOT_SUPPORTED: {
      value: "NOT_SUPPORTED",
      description: "This payment method does not support balance checks",
    },
    INVALID: {
      value: "INVALID",
      description:
        "The order is not valid for balance check (missing required data or in wrong state)",
    },
  },
})

export const BankAccountBalanceCheckType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BankAccountBalanceCheck",
  description:
    "Result of checking if a bank account has sufficient balance for an order",
  fields: {
    result: {
      type: new GraphQLNonNull(BankAccountBalanceCheckResultEnum),
      description: "The result of the balance check",
    },
    message: {
      type: GraphQLString,
      description:
        "Optional message providing additional context about the result",
    },
  },
})

export const resolveBankAccountBalanceCheck = async (
  order: OrderJSON,
  _args: any,
  context: ResolverContext
) => {
  const { meOrderBankAccountBalanceCheckLoader } = context

  if (!meOrderBankAccountBalanceCheckLoader) {
    return null
  }

  return await meOrderBankAccountBalanceCheckLoader(order.id)
}
