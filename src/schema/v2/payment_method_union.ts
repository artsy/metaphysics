import { GraphQLBoolean, GraphQLObjectType, GraphQLUnionType } from "graphql"
import { BankAccountType } from "schema/v2/bank_account"
import { CreditCardType } from "schema/v2/credit_card"

const ManualWirePaymentType = new GraphQLObjectType({
  name: "ManualWirePayment",
  fields: {
    isManualPayment: {
      type: GraphQLBoolean,
      resolve: () => true,
    },
  },
})

export const PaymentMethodUnionType = new GraphQLUnionType({
  name: "PaymentMethodUnion",
  types: [BankAccountType, CreditCardType, ManualWirePaymentType],
  resolveType: ({ __typename }) => {
    switch (__typename) {
      // TODO: I don't know why this works with a broken resolver
      // case "CreditCard":
      //   return CreditCardType
      // case "BankAccount":
      //   return BankAccountType
      // case "ManualWirePayment":
      //   return ManualWirePaymentType
      default:
        return null
    }
  },
})
