import { mutationWithClientMutationId, MutationConfig } from "graphql-relay"
import { SubmissionType } from "./submission"
import { omit } from "lodash"
import { ResolverContext } from "types/graphql"

export const config: MutationConfig<any, any, ResolverContext> = {
  name: "CreateSubmissionMutation",
  description: "Create a new consignment submission using Convection",
  inputFields: {
    ...omit(SubmissionType.getFields(), ["id", "_id", "__id", "artist"]),
  } as any,
  outputFields: {
    consignment_submission: {
      type: SubmissionType,
      resolve: response => response,
    },
  },
  mutateAndGetPayload: (request, { submissionCreateLoader }) => {
    if (!submissionCreateLoader) return null
    return submissionCreateLoader(request)
  },
}
export default mutationWithClientMutationId(config)
