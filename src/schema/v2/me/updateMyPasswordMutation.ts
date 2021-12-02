import { GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { snakeCase } from "lodash"
import { meType } from "./index"

interface Input {
  currentPassword: string
  newPassword: string
  passwordConfirmation: string
}

interface GravityInput {
  current_password: string
  new_password: string
  password_confirmation: string
}

interface GravityError {
  statusCode: number
  body: { error?: string; text?: string; message?: string }
}

export const updateMyPasswordMutation = mutationWithClientMutationId<
  Input,
  any | null, // TODO: Type Me return type
  ResolverContext
>({
  name: "UpdateMyPasswordMutation",
  description: "Updates the logged in user's password",
  inputFields: {
    currentPassword: { type: new GraphQLNonNull(GraphQLString) },
    newPassword: { type: new GraphQLNonNull(GraphQLString) },
    passwordConfirmation: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_source, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
  },
  mutateAndGetPayload: async (args, { updateMyPasswordLoader }) => {
    if (!updateMyPasswordLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    // snake_case keys for Gravity (keys are the same otherwise)
    const gravityOptions = Object.keys(args).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
      {} as GravityInput
    )

    try {
      return await updateMyPasswordLoader?.(gravityOptions)
    } catch (err) {
      if ("body" in (err as any)) {
        const e = err as GravityError
        throw new Error(e.body.text ?? e.body.error ?? e.body.message)
      }

      throw err
    }
  },
})
