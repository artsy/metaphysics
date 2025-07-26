import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { formatGravityError } from "lib/gravityErrorHandler"
import { UserAddressOrErrorsUnion } from "./types"

export const DeleteUserAddress = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteUserAddress",
  description: "Delete a user address",
  inputFields: {
    userAddressID: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    userAddressOrErrors: {
      type: UserAddressOrErrorsUnion,
      resolve: (result) => result,
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
      return await meDeleteUserAddressLoader(userAddressID)
    } catch (error) {
      console.error(error)
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
