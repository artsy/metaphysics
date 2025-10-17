import { GraphQLID, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { BackupSecondFactor } from "../me/secondFactors/secondFactors"

export const createAndSendBackupSecondFactorMutation = mutationWithClientMutationId(
  {
    name: "CreateAndSendBackupSecondFactor",
    inputFields: {
      userID: {
        type: new GraphQLNonNull(GraphQLID),
      },
    },
    outputFields: {
      factor: {
        type: new GraphQLNonNull(BackupSecondFactor),
        resolve: (result) => result,
      },
    },
    mutateAndGetPayload: async (
      { userID },
      { createAndSendBackupSecondFactorLoader }
    ) => {
      if (!createAndSendBackupSecondFactorLoader) {
        throw new Error("You need to be signed in to perform this action")
      }

      const { backup_code } = await createAndSendBackupSecondFactorLoader(
        userID
      )

      return {
        code: backup_code,
      }
    },
  }
)
