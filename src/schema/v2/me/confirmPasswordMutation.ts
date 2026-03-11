import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

export const confirmPasswordMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "ConfirmPassword",
  description: "Confirms the user's password",
  inputFields: {
    password: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    valid: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ valid }) => valid,
    },
  },
  mutateAndGetPayload: async (args, { confirmPasswordLoader }) => {
    if (!confirmPasswordLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const response = await confirmPasswordLoader({ password: args.password })

    return {
      valid: response.valid,
    }
  },
})
