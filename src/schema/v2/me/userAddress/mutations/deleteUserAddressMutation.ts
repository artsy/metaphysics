import { GraphQLID, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { formatGravityError } from "lib/gravityErrorHandler"
import { UserAddressOrErrorsUnion } from "../types"
import { meType } from "../../index"

export const deleteUserAddressMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteUserAddress",
  inputFields: {
    userAddressID: { type: new GraphQLNonNull(GraphQLID) },
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
    { meDeleteUserAddressLoader }
  ) => {
    if (!meDeleteUserAddressLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const address = await meDeleteUserAddressLoader(userAddressID)
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
