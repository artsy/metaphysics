import { GraphQLBoolean, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { formatGravityError } from "lib/gravityErrorHandler"
import { UserAddressAttributesInput, UserAddressOrErrorsUnion } from "./types"

export const CreateUserAddress = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateUserAddress",
  description: "Create a new user address",
  inputFields: {
    attributes: { type: new GraphQLNonNull(UserAddressAttributesInput) },
    isDefault: { type: GraphQLBoolean },
  },
  outputFields: {
    userAddressOrErrors: {
      type: UserAddressOrErrorsUnion,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { attributes, isDefault },
    { meCreateUserAddressLoader }
  ) => {
    if (!meCreateUserAddressLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const payload = {
        ...attributes,
        is_default: isDefault,
      }
      return await meCreateUserAddressLoader(payload)
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
