import { GraphQLString, GraphQLEnumType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  UserInterest,
  UserInterestCategory,
  userInterestCategoryEnum,
  UserInterestOwnerType,
  userInterestOwnerTypeEnum,
  userInterestType,
} from "./userInterests"
import { snakeCase } from "lodash"
import { meType } from "./index"

interface Input {
  interestId: string
  interestType: "Artist" | "Gene"
  category: UserInterestCategory
  body?: string
  userId?: string
  ownerType?: UserInterestOwnerType
  anonymousSessionId?: string
  sessionId?: string
}

const userInterestInterestTypeEnum = new GraphQLEnumType({
  name: "UserInterestInterestType",
  values: {
    ARTIST: { value: "Artist" },
    GENE: { value: "Gene" },
  },
})

export const createUserInterestMutation = mutationWithClientMutationId<
  Input,
  UserInterest | null,
  ResolverContext
>({
  name: "CreateUserInterestMutation",
  description:
    "Creates a UserInterest on the (logged in) user or for another user.",
  inputFields: {
    interestId: { type: new GraphQLNonNull(GraphQLString) },
    interestType: { type: new GraphQLNonNull(userInterestInterestTypeEnum) },
    category: { type: new GraphQLNonNull(userInterestCategoryEnum) },
    body: { type: GraphQLString, description: "Optional body for a note." },
    userId: {
      type: GraphQLString,
      description:
        "Optional userId field that is required when creating a UserInterest for another user.",
    },
    ownerType: {
      type: userInterestOwnerTypeEnum,
      description:
        "Optional ownerType field that is required when creating a UserInterest for another user.",
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
    { meCreateUserInterestLoader, createUserInterestLoader }
  ) => {
    if (!meCreateUserInterestLoader || !createUserInterestLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    // snake_case keys for Gravity (keys are the same otherwise)
    const userInterestInput = Object.keys(args).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
      {}
    )

    try {
      let userInterest: UserInterest
      if (args.userId) {
        // create interest for another user
        userInterest = await createUserInterestLoader?.(userInterestInput)
      } else {
        // create interest for 'me'
        userInterest = await meCreateUserInterestLoader?.(userInterestInput)
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

interface GravityError {
  statusCode: number
  body: { error: string; text?: string }
}
