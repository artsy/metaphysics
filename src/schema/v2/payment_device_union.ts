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
      resolve: () => true,
    },
  }),
})

export const PaymentDeviceUnionType = new GraphQLUnionType({
  name: "PaymentDeviceUnion",
  types: [BankAccountType, CreditCardType, ManualPaymentType],
})
