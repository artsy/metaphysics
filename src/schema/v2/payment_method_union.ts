import {
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
} from "graphql"
import { BankAccountType } from "schema/v2/bank_account"
import { CreditCardType } from "schema/v2/credit_card"

export const WireTransferType = new GraphQLObjectType({
  name: "WireTransfer",
  fields: () => ({
    isManualPayment: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  }),
})

export const PaymentMethodUnion = new GraphQLUnionType({
  name: "PaymentMethodUnion",
  types: [BankAccountType, CreditCardType, WireTransferType],
})
