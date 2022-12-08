import { GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  UserInterest,
  UserInterestCategory,
  userInterestCategoryEnum,
  userInterestInterestTypeEnum,
  userInterestType,
} from "../userInterests"
import { snakeCase } from "lodash"
import { meType } from "./index"

interface Input {
  interestId: string
  interestType: "Artist" | "Gene"
  category: UserInterestCategory
  body?: string
  anonymousSessionId?: string
  sessionId?: string
}

export const createUserInterestMutation = mutationWithClientMutationId<
  Input,
  UserInterest | null,
  ResolverContext
>({
  name: "CreateUserInterestMutation",
  description:
    "Creates a UserInterest on the logged in User's CollectorProfile.",
  inputFields: {
    interestId: { type: new GraphQLNonNull(GraphQLString) },
    interestType: { type: new GraphQLNonNull(userInterestInterestTypeEnum) },
    category: { type: new GraphQLNonNull(userInterestCategoryEnum) },
    body: { type: GraphQLString, description: "Optional body for note" },
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
  mutateAndGetPayload: async (args, { meCreateUserInterestLoader }) => {
    if (!meCreateUserInterestLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    // snake_case keys for Gravity (keys are the same otherwise)
    const userInterestInput = Object.keys(args).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
      {}
    )

    try {
      const userInterest: UserInterest = await meCreateUserInterestLoader?.(
        userInterestInput
      )

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

interface GravityError {
  statusCode: number
  body: { error: string; text?: string }
}
