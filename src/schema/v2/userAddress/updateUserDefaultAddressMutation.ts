import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { formatGravityError } from "lib/gravityErrorHandler"
import { UserAddressOrErrorsUnion } from "./types"

export const UpdateUserDefaultAddress = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateUserDefaultAddress",
  description: "Set a user address as default",
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
    { meUpdateUserDefaultAddressLoader }
  ) => {
    if (!meUpdateUserDefaultAddressLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await meUpdateUserDefaultAddressLoader(userAddressID)
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
