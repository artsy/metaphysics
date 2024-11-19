import { GraphQLID, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { SecondFactorOrErrorsUnionType } from "../secondFactors"
import { ResolverContext } from "types/graphql"

export const disableSecondFactorMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DisableSecondFactor",
  inputFields: {
    password: {
      type: new GraphQLNonNull(GraphQLString),
    },
    secondFactorID: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  outputFields: {
    secondFactorOrErrors: {
      type: SecondFactorOrErrorsUnionType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { password, secondFactorID },
    { disableSecondFactorLoader }
  ) => {
    if (!disableSecondFactorLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await disableSecondFactorLoader(secondFactorID, {
        password,
      })
    } catch (error) {
      const { body } = error
      return {
        errors: [
          {
            message: body.message ?? body.error,
            code: "invalid",
          },
        ],
      }
    }
  },
})
