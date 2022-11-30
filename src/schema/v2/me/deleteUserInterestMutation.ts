import { GraphQLBoolean, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { UserInterest, userInterestType } from "./userInterests"
import { snakeCase } from "lodash"
import { meType } from "./index"

interface Input {
  id: string
  isOnMe?: boolean
  anonymousSessionId?: string
  sessionId?: string
}

export const deleteUserInterestMutation = mutationWithClientMutationId<
  Input,
  UserInterest | null,
  ResolverContext
>({
  name: "DeleteUserInterestMutation",
  description:
    "Deletes a UserInterest on the (logged in) user or for another user.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    isOnMe: {
      type: GraphQLBoolean,
      defaultValue: true,
      description:
        "Optional isOnMe field that is required when deleting a UserInterest for another user.",
    },
    anonymousSessionId: { type: GraphQLString },
    sessionID: { type: GraphQLString },
  },
  outputFields: {
    userInterest: {
      type: new GraphQLNonNull(userInterestType),
      resolve: (userInterest) => userInterest,
    },
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_source, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
  },
  mutateAndGetPayload: async (
    args,
    { meDeleteUserInterestLoader, deleteUserInterestLoader }
  ) => {
    if (!meDeleteUserInterestLoader || !deleteUserInterestLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    // check if the delete operation is for another user
    const isOnMe = args.isOnMe ?? true

    // snake_case keys for Gravity (keys are the same otherwise)
    const { id, ...gravityOptions } = Object.keys(args).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
      {} as GravityInput
    )

    try {
      let userInterest: UserInterest
      if (isOnMe === false) {
        // delete interest for another user
        userInterest = await deleteUserInterestLoader?.(id, gravityOptions)
      } else {
        // delete interest on the (logged in) user
        userInterest = await meDeleteUserInterestLoader?.(id, gravityOptions)
      }

      return userInterest
    } catch (err) {
      if ("body" in (err as any)) {
        const e = err as GravityError
        throw new Error(e.body.text ?? e.body.error)
      }

      throw err
    }
  },
})

interface GravityInput {
  id: string
  isOnMe?: boolean
  anonymous_session_id?: string
  session_id?: string
}

interface GravityError {
  statusCode: number
  body: { error: string; text?: string }
}
