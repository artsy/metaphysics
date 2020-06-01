import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { CreditCardMutationType } from "../credit_card"
import { ResolverContext } from "types/graphql"

export const deleteCreditCardMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
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
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: ({ id }, { deleteCreditCardLoader }) => {
    if (!deleteCreditCardLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return deleteCreditCardLoader(id)
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
