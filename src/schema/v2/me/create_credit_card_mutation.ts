import { GraphQLNonNull, GraphQLString, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { CreditCardMutationType } from "../credit_card"
import { ResolverContext } from "types/graphql"
import { meType } from "./index"

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "CreditCard",
  description: "Create a credit card",
  inputFields: {
    token: {
      type: new GraphQLNonNull(GraphQLString),
    },
    oneTimeUse: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
  },
  outputFields: {
    me: {
      type: meType,
      resolve: (_result, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
    creditCardOrError: {
      type: CreditCardMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: ({ token, oneTimeUse }, { createCreditCardLoader }) => {
    if (!createCreditCardLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return createCreditCardLoader({
      token,
      one_time_use: oneTimeUse,
      provider: "stripe",
    })
      .then((result) => result)
      .catch((error) => {
        const formattedErr = formatGravityError(error)
        if (formattedErr) {
          return { ...formattedErr, _type: "GravityMutationError" }
        } else {
          throw new Error(error)
        }
      })
  },
})
