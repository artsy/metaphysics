import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { CreditCardMutationType } from "../credit_card"

export const deleteCreditCardMutation = mutationWithClientMutationId({
  name: "DeleteCreditCard",
  description: "Remove a credit card",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    creditCardOrError: {
      type: CreditCardMutationType,
      resolve: result => result,
    },
  },
  mutateAndGetPayload: (
    { id },
    _request,
    { rootValue: { accessToken, deleteCreditCardLoader } }
  ) => {
    if (!accessToken) {
      throw new Error("You need to be signed in to perform this action")
    }

    return deleteCreditCardLoader(id)
      .then(result => result)
      .catch(error => {
        const formattedErr = formatGravityError(error)

        if (formattedErr) {
          return { ...formattedErr, _type: "GravityMutationError" }
        } else {
          throw new Error(error)
        }
      })
  },
})
