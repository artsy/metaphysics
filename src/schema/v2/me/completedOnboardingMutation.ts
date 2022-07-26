import { GraphQLString, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { UserType } from "../user"

interface GravityError {
  statusCode: number
  body: { error?: string; text?: string; message?: string }
}

interface Input {
  timestamp: string
  userID: string
}

export const completedOnboardingMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CompletedOnboardingMutation",
  description:
    "Sends a timestamp to the server that the user has completed onboarding",
  inputFields: {
    timestamp: {
      type: new GraphQLNonNull(GraphQLString),
    },
    userID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    user: {
      type: new GraphQLNonNull(UserType),
      resolve: (user) => user,
    },
  },
  mutateAndGetPayload: async ({ timestamp, userID }, { updateUserLoader }) => {
    if (!updateUserLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      return await updateUserLoader(userID, {
        completed_onboarding_at: timestamp,
      })
    } catch (error) {
      if ("body" in (error as any)) {
        const e = error as GravityError
        throw new Error(e.body.text ?? e.body.error ?? e.body.message)
      }
      throw error
    }
  },
})
