import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  AppSecondFactorAttributes,
  AppSecondFactorMutationResponseOrErrorsType,
} from "../secondFactors"
import { ResolverContext } from "types/graphql"

export const createAppSecondFactorMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateAppSecondFactor",
  inputFields: {
    password: {
      type: new GraphQLNonNull(GraphQLString),
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
    { password, attributes },
    { createSecondFactorLoader }
  ) => {
    if (!createSecondFactorLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const data = await createSecondFactorLoader({
        kind: "app",
        password,
        attributes,
      })

      return data[0]
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
