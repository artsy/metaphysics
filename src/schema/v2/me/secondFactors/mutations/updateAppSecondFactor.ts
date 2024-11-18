import { GraphQLID, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  AppSecondFactorAttributes,
  AppSecondFactorMutationResponseOrErrorsType,
} from "../secondFactors"
import { ResolverContext } from "types/graphql"

export const updateAppSecondFactorMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateAppSecondFactor",
  inputFields: {
    secondFactorID: {
      type: new GraphQLNonNull(GraphQLID),
    },
    attributes: {
      type: new GraphQLNonNull(AppSecondFactorAttributes),
    },
  },
  outputFields: {
    secondFactorOrErrors: {
      type: AppSecondFactorMutationResponseOrErrorsType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { attributes, secondFactorID },
    { updateSecondFactorLoader }
  ) => {
    if (!updateSecondFactorLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await updateSecondFactorLoader(secondFactorID, {
        kind: "app",
        attributes,
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
