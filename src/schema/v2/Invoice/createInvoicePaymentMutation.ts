import {
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLFloat,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { InvoicePaymentType } from "./invoice"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateInvoicePaymentSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    invoicePayment: {
      type: InvoicePaymentType,
      resolve: (data) => data,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateInvoicePaymentFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateInvoicePaymentResponseOrError",
  types: [SuccessType, ErrorType],
})

export const createInvoicePaymentMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateInvoicePayment",
  inputFields: {
    invoiceID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    invoiceToken: {
      type: new GraphQLNonNull(GraphQLString),
    },
    creditCardToken: {
      type: new GraphQLNonNull(GraphQLString),
    },
    provider: {
      type: new GraphQLNonNull(GraphQLString),
    },
    amountMinor: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { invoiceID, ...args },
    { createInvoicePaymentLoader }
  ) => {
    try {
      const gravityArgs = {
        token: args.invoiceToken,
        credit_card_token: args.creditCardToken,
        provider: args.provider,
        amount_cents: args.amountMinor,
      }

      const response = await createInvoicePaymentLoader(invoiceID, gravityArgs)

      return response
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
