import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { formatGravityError } from "lib/gravityErrorHandler"
import { UserAddressOrErrorsUnion } from "../types"
import { UserAddressAttributesInput } from "../types"
import { meType } from "../../index"
import { snakeCaseKeys } from "lib/helpers"

export const updateUserAddressMutation = mutationWithClientMutationId({
  name: "UpdateUserAddress",
  inputFields: {
    userAddressID: { type: new GraphQLNonNull(GraphQLString) },
    attributes: { type: new GraphQLNonNull(UserAddressAttributesInput) },
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
    { userAddressID, attributes },
    { meUpdateUserAddressLoader }
  ) => {
    if (!meUpdateUserAddressLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const gravityAttributes = snakeCaseKeys(attributes)
      const address = await meUpdateUserAddressLoader(
        userAddressID,
        gravityAttributes
      )
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
