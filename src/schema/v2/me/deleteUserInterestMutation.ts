import { GraphQLBoolean, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { UserInterest, userInterestType } from "./userInterests"
import { snakeCase } from "lodash"
import { meType } from "./index"

interface Input {
  id: string
  onMe?: boolean
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
    "Deletes a UserInterest on 'me' or another user's CollectorProfile.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    onMe: {
      type: GraphQLBoolean,
      defaultValue: true,
      description: "Delete on 'me' or another user's CollectorProfile",
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

    // check if we're deleting on 'me' or another user's CollectorProfile
    const onMe = args.onMe ?? true

    // snake_case keys for Gravity (keys are the same otherwise)
    const { id, ...gravityOptions } = Object.keys(args).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
      {} as GravityInput
    )

    try {
      let userInterest: UserInterest
      if (onMe === false) {
        // delete interest for another user
        userInterest = await deleteUserInterestLoader?.(id, gravityOptions)
      } else {
        // delete interest for 'me'
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
  onMe?: boolean
  anonymous_session_id?: string
  session_id?: string
}

interface GravityError {
  statusCode: number
  body: { error: string; text?: string }
}
