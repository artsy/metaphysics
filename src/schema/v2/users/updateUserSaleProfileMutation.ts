import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { snakeCase } from "lodash"

interface Input {
  id: string
  addressLine1?: string
}

interface GravityInput {
  id: string
  address_1?: string
}

interface GravityError {
  statusCode: number
  body: { error?: string; text?: string; message?: string }
}

export const updateUserSaleProfileMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "UpdateUserSaleProfileMutation",
  description: "Update the user sale profile",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    addressLine1: { type: GraphQLString },
  },
  outputFields: {},
  mutateAndGetPayload: async (args, { updateUserSaleProfileLoader }) => {
    if (!updateUserSaleProfileLoader) {
      throw new Error(
        "You need to be signed in as an admin to perform this action"
      )
    }

    const initialValue = {} as GravityInput
    const gravityOptions = Object.keys(args)
      .filter((key) => key !== "id")
      .reduce((acc, key) => {
        if (key === "addressLine1") {
          return { ...acc, address_1: args[key] }
        } else {
          return { ...acc, [snakeCase(key)]: args[key] }
        }
      }, initialValue)

    try {
      return await updateUserSaleProfileLoader?.(args.id, gravityOptions)
    } catch (err) {
      if ("body" in (err as any)) {
        const e = err as GravityError
        throw new Error(e.body.text ?? e.body.error ?? e.body.message)
      }

      throw err
    }
  },
})
