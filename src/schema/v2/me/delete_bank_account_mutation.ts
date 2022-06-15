import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { BankAccountMutationType } from "../bank_account"
import { ResolverContext } from "types/graphql"
import { meType } from "./index"

export const deleteBankAccountMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteBankAccount",
  description: "Remove a bank account",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    me: {
      type: meType,
      resolve: (_result, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
    bankAccountOrError: {
      type: BankAccountMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: ({ id }, { deleteBankAccountLoader }) => {
    if (!deleteBankAccountLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return deleteBankAccountLoader(id)
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
