import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { formatGravityError } from "lib/gravityErrorHandler"
import { UserAddressOrErrorsUnion } from "../types"
import { meType } from "../../index"

export const updateUserDefaultAddressMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateUserDefaultAddress",
  inputFields: {
    userAddressID: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    me: {
      type: meType,
      resolve: (_source, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
    userAddressOrErrors: {
      type: new GraphQLNonNull(UserAddressOrErrorsUnion),
      resolve: (result) => result.userAddressOrErrors || result,
    },
  },
  mutateAndGetPayload: async (
    { userAddressID },
    { meUpdateUserDefaultAddressLoader }
  ) => {
    if (!meUpdateUserDefaultAddressLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const address = await meUpdateUserDefaultAddressLoader(userAddressID)
      return { userAddressOrErrors: address }
    } catch (error) {
      console.error(error)
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return {
          userAddressOrErrors: {
            ...formattedErr,
            _type: "GravityMutationError",
          },
        }
      } else {
        return {
          userAddressOrErrors: {
            errors: [{ message: error.message || "An error occurred" }],
            _type: "GravityMutationError",
          },
        }
      }
    }
  },
})
