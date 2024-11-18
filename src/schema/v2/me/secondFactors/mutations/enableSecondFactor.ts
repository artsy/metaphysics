import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { SecondFactorOrErrorsUnionType } from "../secondFactors"
import { ResolverContext } from "types/graphql"

export const enableSecondFactorMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "EnableSecondFactor",
  inputFields: {
    password: {
      type: new GraphQLNonNull(GraphQLString),
    },
    code: {
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
    recoveryCodes: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
    },
  },
  mutateAndGetPayload: async (
    { password, secondFactorID, code },
    { enableSecondFactorLoader }
  ) => {
    if (!enableSecondFactorLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const { factor, recovery_codes } = await enableSecondFactorLoader(
        secondFactorID,
        {
          password,
          code,
        }
      )

      return {
        ...factor,
        recoveryCodes: recovery_codes,
      }
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
