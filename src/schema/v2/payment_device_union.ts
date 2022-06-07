import {
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
} from "graphql"
import { BankAccountType } from "schema/v2/bank_account"
import { CreditCardType } from "schema/v2/credit_card"

export const ManualPaymentType = new GraphQLObjectType({
  name: "ManualPayment",
  fields: () => ({
    isManualPayment: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "present in case the __typename wasnt enough",
      resolve: (_object) => {
        console.error("im in the resolver!")
        console.warn(_object)
        // throw new Error("???")
        return true
      },
    },
  }),
})

export const PaymentDeviceUnionType = new GraphQLUnionType({
  name: "PaymentDeviceUnion",
  types: [BankAccountType, CreditCardType, ManualPaymentType],
  resolveType: (value) => {
    if (value.foo === 42) {
      return ManualPaymentType
    }
  },
})
