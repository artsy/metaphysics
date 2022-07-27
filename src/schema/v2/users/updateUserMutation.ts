import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { snakeCase } from "lodash"

interface Input {
  id: string
  dataTransferOptOut?: boolean
  email: string
  name: string
  phone?: string
}

interface GravityInput {
  id: string
  data_transfer_opt_out?: boolean
  email: string
  name: string
  phone?: string
}

interface GravityError {
  statusCode: number
  body: { error?: string; text?: string; message?: string }
}

export const updateUserMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "UpdateUserMutation",
  description: "Update the user",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    completedOnboardingAt: { type: GraphQLString },
    dataTransferOptOut: { type: GraphQLBoolean },
    email: { type: GraphQLString },
    name: { type: GraphQLString },
    phone: { type: GraphQLString },
  },
  outputFields: {},
  mutateAndGetPayload: async (args, { updateUserLoader }) => {
    if (!updateUserLoader) {
      throw new Error(
        "You need to be signed in as an admin to perform this action"
      )
    }

    const gravityOptions = Object.keys(args)
      .filter((key) => key !== "id")
      .reduce(
        (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
        {} as GravityInput
      )

    try {
      return await updateUserLoader?.(args.id, gravityOptions)
    } catch (err) {
      if ("body" in (err as any)) {
        const e = err as GravityError
        throw new Error(e.body.text ?? e.body.error ?? e.body.message)
      }

      throw err
    }
  },
})
