import { GraphQLID, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { SecondFactorOrErrorsUnionType } from "../secondFactors"
import { ResolverContext } from "types/graphql"

export const deliverSecondFactorMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeliverSecondFactor",
  inputFields: {
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
  mutateAndGetPayload: async ({ secondFactorID }, { deliverSecondFactor }) => {
    if (!deliverSecondFactor) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await deliverSecondFactor(secondFactorID)
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
