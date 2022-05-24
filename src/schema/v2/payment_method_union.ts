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
  resolveType: (value: any) => {
    if (Boolean(value["bank_name"])) {
      return BankAccountType
    } else if (value["_isManualPayment"]) {
      return ManualWirePaymentType
    } else {
      return CreditCardType
    }
  },
})
