import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { BackupSecondFactorsMutationResponseOrErrorsType } from "../secondFactors"
import { ResolverContext } from "types/graphql"

export const createBackupSecondFactorsMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateBackupSecondFactors",
  inputFields: {
    password: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    secondFactorsOrErrors: {
      type: BackupSecondFactorsMutationResponseOrErrorsType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ password }, { createSecondFactorLoader }) => {
    if (!createSecondFactorLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const data = await createSecondFactorLoader({
        kind: "backup",
        password,
      })

      return {
        secondFactors: data,
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
