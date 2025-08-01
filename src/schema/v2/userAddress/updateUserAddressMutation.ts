import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { formatGravityError } from "lib/gravityErrorHandler"
import { UserAddressAttributesInput, UserAddressOrErrorsUnion } from "./types"

export const UpdateUserAddress = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateUserAddress",
  description: "Update a user address",
  inputFields: {
    userAddressID: { type: new GraphQLNonNull(GraphQLString) },
    attributes: { type: new GraphQLNonNull(UserAddressAttributesInput) },
  },
  outputFields: {
    userAddressOrErrors: {
      type: UserAddressOrErrorsUnion,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { userAddressID, attributes },
    { meUpdateUserAddressLoader }
  ) => {
    if (!meUpdateUserAddressLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await meUpdateUserAddressLoader(userAddressID, attributes)
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
